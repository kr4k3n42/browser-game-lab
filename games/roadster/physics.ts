// Playable approximations, NOT measured Tesla Rocket parameters.
export const tuning={massKg:2000,powerWatts:1_000_000,wheelbase:2.9,rideHeight:.9,gravity:9.81,liftAcceleration:27,boostAcceleration:18,fullThrustSeconds:8,maxSpeed:103};
export type DriveInput={throttle:number;brake:number;steer:number;lift:number;boost:number;pitch:number;roll:number;stabilize:boolean};
export type CarState={x:number;y:number;z:number;vx:number;vy:number;vz:number;yaw:number;pitch:number;roll:number;yawRate:number;pitchRate:number;rollRate:number;gas:number;grounded:boolean;crashed:boolean;airTime:number;lastLanding:number;landings:number;launched:boolean};
export const zeroInput=():DriveInput=>({throttle:0,brake:0,steer:0,lift:0,boost:0,pitch:0,roll:0,stabilize:false});
export function newCarState():CarState{return {x:0,y:.74,z:-100,vx:0,vy:0,vz:0,yaw:0,pitch:0,roll:0,yawRate:0,pitchRate:0,rollRate:0,gas:1,grounded:true,crashed:false,airTime:0,lastLanding:0,landings:0,launched:false};}
export function groundHeight(x:number,z:number){return Math.abs(x)<7&&z>=35&&z<=65?(z-35)*.22:0;}
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function stepCar(s:CarState,input:DriveInput,dt:number){
  if(dt<=0)return;
  if(s.crashed){s.vx*=Math.exp(-dt*5);s.vz*=Math.exp(-dt*5);return;}
  const sy=Math.sin(s.yaw),cy=Math.cos(s.yaw),cp=Math.cos(s.pitch),sp=Math.sin(s.pitch);
  const forward={x:sy*cp,y:-sp,z:cy*cp};
  const localForward=s.vx*sy+s.vz*cy,lateral=s.vx*cy-s.vz*sy;
  const front=groundHeight(s.x+sy*1.45,s.z+cy*1.45),rear=groundHeight(s.x-sy*1.45,s.z-cy*1.45);
  const floor=Math.max(groundHeight(s.x,s.z),(front+rear)/2),slope=-Math.atan2(front-rear,tuning.wheelbase);
  const previousGrounded=s.grounded;
  s.grounded=s.y<=floor+1.04&&s.vy<2.5;
  let ax=0,ay=-tuning.gravity,az=0;
  if(s.grounded){
    const tireGrip=Math.abs(s.x)<150&&Math.abs(s.z)<300?1:.45;
    const drive=clamp(input.throttle,-1,1)*Math.min(10.8,tuning.powerWatts/tuning.massKg/Math.max(8,Math.abs(localForward)))*tireGrip;
    const braking=Math.abs(localForward)>.03?-Math.sign(localForward)*Math.min(Math.abs(localForward)/dt,input.brake*16):0;
    ax+=sy*(drive+braking)-cy*lateral*Math.min(7*tireGrip,1/dt);
    az+=cy*(drive+braking)+sy*lateral*Math.min(7*tireGrip,1/dt);
    ay+=Math.max(0,65*(floor+tuning.rideHeight-s.y)-13*s.vy);
    const steerAngle=input.steer*.47/(1+Math.abs(localForward)/30);
    const desiredYaw=localForward/tuning.wheelbase*Math.tan(steerAngle);
    s.yawRate+=(desiredYaw-s.yawRate)*(1-Math.exp(-dt*8));
    s.pitchRate+=((slope-s.pitch)*35-s.pitchRate*9)*dt;
    const bodyLean=clamp(-s.yawRate*localForward*.0015,-.09,.09);
    s.rollRate+=((bodyLean-s.roll)*40-s.rollRate*10)*dt;
  }
  const clearance=Math.max(.2,s.y-floor-.74);
  const landingLift=input.stabilize&&!s.grounded&&s.vy<-2&&clearance<14?clamp((tuning.gravity+s.vy*s.vy/(2*clearance))/tuning.liftAcceleration,0,1):0;
  const lift=Math.max(input.lift,landingLift);
  const request=Math.max(lift,input.boost,Math.abs(input.pitch)*.25,Math.abs(input.roll)*.25,!s.grounded?Math.abs(input.steer)*.25:0,input.stabilize?.35:0);
  const used=Math.min(s.gas,request*dt/tuning.fullThrustSeconds),availability=request>0?used/(request*dt/tuning.fullThrustSeconds):0;
  s.gas=Math.max(0,s.gas-used);
  if(availability>0){
    // Body-up cold gas lift: tilting the vehicle redirects the force.
    const ux=-sy*sp*Math.cos(s.roll)-cy*Math.sin(s.roll),uy=cp*Math.cos(s.roll),uz=-cy*sp*Math.cos(s.roll)+sy*Math.sin(s.roll);
    ax+=availability*(ux*lift*tuning.liftAcceleration+forward.x*input.boost*tuning.boostAcceleration);
    ay+=availability*(uy*lift*tuning.liftAcceleration+forward.y*input.boost*tuning.boostAcceleration);
    az+=availability*(uz*lift*tuning.liftAcceleration+forward.z*input.boost*tuning.boostAcceleration);
    if(!s.grounded){s.pitchRate+=input.pitch*1.8*dt*availability;s.rollRate+=input.roll*2*dt*availability;s.yawRate+=input.steer*1.3*dt*availability;}
    if(input.stabilize){const damping=Math.exp(-dt*4*availability);s.pitchRate*=damping;s.rollRate*=damping;s.yawRate*=damping;if(!s.grounded){s.pitchRate-=s.pitch*2*dt*availability;s.rollRate-=s.roll*2*dt*availability;}}
  }
  const speed=Math.hypot(s.vx,s.vy,s.vz),drag=.0018*speed;
  ax-=s.vx*drag;ay-=s.vy*drag*.2;az-=s.vz*drag;
  s.vx+=ax*dt;s.vy+=ay*dt;s.vz+=az*dt;
  const horizontal=Math.hypot(s.vx,s.vz);if(horizontal>tuning.maxSpeed){s.vx*=tuning.maxSpeed/horizontal;s.vz*=tuning.maxSpeed/horizontal;}
  s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
  s.yaw+=s.yawRate*dt;s.pitch+=s.pitchRate*dt;s.roll+=s.rollRate*dt;
  if(!s.grounded){s.airTime+=dt;if(s.airTime>.15)s.launched=true;}
  if(s.grounded&&!previousGrounded&&s.airTime>.3){
    s.lastLanding=Math.abs(s.vy);s.landings++;s.airTime=0;
    if(s.lastLanding>12||Math.abs(s.pitch-slope)>.85||Math.abs(s.roll)>.85)s.crashed=true;
  }
  const newFloor=groundHeight(s.x,s.z);
  if(s.y<newFloor+.3){s.y=newFloor+.3;if(s.vy<0)s.vy=0;}
  // Bounded proving ground: an obvious safety fence, not an invisible reset.
  if(Math.abs(s.x)>260||Math.abs(s.z)>430){s.x=clamp(s.x,-260,260);s.z=clamp(s.z,-430,430);if(horizontal>15)s.crashed=true;s.vx*=-.2;s.vz*=-.2;}
}
