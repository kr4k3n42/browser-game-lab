export function createMobileControls(actions:{start:()=>void;anchor:()=>void;release:()=>void}){
  const mobile=matchMedia('(pointer:coarse)').matches||new URLSearchParams(location.search).has('mobile');
  const state={mobile,x:0,z:0,up:0,down:0,brake:false,grab:false};
  if(!mobile)return {state,update:()=>{}};
  document.body.classList.add('mobile-flight');
  const panel=document.createElement('div');panel.id='mobile-controls';
  panel.innerHTML='<p class="mobile-status" role="status">Hold your phone comfortably, then enable tilt.</p><div class="mobile-tools"><button data-action="enable">ENABLE TILT / START</button><button data-action="calibrate">RECENTER</button><button data-action="anchor">ANCHOR</button></div><div class="mobile-holds"><button data-hold="up">UP</button><button data-hold="brake">STABILIZE</button><button data-hold="grab">GRAB</button><button data-hold="down">DOWN</button></div>';
  document.body.append(panel);
  const status=panel.querySelector<HTMLElement>('.mobile-status')!;
  let sample:{beta:number;gamma:number;time:number}|null=null,neutral:{beta:number;gamma:number}|null=null,enabled=false;
  const holds=new Map<number,string>();
  const clear=()=>{state.x=state.z=state.up=state.down=0;state.brake=false;if(state.grab)actions.release();state.grab=false;holds.clear();panel.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));};
  const calibrate=()=>{
    clear();
    if(!sample||performance.now()-sample.time>1000){neutral=null;status.textContent='Waiting for tilt sensors. Keep your phone still.';return;}
    neutral={beta:sample.beta,gamma:sample.gamma};status.textContent='Neutral set · tilt to thrust · hold STABILIZE to brake';
  };
  window.addEventListener('deviceorientation',event=>{
    if(event.beta===null||event.gamma===null)return;
    sample={beta:event.beta,gamma:event.gamma,time:performance.now()};
    if(enabled&&!neutral)calibrate();
  });
  panel.querySelector<HTMLButtonElement>('[data-action="enable"]')!.onclick=async()=>{
    try{
      if(!isSecureContext)throw Error('Tilt requires HTTPS. Use the public game link.');
      const sensor=DeviceOrientationEvent as typeof DeviceOrientationEvent&{requestPermission?:()=>Promise<string>};
      if(sensor.requestPermission&&await sensor.requestPermission()!=='granted')throw Error('Motion permission denied. Allow motion access and try again.');
      enabled=true;neutral=null;actions.start();calibrate();
    }catch(error){enabled=false;clear();status.textContent=error instanceof Error?error.message:'Tilt unavailable on this browser.';}
  };
  panel.querySelector<HTMLButtonElement>('[data-action="calibrate"]')!.onclick=calibrate;
  panel.querySelector<HTMLButtonElement>('[data-action="anchor"]')!.onclick=actions.anchor;
  const refresh=()=>{
    for(const name of ['up','down','brake','grab'] as const){
      const pressed=Array.from(holds.values()).includes(name);
      if(name==='up'||name==='down')state[name]=Number(pressed);else state[name]=pressed;
      panel.querySelector(`[data-hold="${name}"]`)!.classList.toggle('pressed',pressed);
    }
  };
  panel.querySelectorAll<HTMLElement>('[data-hold]').forEach(button=>{
    button.onpointerdown=event=>{event.preventDefault();if(!enabled)return;holds.set(event.pointerId,button.dataset.hold!);button.setPointerCapture(event.pointerId);refresh();};
    const release=(event:PointerEvent)=>{const wasGrab=state.grab;holds.delete(event.pointerId);refresh();if(wasGrab&&!state.grab)actions.release();};
    button.onpointerup=release;button.onpointercancel=release;button.onlostpointercapture=release;
  });
  const suspend=()=>{enabled=false;neutral=null;clear();status.textContent='Tilt paused · tap ENABLE TILT / START to resume.';};
  window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
  screen.orientation?.addEventListener('change',()=>{neutral=null;clear();status.textContent='Orientation changed · hold still to recenter.';});
  const wrap=(v:number)=>((v+540)%360)-180;
  const response=(angle:number)=>Math.sign(angle)*Math.min(1,Math.max(0,Math.abs(angle)-3)/17);
  return {state,update:()=>{
    if(!enabled||!neutral||!sample||performance.now()-sample.time>1000){state.x=state.z=0;return;}
    const angle=(screen.orientation?.angle??0)*Math.PI/180;
    const beta=wrap(sample.beta-neutral.beta),gamma=wrap(sample.gamma-neutral.gamma);
    state.x=response(gamma*Math.cos(angle)+beta*Math.sin(angle));
    state.z=response(beta*Math.cos(angle)-gamma*Math.sin(angle));
  }};
}

