export type LessonState={active:boolean;paused:boolean;speed:number;spin:number;thrust:number;braking:boolean;held:boolean};
export function createFlightTutorial(mobile:boolean,prepareGrab:()=>void){
  const panel=document.createElement('section');panel.id='flight-tutorial';panel.setAttribute('aria-label','Suit computer flight lesson');
  panel.innerHTML='<div class="tutorial-heading">SUIT COMPUTER · FIRST FLIGHT</div><p class="tutorial-copy"></p><span class="tutorial-accessible" aria-live="polite"></span><div class="tutorial-actions"><button class="tutorial-skip">SKIP LESSON</button><button class="tutorial-replay">REPLAY LESSON</button></div>';
  document.body.append(panel);
  const copy=panel.querySelector<HTMLElement>('.tutorial-copy')!,accessible=panel.querySelector<HTMLElement>('.tutorial-accessible')!;
  const replay=panel.querySelector<HTMLButtonElement>('.tutorial-replay')!,skip=panel.querySelector<HTMLButtonElement>('.tutorial-skip')!;
  const messages=[
    mobile?'Suit online. Hold your phone comfortably in landscape. Tap ENABLE TILT / START to calibrate. I will handle the introductions. You handle the breathing.':'Suit online. Welcome back, pilot. Select BEGIN PRACTICE for a systems check. Space is large; we shall start small.',
    mobile?'Propulsion check. Tilt gently forward or back to thrust. Tilt sideways to strafe; hold UP or DOWN for vertical thrust. Return to neutral and notice: you keep drifting.':'Propulsion check. Hold W to thrust forward, X to reverse, A/D to strafe, or Z/C to move headward/footward. Release the key. The jets stop; your drift does not.',
    mobile?'Nicely done. Now hold STABILIZE until your drift and spin settle. The gauges return to teal. Braking is a thruster action, not a request to physics.':'Nicely done. Now hold S to stabilize until your drift and spin settle. The gauges return to teal. Braking is a thruster action, not a request to physics.',
    mobile?'Handhold check. I have placed a training ring just ahead. Approach gently, stabilize below 1 m/s, then hold GRAB within 2.5 m. A gold ring confirms contact.':'Handhold check. I have placed a training ring just ahead. Approach gently with W, brake with S, then hold Space within 2.5 m below 1 m/s. A gold ring confirms contact.',
    mobile?'Grip confirmed. You now move the combined mass. Release GRAB to let go; tap ANCHOR to latch hands-free, then tap it again to detach. Detach when ready.':'Grip confirmed. You now move the combined mass. Release Space to let go; Enter latches hands-free, and Enter again detaches. Detach when ready.',
    mobile?'Weapons check. Aim the center crosshair at the training ring and tap FIRE. It is indestructible; the rocket pushes it. Expect a small kick backward.':'Weapons check. Arrow keys aim the suit; Q/E roll it. Hold either mouse button to glance, release to center. Aim at the ring and press F or click FIRE. It survives; recoil moves you backward.',
    'Systems check complete. You can fly, stabilize, grip, and fire. Planets produce debris when destroyed; fragments can be gripped or destroyed. You are cleared for free flight. Please leave some universe for the next pilot.'
  ];
  let step=0,elapsed=0,hold=0,typed=0,shots=0,shotBaseline=0,finished=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function enter(next:number){step=next;elapsed=hold=typed=0;copy.textContent='';accessible.textContent=messages[step];shotBaseline=shots;skip.hidden=step===6;replay.hidden=step!==6;}
  function start(){finished=false;panel.hidden=false;enter(1);}
  skip.onclick=()=>{finished=true;panel.hidden=true;};
  replay.onclick=()=>{document.querySelector<HTMLButtonElement>('#start')!.click();};
  enter(0);
  return {start,recordShot:()=>{shots++;},update:(dt:number,state:LessonState)=>{
    if(finished||state.paused)return;
    elapsed+=dt;typed=reduced?messages[step].length:Math.min(messages[step].length,typed+dt*42);
    copy.textContent=messages[step].slice(0,Math.floor(typed));
    panel.classList.toggle('typing',typed<messages[step].length);
    if(step===0||!state.active)return;
    if(step===1&&state.thrust>.1&&state.speed>.12)hold+=dt;
    if(step===2){hold=state.braking&&state.speed<.025&&state.spin<.006?hold+dt:0;}
    const read=typed>=messages[step].length&&elapsed>2;
    if(!read)return;
    if(step===1&&hold>.5)enter(2);
    else if(step===2&&hold>.7){prepareGrab();enter(3);}
    else if(step===3&&state.held)enter(4);
    else if(step===4&&!state.held)enter(5);
    else if(step===5&&shots>shotBaseline)enter(6);
  }};
}
