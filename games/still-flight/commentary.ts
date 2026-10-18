export type SuitHabits={active:boolean;paused:boolean;thrust:number;turn:number;speed:number;spin:number;distance:number;outwardSpeed:number;destroyed:number;allPlanetsDestroyed:boolean};
const remarks={
  firing:[
    'That is eight rockets. Was one of them carrying a question?',
    'Ammunition expenditure suggests you have mistaken navigation for a disagreement.',
    'I have reassigned your trigger finger from curious to managerial.'
  ],
  destruction:[
    'We were investigating what happened. Manufacturing additional incidents may complicate the report.',
    'You have made several smaller problems out of one large object. Very administrative.',
    'I shall mark those as explored. In the past tense.'
  ],
  emptySky:[
    'All planets accounted for. None currently qualify as planets. An unusually thorough survey.',
    'You have reduced the local map to a list of former addresses.'
  ],
  runaway:[
    'You are leaving the area at full thrust. I admire the confidence. I await the destination.',
    'Home remains unidentified. Further away is not, strictly speaking, a bearing.',
    'An impressive departure. Shall we attempt an arrival at some point?'
  ],
  spinning:[
    'You have been rotating for some time. The universe is not a screw cap.',
    'Every direction has now had a turn being forward. Perhaps stabilize.',
    'I have seen enough of that star to consider us introduced.'
  ]
};
type Habit=keyof typeof remarks;
export function createSuitCommentary(){
  const panel=document.createElement('aside');panel.id='suit-commentary';panel.hidden=true;
  panel.innerHTML='<div class="commentary-heading">SUIT COMPUTER · OBSERVATION</div><p></p><span class="commentary-accessible" aria-live="polite"></span>';
  document.body.append(panel);
  const text=panel.querySelector('p')!,accessible=panel.querySelector('.commentary-accessible')!;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let clock=0,lastRemark=-20,shotTimes:number[]=[],destructionTimes:number[]=[],previousDestroyed=0,throttleTime=0,spinTime=0,visibleTime=0,current='',typed=0;
  const lastCategory=new Map<Habit,number>(),indices=new Map<Habit,number>();
  function speak(category:Habit){
    if(!panel.hidden||clock-lastRemark<25||clock-(lastCategory.get(category)??-Infinity)<90)return false;
    const list=remarks[category],index=indices.get(category)??0;current=list[index%list.length];indices.set(category,index+1);
    lastCategory.set(category,clock);lastRemark=clock;typed=visibleTime=0;panel.hidden=false;panel.style.opacity='1';accessible.textContent=current;text.textContent='';return true;
  }
  function reset(){clock=0;lastRemark=-20;shotTimes=[];destructionTimes=[];previousDestroyed=0;throttleTime=spinTime=visibleTime=typed=0;current='';panel.hidden=true;accessible.textContent='';text.textContent='';lastCategory.clear();}
  return {reset,recordShot:()=>{shotTimes.push(clock);},update:(dt:number,state:SuitHabits)=>{
    if(!state.active||state.paused)return;
    clock+=dt;
    if(!panel.hidden){
      typed=reduced?current.length:Math.min(current.length,typed+dt*42);text.textContent=current.slice(0,Math.floor(typed));
      if(typed>=current.length)visibleTime+=dt;
      if(visibleTime>6)panel.style.opacity=String(Math.max(0,1-(visibleTime-6)));
      if(visibleTime>=7){panel.hidden=true;accessible.textContent='';}
    }
    shotTimes=shotTimes.filter(t=>clock-t<20);
    if(state.destroyed>previousDestroyed)for(let i=previousDestroyed;i<state.destroyed;i++)destructionTimes.push(clock);
    previousDestroyed=state.destroyed;destructionTimes=destructionTimes.filter(t=>clock-t<35);
    throttleTime=state.thrust>.85?throttleTime+dt:0;
    spinTime=state.turn>.1&&state.spin>.3?spinTime+dt:0;
    if(state.allPlanetsDestroyed&&speak('emptySky'))return;
    if(destructionTimes.length>=3&&speak('destruction')){destructionTimes=[];return;}
    if(shotTimes.length>=8&&speak('firing')){shotTimes=[];return;}
    if(throttleTime>=12&&state.speed>6&&state.distance>100&&state.outwardSpeed>3&&speak('runaway')){throttleTime=0;return;}
    if(spinTime>=8&&speak('spinning'))spinTime=0;
  }};
}
