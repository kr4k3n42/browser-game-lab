import {Engine,Scene,FreeCamera,Vector3,Quaternion,Color3,Color4,HemisphericLight,DirectionalLight,MeshBuilder,StandardMaterial} from '@babylonjs/core';
import './style.css';
import {createRocketRoadster} from './vehicle';
import {createTestFacility} from './track';
import {newCarState,stepCar,groundHeight,zeroInput,tuning} from './physics';

const canvas=document.querySelector<HTMLCanvasElement>('#roadster')!;
const engine=new Engine(canvas,true,{stencil:true});engine.setHardwareScalingLevel(Math.min(2,Math.max(1,devicePixelRatio/1.5)));
const scene=new Scene(engine);scene.clearColor=new Color4(.62,.72,.77,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.0008;scene.fogColor=new Color3(.63,.69,.7);
const camera=new FreeCamera('driver',Vector3.Zero(),scene);camera.inputs.clear();camera.minZ=.04;camera.maxZ=2500;camera.fov=1.12;camera.updateUpVectorFromRotation=true;
new HemisphericLight('sky',new Vector3(0,1,0),scene).intensity=.85;
const sun=new DirectionalLight('afternoon',new Vector3(-.6,-.8,.3),scene);sun.intensity=1.5;sun.diffuse=new Color3(1,.87,.68);
createTestFacility(scene);
const car=createRocketRoadster(scene);
const shadow=MeshBuilder.CreateGround('contact shadow',{width:2.7,height:5.5},scene);const shadowMat=new StandardMaterial('shadow',scene);shadowMat.diffuseColor=Color3.Black();shadowMat.alpha=.24;shadowMat.disableLighting=true;shadow.material=shadowMat;
let state=newCarState(),active=false,paused=false,chase=false,inspecting=false,mission=0,accumulator=0,noticeTime=0,noticeText='';
const keys=new Set<string>(),pointers=new Map<number,string>();
const $=(selector:string)=>document.querySelector<HTMLElement>(selector)!;
const speed=$('#speed'),mode=$('#mode'),gas=$('#gas'),gasBar=$('#gas-bar'),altitude=$('#altitude'),vertical=$('#vertical'),notice=$('#notice'),objective=$('#objective');
function clearInput(){keys.clear();pointers.clear();document.querySelectorAll('.pressed').forEach(e=>e.classList.remove('pressed'));}
function say(text:string,seconds=4){noticeText=text;noticeTime=seconds;notice.textContent=text;}
function reset(){state=newCarState();accumulator=0;mission=0;clearInput();paused=false;document.body.classList.remove('is-paused');say('CHECK CLEAR · LAUNCH LANE AHEAD');}
function toggleCamera(){chase=!chase;$('#camera').innerHTML=chase?'COCKPIT <kbd>V</kbd>':'CHASE <kbd>V</kbd>';}
function pause(){if(!active)return;paused=!paused;clearInput();document.body.classList.toggle('is-paused',paused);$('#pause').innerHTML=paused?'RESUME <kbd>P</kbd>':'PAUSE <kbd>P</kbd>';say(paused?'PAUSED · P TO RESUME':'SYSTEMS ACTIVE',paused?999:2);}
function refill(){if(!state.grounded||Math.hypot(state.vx,state.vz)>.5){say('REFILL REQUIRES A STOP ON THE GROUND');return;}state.gas=1;say('TEST-FACILITY GAS SERVICE · PRESSURE RESTORED');}
$('#start').onclick=()=>{active=true;inspecting=false;chase=false;document.body.classList.remove('inspecting');$('#briefing').hidden=true;reset();canvas.tabIndex=0;canvas.focus();};
$('#preview').onclick=()=>{inspecting=!inspecting;document.body.classList.toggle('inspecting',inspecting);$('#preview').textContent=inspecting?'RETURN TO BRIEFING':'INSPECT CAR';};
$('#reset').onclick=reset;$('#camera').onclick=toggleCamera;$('#pause').onclick=pause;$('#refill').onclick=refill;
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.target instanceof HTMLElement&&e.target.closest('button,a,input,textarea')&&e.code==='Space')return;
  if(!e.repeat){if(e.code==='KeyR')reset();if(e.code==='KeyV')toggleCamera();if(e.code==='KeyP'||e.code==='Escape')pause();if(e.code==='KeyT')refill();}
  if(active&&!paused)keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{if(active&&!paused)pause();clearInput();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(active&&!paused)pause();clearInput();}});
