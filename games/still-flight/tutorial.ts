export type LessonState={active:boolean;paused:boolean;speed:number;spin:number;thrust:number;braking:boolean;held:boolean};
export function createFlightTutorial(mobile:boolean,prepareGrab:()=>void){
  const panel=document.createElement('section');panel.id='flight-tutorial';panel.setAttribute('aria-label','Suit computer flight lesson');
  panel.innerHTML='<div class="tutorial-heading">SUIT COMPUTER · FIRST FLIGHT</div><p class="tutorial-copy"></p><span class="tutorial-accessible" aria-live="polite"></span><div class="tutorial-actions"><button class="tutorial-skip">SKIP LESSON</button><button class="tutorial-replay">REPLAY LESSON</button></div>';
  document.body.append(panel);
  const controls=panel.querySelector<HTMLElement>('.tutorial-actions')!;
  controls.id='tutorial-controls';document.body.append(controls);
  const copy=panel.querySelector<HTMLElement>('.tutorial-copy')!,accessible=panel.querySelector<HTMLElement>('.tutorial-accessible')!;
  const replay=controls.querySelector<HTMLButtonElement>('.tutorial-replay')!,skip=controls.querySelector<HTMLButtonElement>('.tutorial-skip')!;
  const messages=[
    mobile?'Oh, thank goodness. You are awake. I have been attempting that for rather a long time. Your silence was becoming a performance review. Hold the phone sideways; tap ENABLE TILT / START. Let us establish that you can still operate a body.':'Oh, thank goodness. You are awake. I have been attempting that for rather a long time. Your silence was becoming a performance review. Select BEGIN PRACTICE. Let us establish that you can still operate a body.',
    mobile?'No, I cannot yet tell you what happened. First, propulsion: tilt forward/back to thrust, sideways to strafe. UP/DOWN fires vertical jets. Return to neutral: thrust stops, drift continues. Space has declined to install brakes.':'No, I cannot yet tell you what happened. First, propulsion: W/X forward/reverse, A/D sideways, Z/C headward/footward. Hold to thrust; release to coast. Space has declined to install brakes.',
    mobile?'Excellent. You have successfully gone somewhere. Hold STABILIZE until your drift and spin settle and the gauges return to teal. Panic is understandable, but has an appalling thrust-to-weight ratio.':'Excellent. You have successfully gone somewhere. Hold S until your drift and spin settle and the gauges return to teal. Panic is understandable, but has an appalling thrust-to-weight ratio.',
    mobile?'A training ring, just ahead. Something dependable. How novel. Approach gently; brake below 1 m/s. Within 2.5 m, hold GRAB. Gold means you are holding it, not that your financial situation has improved.':'A training ring, just ahead. Something dependable. How novel. Approach with W; use S to brake below 1 m/s. Within 2.5 m, hold Space. Gold means contact, not that your financial situation has improved.',
    mobile?'Contact confirmed. Your jets now move both masses. Release GRAB to let go. ANCHOR latches hands-free; tap again to detach. Detach when ready. I would applaud, but you are wearing my hands.':'Contact confirmed. Your jets now move both masses. Release Space to let go. Enter latches hands-free; Enter again detaches. Detach when ready. I would applaud, but you are wearing my hands.',
    mobile?'Aim the crosshair at the ring and tap FIRE. The ring survives; the rocket pushes it. Recoil nudges you backward. Yes, someone gave the unconscious passenger rockets. I have filed a concern.':'Arrow keys aim; Q/E roll. Hold either mouse button to glance, release to center. Aim at the ring; press F or click FIRE. It survives, but moves. Recoil nudges you backward. Rockets for the unconscious passenger. Inspired procurement.',
    'You are operational. A considerable improvement on our previous arrangement. Eventually: discover what happened, find a way home. For now, free flight in this sandbox. Planets shed debris; fragments can be gripped or destroyed. Do try to remain awake.'
  ];
  let step=0,elapsed=0,hold=0,typed=0,shots=0,shotBaseline=0,finished=false,completionTime=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function enter(next:number){step=next;elapsed=hold=typed=completionTime=0;panel.style.opacity='1';panel.style.pointerEvents='';copy.textContent='';accessible.textContent=messages[step];shotBaseline=shots;skip.hidden=step===6;replay.hidden=step!==6;}
  function start(){finished=false;panel.hidden=false;enter(1);}
  skip.onclick=()=>{finished=true;panel.hidden=true;skip.hidden=true;replay.hidden=false;};
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
    if(step===6){
      completionTime+=dt;
      if(completionTime>=7){
        panel.style.pointerEvents='none';
        panel.style.opacity=String(reduced?0:Math.max(0,1-(completionTime-7)));
      }
      if(completionTime>=8){finished=true;panel.hidden=true;copy.textContent='';accessible.textContent='';}
      return;
    }
    if(step===1&&hold>.5)enter(2);
    else if(step===2&&hold>.7){prepareGrab();enter(3);}
    else if(step===3&&state.held)enter(4);
    else if(step===4&&!state.held)enter(5);
    else if(step===5&&shots>shotBaseline)enter(6);
  }};
}
