import { Engine, Scene, FreeCamera, Vector3, Quaternion, Matrix, Color3, Color4, MeshBuilder, StandardMaterial, HemisphericLight, TransformNode } from '@babylonjs/core';
import './style.css';
import { createAstronautBody } from './body';
import { createMobileControls } from './mobile';
import { boxContact, ringContact, boxesContact, collisionImpulse } from './collision';

const canvas=document.querySelector<HTMLCanvasElement>('#flight')!;
const engine=new Engine(canvas,true),scene=new Scene(engine);
scene.clearColor=new Color4(.003,.006,.015,1);
const camera=new FreeCamera('eyes',Vector3.Zero(),scene);camera.inputs.clear();camera.minZ=.03;camera.fov=1.15;
new HemisphericLight('ambient',new Vector3(0,1,0),scene).intensity=.8;
function mat(name:string,color:string,glow=false){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);if(glow)m.emissiveColor=m.diffuseColor;return m;}
const metal=mat('metal','#263a48'),white=mat('gloves','#d3d9db'),cyan=mat('cyan','#69efd4',true),gold=mat('gold','#efb75d',true);
let seed=73;function rand(){seed=(seed*16807)%2147483647;return seed/2147483647;}
const starWhite=mat('star-white','#d5e6ff',true),starBlue=mat('star-blue','#8cbcff',true),starWarm=mat('star-warm','#ffd6a1',true);
const starShell=new TransformNode('distant-stars',scene);
function star(direction:Vector3,size:number,index:number){
  const mesh=MeshBuilder.CreateSphere('star-'+index,{diameter:size,segments:4},scene);
  mesh.parent=starShell;mesh.position=direction.normalize().scale(450);
  mesh.material=[starWhite,starBlue,starWarm][index%3];mesh.isPickable=false;
}
for(let i=0;i<900;i++){
  const y=rand()*2-1,angle=rand()*Math.PI*2,r=Math.sqrt(1-y*y);
  star(new Vector3(r*Math.cos(angle),y,r*Math.sin(angle)),i%23===0?.65:.14+rand()*.22,i);
}
// Distinct clusters provide rotational landmarks without drawing a navigation grid.
for(let i=0;i<7;i++)star(new Vector3(-.5+i*.065,.32+Math.sin(i*1.3)*.08,1),.7,1000+i);
for(let i=0;i<5;i++)star(new Vector3(.7+Math.sin(i)*.08,-.12+i*.055,1),.6,1100+i);
const planet=MeshBuilder.CreateSphere('planet',{diameter:100,segments:48},scene);planet.position.set(90,-65,160);planet.material=mat('planet blue','#17496a');
const positions=[new Vector3(0,0,12),new Vector3(10,4,22),new Vector3(-5,-3,32)];
const anchors=positions.map((p,i)=>{const root=new TransformNode('anchor'+i,scene);root.position=p.clone();const box=MeshBuilder.CreateBox('platform',{width:3,height:.3+i*.45,depth:3},scene);box.parent=root;box.position.y=-1-i*.225;box.material=metal;const ring=MeshBuilder.CreateTorus('handhold',{diameter:1.4,thickness:.13},scene);ring.parent=root;ring.rotation.x=Math.PI/2;ring.material=cyan;return ring;});
const cargo=anchors.map((ring,i)=>({root:ring.parent as TransformNode, mass:180+i*100, velocity:Vector3.Zero(), spin:Vector3.Zero(), orientation:Quaternion.Identity(), visited:false}));
const astronautMass=100;
const helmet=document.querySelector<HTMLElement>('#helmet')!;
let impactFlash=0;
function updateCollisionWarning(dt:number){
  impactFlash=Math.max(0,impactFlash-dt);
  let imminent=false;
  const danger=cargo.map((c,i)=>{
    if(held===i)return false;
    const relative=velocity.subtract(c.velocity),offset=c.root.position.subtract(position);
    const speedSquared=relative.lengthSquared();
    if(speedSquared<1)return false;
    const distance=offset.length(),closing=Vector3.Dot(relative,offset)/Math.max(distance,.001);
    const time=Vector3.Dot(offset,relative)/speedSquared;
    // Predict a near pass in the next five seconds, rather than warning on speed alone.
    const risk=closing>1&&time>0&&time<5&&offset.subtract(relative.scale(time)).length()<2.5;
    if(risk&&(distance<2.5||time<1.2))imminent=true;
    return risk;
  }).some(Boolean);
  helmet.classList.toggle('collision-warning',danger&&impactFlash===0);
  helmet.classList.toggle('hard-impact',impactFlash>0);
  helmet.style.setProperty('--impact-opacity',String(Math.min(1,impactFlash/.3)));
  const stable=attached?velocity.subtract(cargo[held].velocity).length()<.02:velocity.length()<.02&&angular.length()<.005;
  const state=imminent||impactFlash>0?'imminent':danger?'warning':stable?'stable':'drifting';
  flightStatus.dataset.state=state;flightStatus.textContent='';
  flightStatus.setAttribute('aria-label',state==='imminent'?'Collision imminent or hard impact':state==='warning'?'Impact warning':state==='stable'?'Stable':'Drifting');
  flightStatus.title=flightStatus.getAttribute('aria-label')!;
}
// Navigation stays on the helmet, independent of the head-glance HUD offset.
const navigation=document.createElement('div');navigation.id='edge-navigation';
navigation.setAttribute('aria-hidden','true');document.body.append(navigation);
function formatMass(kg:number){
  if(!Number.isFinite(kg)||kg<=0)return 'MASS UNRESOLVED';
  const units:[[number,string],[number,string],[number,string],[number,string]]=[[1e12,'billion tonnes'],[1e9,'million tonnes'],[1e3,'tonnes'],[1,'kg']];
  const [scale,unit]=units.find(([scale])=>kg>=scale)??units[3];
  return `≈${(kg/scale).toLocaleString('en-US',{maximumFractionDigits:1})} ${unit}`;
}
const beacons=cargo.map(c=>{const marker=document.createElement('div');marker.className='edge-beacon';marker.innerHTML='<span class="beacon-chevron">›</span><span class="beacon-label"><span class="beacon-name"></span><br><span class="beacon-distance"></span><br><span class="beacon-rate"></span></span>';marker.querySelector('.beacon-name')!.textContent=formatMass(c.mass);navigation.append(marker);marker.title='Estimated mass: '+formatMass(c.mass);return marker;});
function updateNavigation(){
  const w=canvas.clientWidth,h=canvas.clientHeight;
  const border=parseFloat(getComputedStyle(document.querySelector('#helmet')!).borderTopWidth);
  const inset=border+20,halfW=w/2-inset,halfH=h/2-inset;
  if(halfW<=0||halfH<=0)return;
  const rx=Math.max(1,w*.2-inset),ry=Math.max(1,h*.2-inset);
  const inside=(x:number,y:number)=>{
    if(Math.abs(x)>halfW||Math.abs(y)>halfH)return false;
    const cx=Math.max(0,Math.abs(x)-(halfW-rx))/rx,cy=Math.max(0,Math.abs(y)-(halfH-ry))/ry;
    return cx*cx+cy*cy<=1;
  };
  const inverse=camera.rotationQuaternion!.conjugate(),tan=Math.tan(camera.fov/2),aspect=engine.getAspectRatio(camera);
  cargo.forEach((c,i)=>{
    const delta=c.root.position.subtract(camera.position),local=rotate(delta,inverse);
    const depth=Math.max(Math.abs(local.z),.001);
    const x=local.x/depth/tan/aspect*w/2,y=-local.y/depth/tan*h/2;
    const marker=beacons[i];
    const distance=delta.length(),visible=local.z>0&&inside(x,y);
    marker.hidden=distance<.1;
    if(marker.hidden)return;
    // Behind the astronaut, choose the shortest turn; exactly aft uses the lower edge.
    const length=Math.hypot(x,y),dx=length>.001?x/length:0,dy=length>.001?y/length:1;
    let markerX:number,markerY:number;
    if(visible){
      // Keep the ring clear: the chevron tip points toward its projected center.
      markerX=x-dx*28;markerY=y-dy*28;
    }else{
      let lo=0,hi=Math.hypot(w,h);
      for(let step=0;step<20;step++){const mid=(lo+hi)/2;if(inside(dx*mid,dy*mid))lo=mid;else hi=mid;}
      markerX=dx*lo;markerY=dy*lo;
    }
    marker.style.left=`${w/2+markerX}px`;marker.style.top=`${h/2+markerY}px`;
    marker.classList.toggle('attached-beacon',held===i);
    marker.querySelector<HTMLElement>('.beacon-chevron')!.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
    const label=marker.querySelector<HTMLElement>('.beacon-label')!;
    const closing=Vector3.Dot(velocity.subtract(c.velocity),delta.scale(1/distance));
    const rate=Math.abs(closing)<.005?0:closing;
    label.querySelector<HTMLElement>('.beacon-distance')!.textContent=`${distance.toFixed(1)} m`;
    const speedLabel=label.querySelector<HTMLElement>('.beacon-rate')!;
    speedLabel.textContent=`${rate>0?'+':''}${rate.toFixed(2)} m/s`;
    speedLabel.dataset.motion=rate>0?'closing':rate<0?'receding':'neutral';
    label.style.transform=`translate(${-dx*76}px,${-dy*42}px)`;
  });
}
let held=-1;
let latched=false;
let gripOffset=Vector3.Zero(),gripOrientation=Quaternion.Identity();
function rotate(v:Vector3,q:Quaternion){return Vector3.TransformNormal(v,Matrix.FromQuaternionToRef(q,Matrix.Identity()));}
function releaseGrip(){
  if(held<0)return;
  const c=cargo[held],offset=rotate(gripOffset,c.orientation);
  velocity=c.velocity.add(Vector3.Cross(c.spin,offset));
  angular=rotate(c.spin,body.conjugate());
  anchors[held].material=cyan;
  held=-1;attached=false;latched=false;
  message.textContent='Released. Cargo and astronaut retain momentum.';
}
function grab(){
  if(held>=0)return;
  const index=cargo.findIndex(c=>Vector3.Distance(position,c.root.position)<2.5&&velocity.subtract(c.velocity).length()<1);
  if(index<0){message.textContent='Grab requires range < 2.5 m and relative speed < 1 m/s.';return;}
  const c=cargo[index],total=astronautMass+c.mass;
  c.velocity=c.velocity.scale(c.mass/total).add(velocity.scale(astronautMass/total));
  c.spin=c.spin.scale(c.mass/total).add(rotate(angular,body).scale(astronautMass/total));
  gripOffset=rotate(position.subtract(c.root.position),c.orientation.conjugate());
  gripOrientation=c.orientation.conjugate().multiply(body);
  held=index;attached=true;
  anchors[index].material=gold;
  if(!c.visited){c.visited=true;checkpoint++;}
  message.textContent='Grip secured. Thrusters now move the combined mass. Release Space to let go; Enter secures the anchor.';
}
function bumpStations(){
  if(held>=0)return;
  // Three overlapping spheres approximate helmet, torso and legs.
  for(let i=0;i<cargo.length;i++){
    const c=cargo[i],height=.3+i*.45;
    for(const y of [0,-.4,-.8]){
      const sample=position.add(rotate(new Vector3(0,y,0),body));
      const local=rotate(sample.subtract(c.root.position),c.orientation.conjugate());
      const hit=boxContact(local,new Vector3(0,-1-i*.225,0),new Vector3(1.5,height/2,1.5),.32)??ringContact(local,.32);
      if(!hit)continue;
      const normal=rotate(hit.normal,c.orientation),invA=1/astronautMass,invB=1/c.mass,total=invA+invB;
      position.addInPlace(normal.scale((hit.depth+.001)*invA/total));
      c.root.position.subtractInPlace(normal.scale((hit.depth+.001)*invB/total));
      const closing=Vector3.Dot(velocity.subtract(c.velocity),normal);
      if(closing<0){
        if(-closing>=2)impactFlash=.9;
        const impulse=-(1+.12)*closing/total;
        velocity.addInPlace(normal.scale(impulse*invA));
        c.velocity.subtractInPlace(normal.scale(impulse*invB));
        message.textContent='Suit contact. Momentum transferred to station '+(i+1)+'.';
      }
    }
  }
}
function collideCargo(){
  const box=(i:number)=>({center:cargo[i].root.position.add(rotate(new Vector3(0,-1-i*.225,0),cargo[i].orientation)),half:new Vector3(1.5,(.3+i*.45)/2,1.5),orientation:cargo[i].orientation});
  for(let a=0;a<cargo.length;a++)for(let b=a+1;b<cargo.length;b++){
    const ca=cargo[a],cb=cargo[b];
    let hit=boxesContact(box(a),box(b));
    // Ring rims use small spheres against the other base; their holes stay open.
    if(!hit)for(const [source,target] of [[a,b],[b,a]]){
      for(let k=0;k<32;k++){
        const angle=k*Math.PI/16;
        const point=cargo[source].root.position.add(rotate(new Vector3(Math.cos(angle)*.7,Math.sin(angle)*.7,0),cargo[source].orientation));
        const targetBox=box(target);
        const local=rotate(point.subtract(targetBox.center),cargo[target].orientation.conjugate());
        const contact=boxContact(local,Vector3.Zero(),targetBox.half,.08);
        if(contact){const n=rotate(contact.normal,cargo[target].orientation);hit={normal:source===a?n.scale(-1):n,depth:contact.depth};break;}
      }
      if(hit)break;
    }
    if(!hit)for(let ka=0;ka<32&&!hit;ka++)for(let kb=0;kb<32;kb++){
      const rim=(i:number,k:number)=>cargo[i].root.position.add(rotate(new Vector3(Math.cos(k*Math.PI/16)*.7,Math.sin(k*Math.PI/16)*.7,0),cargo[i].orientation));
      const delta=rim(b,kb).subtract(rim(a,ka)),distance=delta.length();
      if(distance<.16){hit={normal:distance>1e-8?delta.scale(1/distance):Vector3.Right(),depth:.16-distance};break;}
    }
    if(!hit)continue;
    const ma=ca.mass+(held===a?astronautMass:0),mb=cb.mass+(held===b?astronautMass:0),invA=1/ma,invB=1/mb;
    ca.root.position.subtractInPlace(hit.normal.scale((hit.depth+.001)*invA/(invA+invB)));
    cb.root.position.addInPlace(hit.normal.scale((hit.depth+.001)*invB/(invA+invB)));
    const impactSpeed=Vector3.Dot(ca.velocity.subtract(cb.velocity),hit.normal);
    if(collisionImpulse(ca.velocity,cb.velocity,hit.normal,ma,mb)>0){
      if((held===a||held===b)&&impactSpeed>=2)impactFlash=.9;
      message.textContent='Station contact. Momentum exchanged between platforms.';
    }
  }
}
const suit=new TransformNode('suit',scene);
const hands=[-1,1].map((side)=>{const hand=new TransformNode('hand',scene);hand.parent=suit;hand.position.set(side*.36,-.3,.65);const palm=MeshBuilder.CreateBox('palm',{width:.16,height:.11,depth:.23},scene);palm.parent=hand;palm.material=white;const fingers=[];for(let j=0;j<4;j++){const f=MeshBuilder.CreateBox('finger',{width:.032,height:.035,depth:.15},scene);f.parent=hand;f.position.set((j-1.5)*.039,0,.17);f.material=white;fingers.push(f);}const thumb=MeshBuilder.CreateBox('thumb',{width:.045,height:.04,depth:.12},scene);thumb.parent=hand;thumb.position.set(-side*.1,0,.04);thumb.material=white;const light=MeshBuilder.CreateSphere('contact',{diameter:.035},scene);light.parent=hand;light.position.set(-side*.055,.06,.15);light.material=cyan;light.setEnabled(false);return {hand,fingers,thumb,light};});
const updateBody=createAstronautBody(scene,suit,hands.map(h=>h.hand));
const reassurance=document.createElement('div');reassurance.id='suit-reassurance';reassurance.hidden=true;
reassurance.setAttribute('role','status');reassurance.setAttribute('aria-live','polite');document.body.append(reassurance);
const calmMessages=[
  'Take a breath. Then another. The stars can wait.',
  'There is no up here. You have not been holding the universe upside down.',
  'Feeling a little spaced out? That is technically correct.',
  'Small inputs. Slow corrections. You are flying a suit, not arguing with it.',
  'Hold S to stabilize. Panic remains an unsupported propulsion system.',
  'Coasting is not failure. It is physics doing its very specific job.',
  'Check your closing speed. The platform is not expecting a hug at six metres per second.',
  'One thing at a time: breathe, orient, then make a small correction.',
  'Your suit believes in you. Its confidence is not a substitute for braking.',
  'You do not need to solve all of space right now. Just the next few metres.'
];
let calmIndex=-1;
window.addEventListener('keydown',event=>{
  if(event.code==='Tab'&&!event.repeat&&active&&!paused){
    calmIndex=(calmIndex+1)%calmMessages.length;reassurance.textContent=calmMessages[calmIndex];
  }
});
let position=Vector3.Zero(),velocity=Vector3.Zero(),angular=Vector3.Zero(),body=Quaternion.Identity();
let headX=0,headY=0,looking=false,active=false,paused=false,diagnostics=false,attached=false,checkpoint=0;
const mouseButtons=new Set<number>();
const keys=new Set<string>();const goal=document.querySelector('#goal')!,telemetry=document.querySelector('#telemetry')!,gesture=document.querySelector('#gesture')!,message=document.querySelector('#message')!,hud=document.querySelector<HTMLElement>('#hud')!,button=document.querySelector<HTMLButtonElement>('#start')!;
const actionLabels:Record<string,string>={KeyQ:'Roll left',KeyW:'Forward',KeyE:'Roll right',KeyA:'Strafe left',KeyS:'Stabilize',KeyD:'Strafe right',KeyZ:'Headward',KeyX:'Reverse',KeyC:'Footward',Space:'Grab',Enter:'Anchor',NumpadEnter:'Anchor',ArrowUp:'Pitch up',ArrowDown:'Pitch down',ArrowLeft:'Yaw left',ArrowRight:'Yaw right',Tab:'Palm diagnostics',MouseLeft:'Head glance',MouseRight:'Head glance',ShiftLeft:'Headward',ShiftRight:'Headward'};
document.querySelector('#left-keys')!.innerHTML=['Q','W','E','A','S','D','Z','X','C'].map(letter=>'<kbd data-code="Key'+letter+'">'+letter+'</kbd>').join('');
const keyTiles=Array.from(document.querySelectorAll<HTMLElement>('[data-code]'));
let advancedTelemetry=false;
const ctrlTile=document.createElement('kbd');ctrlTile.className='ctrl-key';ctrlTile.textContent='CTRL';
document.querySelector('.left-cluster')!.append(ctrlTile);
window.addEventListener('keydown',event=>{
  if((event.code==='ControlLeft'||event.code==='ControlRight')&&!event.repeat){
    advancedTelemetry=!advancedTelemetry;ctrlTile.classList.toggle('pressed',advancedTelemetry);
    ctrlTile.setAttribute('aria-label','Advanced telemetry '+(advancedTelemetry?'on':'off'));
  }
});
const actionName=document.querySelector('#action-name')!;
const gameTitle=document.createElement('div');gameTitle.id='game-title';gameTitle.textContent='STILL';document.body.append(gameTitle);
const flightStatus=document.createElement('div');flightStatus.id='flight-status';document.body.append(flightStatus);
const motionReadout=document.createElement('div');motionReadout.id='motion-readout';document.body.append(motionReadout);
const driftInstrument=document.createElement('div');driftInstrument.id='drift-instrument';
driftInstrument.innerHTML='<div class="drift-dial" aria-label="Suit-relative lateral drift"><span class="dial-up">+Y</span><span class="dial-right">+X</span><span class="drift-dot"></span></div><div class="axial-gauge"><span>FWD</span><div class="axial-track"><span class="axial-fill"></span></div><span>REV</span></div>';
document.body.append(driftInstrument);
driftInstrument.querySelectorAll('.axial-gauge>span').forEach(label=>label.remove());
const rotationInstrument=document.createElement('div');rotationInstrument.className='rotation-instrument';
rotationInstrument.innerHTML='<div class="rotation-heading">ROTATION</div><div class="drift-dial rotation-dial" aria-label="Pitch and yaw rotation rates"><span class="dial-up">P</span><span class="dial-right">Y</span><span class="rotation-dot"></span></div><div class="roll-gauge"><span>R</span><div class="axis-track"><span class="roll-fill"></span></div></div>';
driftInstrument.append(rotationInstrument);
rotationInstrument.querySelector('.rotation-heading')!.remove();
const rollGauge=rotationInstrument.querySelector<HTMLElement>('.roll-gauge')!;
rollGauge.querySelector('span')!.remove();
driftInstrument.querySelector('.axial-gauge')!.append(rollGauge);
driftInstrument.querySelector<HTMLElement>('.dial-up')!.textContent='Y';
const xLabel=driftInstrument.querySelector<HTMLElement>('.dial-right')!;
xLabel.textContent='◀';xLabel.className='dial-left';
driftInstrument.querySelector<HTMLElement>('.dial-up')!.textContent='▲';
rotationInstrument.querySelector<HTMLElement>('.dial-up')!.textContent='▲';
rotationInstrument.querySelector<HTMLElement>('.dial-right')!.textContent='▶';
const rotationDot=rotationInstrument.querySelector<HTMLElement>('.rotation-dot')!,rollFill=rollGauge.querySelector<HTMLElement>('.roll-fill')!;
const driftDot=driftInstrument.querySelector<HTMLElement>('.drift-dot')!,axialFill=driftInstrument.querySelector<HTMLElement>('.axial-fill')!;
const instruments=[{title:'VELOCITY · m/s',axes:['X','Y','Z'],scale:2},{title:'ROTATION · °/s',axes:['P','Y','R'],scale:30}];
const motionTiles=instruments.flatMap(instrument=>{
  const group=document.createElement('section');group.className='motion-group';
  const heading=document.createElement('div');heading.className='motion-heading';heading.textContent=instrument.title;group.append(heading);
  const row=document.createElement('div');row.className='motion-axes';group.append(row);motionReadout.append(group);
  return instrument.axes.map(axis=>{
    const tile=document.createElement('div');tile.className='motion-axis';
    tile.innerHTML='<span class="axis-label">'+axis+'</span><span class="axis-value">0.00</span><div class="axis-track"><span class="axis-fill"></span></div>';
    tile.title=instrument.title+' · '+axis+' · bar full scale ±'+instrument.scale;
    row.append(tile);return {tile,value:tile.querySelector<HTMLElement>('.axis-value')!,fill:tile.querySelector<HTMLElement>('.axis-fill')!,scale:instrument.scale};
  });
});
function updateMotionReadout(){
  motionReadout.hidden=!advancedTelemetry;
  const local=rotate(velocity,body.conjugate());
  // Fixed ±2 m/s scale, clamped at the rim; numbers retain the full readings.
  let dialX=Math.abs(local.x)<.01?0:local.x/2,dialY=Math.abs(local.y)<.01?0:local.y/2;
  const radius=Math.hypot(dialX,dialY);
  if(radius>1){dialX/=radius;dialY/=radius;}
  driftDot.style.transform=`translate(${dialX*36}px,${-dialY*36}px)`;
  const axial=Math.abs(local.z)<.01?0:Math.max(-1,Math.min(1,local.z/2));
  axialFill.style.top=`${axial>0?50-axial*50:50}%`;
  axialFill.style.height=`${Math.abs(axial)*50}%`;
  driftInstrument.querySelector('.drift-dial')!.classList.toggle('gauge-moving',Math.hypot(local.x,local.y)>=.02);
  driftInstrument.querySelector('.axial-track')!.classList.toggle('gauge-moving',Math.abs(local.z)>=.02);
  const degrees=180/Math.PI;
  let yaw=angular.y*degrees/30,pitch=angular.x*degrees/30;
  if(Math.abs(angular.y*degrees)<.05)yaw=0;
  if(Math.abs(angular.x*degrees)<.05)pitch=0;
  const rotationRadius=Math.hypot(yaw,pitch);
  if(rotationRadius>1){yaw/=rotationRadius;pitch/=rotationRadius;}
  rotationDot.style.transform=`translate(${yaw*36}px,${pitch*36}px)`;
  const roll=Math.abs(angular.z*degrees)<.05?0:Math.max(-1,Math.min(1,angular.z*degrees/30));
  rollFill.style.left=`${roll<0?50-Math.abs(roll)*50:50}%`;
  rollFill.style.width=`${Math.abs(roll)*50}%`;
  rotationInstrument.querySelector('.rotation-dial')!.classList.toggle('gauge-moving',Math.hypot(angular.x,angular.y)*degrees>=.1);
  rollGauge.querySelector('.axis-track')!.classList.toggle('gauge-moving',Math.abs(angular.z)*degrees>=.1);
  const values=[local.x,local.y,local.z,angular.x*degrees,angular.y*degrees,angular.z*degrees];
  motionTiles.forEach((instrument,i)=>{
    const raw=values[i],value=Math.abs(raw)<(i<3?.01:.05)?0:raw;
    instrument.value.textContent=(value>0?'+':'')+value.toFixed(2);
    const extent=Math.min(1,Math.abs(value)/instrument.scale)*50;
    instrument.fill.style.left=`${value<0?50-extent:50}%`;
    instrument.fill.style.width=`${extent}%`;
    instrument.tile.classList.toggle('motion-active',value!==0);
  });
}
actionLabels.Tab='Suit reassurance';
const pressTimes=new Map<string,number>();
let latestAction='';
window.addEventListener('keydown',event=>{if(!active||paused||!actionLabels[event.code])return;pressTimes.set(event.code,performance.now());latestAction=event.code;});
function updateKeyboard(){
  const now=performance.now();
  const aliases:Record<string,string[]>={KeyZ:['ShiftLeft','ShiftRight'],Enter:['NumpadEnter']};
  keyTiles.forEach(tile=>{const code=tile.dataset.code!;tile.classList.toggle('pressed',[code,...(aliases[code]??[])].some(k=>keys.has(k)||now-(pressTimes.get(k)??-Infinity)<140)||(code==='MouseRight'&&mouseButtons.has(2))||(code==='MouseLeft'&&mouseButtons.has(0)));});
  const heldActions=Array.from(keys).filter(k=>actionLabels[k]);
  const current=keys.has('KeyS')?'KeyS':heldActions.at(-1)??(looking?'MouseRight':now-(pressTimes.get(latestAction)??-Infinity)<350?latestAction:'');
  const label=current?current==='Space'?(latched?'Anchored':held>=0?'Grabbing':'Reach to grab'):current==='Enter'||current==='NumpadEnter'?(latched?'Anchored':'Detached'):actionLabels[current]:'';
  if(actionName.textContent!==label)actionName.textContent=label;
}
const axis=(positive:string,negative:string)=>Number(keys.has(positive))-Number(keys.has(negative));
function clear(){if(held>=0&&!latched)releaseGrip();keys.clear();mouseButtons.clear();looking=false;diagnostics=false;}
function reset(){position=Vector3.Zero();velocity=Vector3.Zero();angular=Vector3.Zero();body=Quaternion.Identity();headX=headY=0;checkpoint=0;attached=false;held=-1;latched=false;diagnostics=false;cargo.forEach((c,i)=>{c.root.position.copyFrom(positions[i]);c.velocity.setAll(0);c.spin.setAll(0);c.orientation=Quaternion.Identity();c.root.rotationQuaternion=c.orientation;c.visited=false;anchors[i].material=cyan;});clear();message.textContent='Approach anchor 1 below 1 m/s. Hold Space within 2.5 m.';}
button.onclick=()=>{active=true;paused=false;document.body.classList.add('running');button.textContent='RESET PRACTICE';reset();};
window.addEventListener('keydown',e=>{if(['Space','Enter','NumpadEnter','ControlLeft','ControlRight','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!active)return;if(e.code==='Escape'&&!e.repeat){paused=!paused;clear();button.textContent=paused?'RESUME (ESC)':'RESET PRACTICE';}if(paused)return;if(e.code==='KeyR'&&!e.repeat)reset();if(e.code==='Tab')diagnostics=true;if(e.code==='Space'&&!e.repeat)grab();if((e.code==='Enter'||e.code==='NumpadEnter')&&!e.repeat){if(latched)releaseGrip();else{if(held<0)grab();if(held>=0){latched=true;message.textContent='Anchor latched. Enter detaches; Space can be released.';}}}keys.add(e.code);});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Tab')diagnostics=false;if(e.code==='Space'&&held>=0&&!latched)releaseGrip();});window.addEventListener('blur',()=>{clear();paused=true;});document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();paused=true;}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if((e.button===0||e.button===2)&&active&&!paused){mouseButtons.add(e.button);looking=true;canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(!looking)return;headY=Math.max(-1.05,Math.min(1.05,headY+e.movementX*.004));headX=Math.max(-.61,Math.min(.61,headX+e.movementY*.004));});window.addEventListener('pointerup',e=>{mouseButtons.delete(e.button);looking=mouseButtons.size>0;});canvas.addEventListener('pointercancel',()=>{mouseButtons.clear();looking=false;});
const mobileControls=createMobileControls({
  start:()=>{if(!active)button.click();else{paused=false;button.textContent='RESET PRACTICE';}},
  anchor:()=>{if(!active||paused)return;if(latched)releaseGrip();else{if(held<0)grab();if(held>=0)latched=true;}},
  release:()=>{if(held>=0&&!latched)releaseGrip();}
});
canvas.addEventListener('pointerdown',event=>{if(mobileControls.state.mobile&&event.pointerType==='touch')event.stopImmediatePropagation();},true);
engine.runRenderLoop(()=>{
const dt=Math.min(engine.getDeltaTime()/1000,.04);
let thrust=Vector3.Zero(),turn=Vector3.Zero();
mobileControls.update();
const mobile=mobileControls.state;
const braking=active&&!paused&&(keys.has('KeyS')||mobile.brake);
if(active&&!paused){
  if((keys.has('Space')||mobile.grab)&&held<0&&cargo.some(c=>Vector3.Distance(position,c.root.position)<2.5&&velocity.subtract(c.velocity).length()<1))grab();
  if(!looking){headX*=Math.exp(-dt*7);headY*=Math.exp(-dt*7);}
  if(!diagnostics&&!braking){
    thrust=new Vector3(axis('KeyD','KeyA')+mobile.x,Number(keys.has('KeyZ')||keys.has('ShiftLeft')||keys.has('ShiftRight'))-Number(keys.has('KeyC'))+mobile.up-mobile.down,axis('KeyW','KeyX')+mobile.z);
    if(thrust.length()>1)thrust.normalize();
    turn=new Vector3(axis('ArrowDown','ArrowUp'),axis('ArrowRight','ArrowLeft'),axis('KeyQ','KeyE')+mobile.roll);
  }
  const steps=Math.max(1,Math.ceil(dt*Math.max(velocity.length(),...cargo.map(c=>c.velocity.length()))/.08));
  const step=dt/steps;
  for(let substep=0;substep<steps;substep++){
  const worldThrust=rotate(thrust,body);
  if(held<0){
    velocity.addInPlace(worldThrust.scale(step*1.2));angular.addInPlace(turn.scale(step*.6));
    if(braking){velocity.scaleInPlace(Math.exp(-step*1.8));angular.scaleInPlace(Math.exp(-step*2.8));}
    body=body.multiply(Quaternion.RotationYawPitchRoll(angular.y*step,angular.x*step,angular.z*step)).normalize();
    position.addInPlace(velocity.scale(step));
  }else{
    const c=cargo[held],response=astronautMass/(astronautMass+c.mass);
    c.velocity.addInPlace(worldThrust.scale(step*1.2*response));
    c.spin.addInPlace(rotate(turn,body).scale(step*.6*response));
    if(braking){c.velocity.scaleInPlace(Math.exp(-step*1.8*response));c.spin.scaleInPlace(Math.exp(-step*2.8*response));}
  }
  cargo.forEach(c=>{
    c.root.position.addInPlace(c.velocity.scale(step));
    const speed=c.spin.length();
    if(speed>0)c.orientation=Quaternion.RotationAxis(c.spin.scale(1/speed),speed*step).multiply(c.orientation).normalize();
    c.root.rotationQuaternion=c.orientation;
  });
  collideCargo();
  bumpStations();
  if(held>=0){
    const c=cargo[held],offset=rotate(gripOffset,c.orientation);
    position=c.root.position.add(offset);body=c.orientation.multiply(gripOrientation);
    velocity=c.velocity.add(Vector3.Cross(c.spin,offset));angular=rotate(c.spin,body.conjugate());
  }  }
}

updateKeyboard();
flightStatus.textContent=attached?'ANCHORED':velocity.length()<.02&&angular.length()<.005?'STABLE':'DRIFTING';
updateMotionReadout();
if(!active)impactFlash=0;
updateCollisionWarning(paused?0:dt);
starShell.position.copyFrom(position);
suit.position.copyFrom(position);suit.rotationQuaternion=body;camera.position.copyFrom(position);camera.rotationQuaternion=body.multiply(Quaternion.RotationYawPitchRoll(headY,headX,0));hud.style.transform=`translate(${-headY*350}px,${headX*350}px)`;
hands.forEach((h,i)=>{const engaged=i===0?thrust.length()>0:turn.length()>0;h.light.setEnabled(engaged||braking);h.hand.position.set((i===0?-.36:.36)+(i===0?thrust.x*.08:0),-.3+(i===0?thrust.y*.08:0),.65+(i===0?thrust.z*.08:0));h.hand.rotation.set(i===1?turn.x*.3:0,i===1?turn.y*.3:0,i===1?turn.z*.3:0);h.fingers.forEach((f,j)=>f.rotation.x=braking?1.4:engaged&&j===0?.85:0);h.thumb.rotation.y=engaged||braking?(i===0?-.7:.7):0;});reassurance.hidden=!diagnostics;
updateBody();
updateNavigation();
const nextCargo=cargo.find(c=>!c.visited);const distance=nextCargo?Vector3.Distance(position,nextCargo.root.position):0;goal.textContent=checkpoint===3?'ALL ANCHORS VISITED':`ANCHOR ${checkpoint+1} / 3 · ${distance.toFixed(1)} m`;telemetry.textContent=`${paused?'PAUSED · ESC TO RESUME':attached?`${latched?'ANCHORED':'GRIPPING'} · ${cargo[held].mass+astronautMass} kg`:'FREE DRIFT'} | ${velocity.length().toFixed(2)} m/s | ${(angular.length()*180/Math.PI).toFixed(1)} °/s`;const reachable=cargo.some(c=>Vector3.Distance(position,c.root.position)<2.5&&velocity.subtract(c.velocity).length()<1);gesture.textContent=attached?(latched?'ENTER · DETACH ANCHOR':'RELEASE SPACE · LET GO / ENTER · ANCHOR'):reachable?'HOLD SPACE · GRAB / ENTER · ANCHOR':diagnostics?'PALM DISPLAY · FLIGHT DISENGAGED':braking?'BOTH FISTS · STABILIZING':thrust.length()||turn.length()?'PINCH ENGAGED · THRUST ACTIVE':looking?'HEAD GLANCE HELD':'HANDS NEUTRAL · THRUST OFF';scene.render();});
window.addEventListener('resize',()=>engine.resize());