document.querySelectorAll<HTMLElement>('[data-touch]').forEach(button=>{
  button.onpointerdown=e=>{e.preventDefault();if(!active||paused)return;pointers.set(e.pointerId,button.dataset.touch!);button.setPointerCapture(e.pointerId);button.classList.add('pressed');};
  const release=(e:PointerEvent)=>{pointers.delete(e.pointerId);button.classList.toggle('pressed',Array.from(pointers.values()).includes(button.dataset.touch!));};button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;
});
const held=(key:string)=>keys.has(key)||Array.from(pointers.values()).includes(key);
engine.runRenderLoop(()=>{
  const dt=Math.min(engine.getDeltaTime()/1000,.05),input=zeroInput();
  if(active&&!paused){
    input.throttle=Number(held('KeyW'))-Number(held('KeyX'));input.brake=Number(held('KeyS'));input.steer=Number(held('KeyD')||held('ArrowRight'))-Number(held('KeyA')||held('ArrowLeft'));
    input.lift=Number(held('Space'));input.boost=Number(held('ShiftLeft')||held('ShiftRight'));input.pitch=Number(held('ArrowDown'))-Number(held('ArrowUp'));input.roll=Number(held('KeyQ'))-Number(held('KeyE'));input.stabilize=held('KeyC');
    accumulator+=dt;while(accumulator>=1/120){stepCar(state,input,1/120);accumulator-=1/120;}
    if(noticeTime>0){noticeTime-=dt;if(noticeTime<=0)notice.textContent='';}
    if(mission===0&&Math.hypot(state.vx,state.vz)>8){mission=1;say('DRIVE CHECK COMPLETE · HOLD SPACE FOR LIFT');}
    if(mission===1&&state.launched){mission=2;say('AIRBORNE · RELEASE LIFT TO DESCEND · C STEADIES SPIN');}
    if(mission===2&&state.landings>0&&!state.crashed){mission=3;say('LANDING CONFIRMED · FREE TEST OPERATIONS',6);}
    if(state.crashed){notice.textContent='HARD CONTACT · R TO RECOVER';}
  }
  car.root.position.set(state.x,state.y,state.z);car.root.rotationQuaternion=Quaternion.RotationYawPitchRoll(state.yaw,state.pitch,state.roll);
  car.update(paused?0:Math.hypot(state.vx,state.vz),input.steer,Math.max(input.lift,input.stabilize&&!state.grounded&&state.vy<-2?.6:0)*(state.gas>0?1:0),input.boost*(state.gas>0?1:0),input.brake);
  const rotation=car.root.rotationQuaternion;
  const rotate=(v:Vector3)=>{const out=Vector3.Zero();v.rotateByQuaternionToRef(rotation,out);return out;};
  if(!active){
    const orbit=inspecting?performance.now()*.00014:.48;
    camera.position.set(state.x+Math.sin(orbit)*7,2.4,state.z+Math.cos(orbit)*7);camera.rotationQuaternion=null;camera.setTarget(car.root.position.add(new Vector3(0,.2,0)));
  }else if(chase){
    camera.position.copyFrom(car.root.position.add(rotate(new Vector3(0,2.4,-7.5))));camera.rotationQuaternion=null;camera.upVector=Vector3.Up();camera.setTarget(car.root.position.add(rotate(new Vector3(0,.4,4))));
  }else{
    camera.position.copyFrom(car.root.position.add(rotate(new Vector3(0,.58,.05))));camera.rotationQuaternion=rotation.clone();
  }
  const height=Math.max(0,state.y-groundHeight(state.x,state.z)-.74);
  shadow.position.set(state.x,groundHeight(state.x,state.z)+.015,state.z);shadow.rotation.y=state.yaw;shadow.visibility=Math.max(0,1-height/20);
  speed.textContent=String(Math.round(Math.hypot(state.vx,state.vz)*3.6)).padStart(3,'0');gas.textContent=`${Math.round(state.gas*100)}%`;gasBar.style.width=`${state.gas*100}%`;gasBar.style.background=state.gas<.2?'#e8ae70':'#a3d8ca';
  altitude.textContent=height.toFixed(1);vertical.textContent=`${state.vy>=0?'+':''}${state.vy.toFixed(1)} m/s`;
  mode.textContent=paused?'PAUSED':state.crashed?'RECOVERY REQUIRED':!active?'SYSTEMS READY':state.grounded?'GROUND / RWD':state.gas<=0?'BALLISTIC / GAS EMPTY':input.lift?'COLD GAS / LIFT':'AIRBORNE';
  $('#mission-label').textContent=mission===3?'PROVING RUN / COMPLETE':`PROVING RUN / 0${mission+1}`;
  objective.textContent=['Accelerate down the center launch lane.','Hold SPACE to lift. SHIFT adds forward boost.','Release lift. Keep level; use C to steady rotation.','Free drive · stop and T to refill · V exterior view.'][mission];
  $('#flight-reticle').style.transform=`translate(-50%,-50%) rotate(${-state.roll}rad)`;
  scene.render();
});
window.addEventListener('resize',()=>engine.resize());
