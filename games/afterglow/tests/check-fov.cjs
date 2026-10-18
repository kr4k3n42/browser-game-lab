const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const code=html.slice(html.indexOf('const FOV_STORAGE='),html.indexOf('const projectHeight='));
const context=vm.createContext({Math,Number,localStorage:{getItem:()=>null},world:v=>v/50,player:{eyeHeight:93},W:1000,WALL_HEIGHT:140,paused:false,transitioning:false,reduced:false,mode:'playing',stage:1});
vm.runInContext(code+';globalThis.test={advanceFov,effectiveFov,cameraPlane,focalLength,getBase:()=>baseFov,setBase:v=>baseFov=clampFov(v),reset:()=>{tripFovTime=0;tripFovOffset=0}}',context);
const t=context.test;assert.equal(t.getBase(),90);assert(Math.abs(t.cameraPlane()-1)<1e-10);assert(Math.abs(t.focalLength()-500)<1e-10);
let peaks=[];for(let stage=1;stage<=3;stage++){context.stage=stage;t.reset();let peak=0,last=90;for(let i=0;i<2800;i++){t.advanceFov(.01);const f=t.effectiveFov();peak=Math.max(peak,Math.abs(f-90));assert(Math.abs(f-last)<.008,'No abrupt zoom');last=f}peaks.push(peak);assert(peak<=[0,.45,.9,1.5][stage]);}
assert(peaks[0]>.4&&peaks[1]>peaks[0]&&peaks[2]>peaks[1]);
context.paused=true;const frozen=t.effectiveFov();t.advanceFov(1);assert.equal(t.effectiveFov(),frozen);context.paused=false;context.reduced=true;t.advanceFov(.01);assert.equal(t.effectiveFov(),90);
context.reduced=false;context.stage=0;for(let i=0;i<1000;i++)t.advanceFov(.01);assert(Math.abs(t.effectiveFov()-90)<1e-6);
t.setBase(60);assert.equal(t.getBase(),60);t.setBase(500);assert.equal(t.getBase(),110);t.setBase('bad');assert.equal(t.getBase(),90);
assert(!html.includes('propW/1.32'));assert(!html.includes('px=-dy*.66'));assert(html.includes('p.right*iz*focalLength()*propW/W'));
console.log('FOV checks passed: default 90°, shared projection, layer amplitudes '+peaks.map(x=>x.toFixed(3))+', smoothness, pause, reduced motion, bedroom, and bounds.');
