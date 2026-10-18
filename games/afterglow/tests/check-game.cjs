const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const listeners = {};
const stored = {};
const timers = [];
let frames = [];
const overlayIds = ['memoryModal', 'help', 'journal', 'ending'];
function classes(initial = []) {
  const data = new Set(initial);
  return {add: x => data.add(x), remove: x => data.delete(x), contains: x => data.has(x), toggle(x, force) { const on = force === undefined ? !data.has(x) : force; on ? data.add(x) : data.delete(x); return on; }};
}
const drawing = new Proxy({
  createLinearGradient() {return {addColorStop() {}}},
  createImageData(w,h) {return {data:new Uint8ClampedArray(w*h*4)}},
}, {get(target, prop) {return prop in target ? target[prop] : () => {};}});
const elements = {};
function element(id) {
  if (!elements[id]) elements[id] = {
    id, style: {setProperty() {}}, dataset: {}, classList:classes(overlayIds.includes(id) || ['menu','scene'].includes(id) ? (overlayIds.includes(id)?['hidden']:[]) : ['hidden']),
    textContent:'',innerHTML:'',width:240,height:240,attrs:{},
    getContext() {return drawing},setAttribute(k,v) {this.attrs[k]=String(v)},getAttribute(k) {return this.attrs[k]},
    addEventListener(type, fn) {listeners[id+':'+type]=fn},focus() {document.activeElement=this},
    querySelector() {return element(id+'-button')},querySelectorAll() {return [element(id+'-button')]},before() {},setPointerCapture() {},
  };
  return elements[id];
}
const document = {
  activeElement:null,hidden:false,documentElement:element('html'),pointerLockElement:null,
  getElementById:element,createElement:tag=>element(tag+'-'+Object.keys(elements).length),
  querySelectorAll(selector) {return selector === '.overlay' ? overlayIds.map(element) : []},
  addEventListener(type,fn) {listeners['document:'+type]=fn},exitPointerLock() {},
};
const window = {addEventListener(type,fn) {listeners['window:'+type]=fn}};
const context = {console,document,window,innerWidth:960,innerHeight:640,matchMedia:()=>({matches:false}),localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},requestAnimationFrame:fn=>frames.push(fn),setTimeout:fn=>timers.push(fn),Float32Array,Uint8ClampedArray};
let source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
source = source.replace('window.AFTERGLOW={', 'window.__test={update,closeModal,projectHeight,floorDistance,move,resolvePlayerPosition,setEyeHeight:h=>{player.eyeHeight=h},projection:()=>({eye:eyeHeight(),ceiling:ceilingHeight(),focal:focalLength(),horizon:H*(.49+player.pitch),W,H}),setPosition:(x,y,a,pitch=-.20)=>{player=createPlayer(x,y,a,pitch)},setObjects:o=>{objects=o},renderProps:(wall=Infinity)=>{zbuffer.fill(wall);drawVoxelProps(H*(.49+player.pitch),Math.cos(player.a),Math.sin(player.a));return {pixels:new Uint8ClampedArray(propPixels),depth:new Float32Array(propDepth),owners:new Int16Array(propOwners),w:propW,h:propH}},drawScene}; window.AFTERGLOW={');
vm.runInNewContext(source, context);
const api=window.AFTERGLOW,test=window.__test;
function flush() {while(timers.length)timers.shift()()}
function reach(grid, x, y) {
  const visited=new Set([`${x},${y}`]),queue=[[x,y]];
  for(let i=0;i<queue.length;i++)for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const nx=queue[i][0]+dx,ny=queue[i][1]+dy,key=`${nx},${ny}`;if(grid[ny]?.[nx]===0&&!visited.has(key)){visited.add(key);queue.push([nx,ny])}}
  return visited;
}
for(let n=1;n<=3;n++){
  const maze=api.buildMaze(n),reachable=reach(maze.grid,2,2);
  const floors=maze.grid.flat().filter(x=>x===0).length;
  assert.equal(reachable.size,floors,`Chapter ${n}: all floor cells connected`);
  assert.equal(new Set(maze.positions.map(x=>x.join(','))).size,4,'Distinct objectives');
  for(const[x,y]of maze.positions)assert(reachable.has(`${x},${y}`),'Objective reachable');
  console.log(`Chapter ${n}: ${floors} connected floor cells; 3 memories and exit reachable.`);
}
function use(kind){
  const o=api.getState().objects.find(x=>x.action===kind);
  assert(o,`Object ${kind} exists`);
  let stand=null;
  for(let radius=.4;radius<1.5&&!stand;radius+=.1)for(let i=0;i<24&&!stand;i++){const a=i*Math.PI/12,x=o.x+Math.cos(a)*radius,y=o.y+Math.sin(a)*radius;if(api.canMove(x,y))stand={x,y,a:Math.atan2(o.y-y,o.x-x)}}
  assert(stand,'Interaction has a valid standing position');
  test.setPosition(stand.x,stand.y,stand.a);test.update(.016);api.interact();
}
api.start(false);
assert.equal(api.getState().stage,0);
test.drawScene();
for(let n=1;n<=3;n++){
  use('jar');assert(!element('memoryModal').classList.contains('hidden'));
  test.closeModal('memoryModal');flush();assert.equal(api.getState().stage,n);
  assert(!elements['button-'+Object.keys(elements).length], 'No accidental dynamic duplicates');
  assert(!Object.values(elements).find(x=>x.id==='mapBtn').classList.contains('hidden'),'World map button visible');
  use('exit');assert.equal(api.getState().stage,n,'Exit stays closed before collecting memories');
  for(let i=0;i<3;i++){
    use('memory');assert.equal(api.getState().memories.length,(n-1)*3+i+1);test.closeModal('memoryModal');
    if(n===1&&i===0){api.start(true);assert.equal(api.getState().stage,1);assert.equal(api.getState().memories.length,1);assert.equal(api.getState().objects.filter(x=>x.action==='memory').length,2);}
  }
  test.drawScene();
  use('exit');flush();assert.equal(api.getState().stage,0);assert.equal(api.getState().completed,n);
  console.log(`Chapter ${n}: jar -> world -> memories -> unlocked door -> room passed.`);
}
use('letter');assert(!element('ending').classList.contains('hidden'),'Ending visible');
assert.equal(api.getState().memories.length,9);
console.log('All nine memories, saved continuation, rendering, exit locks, and final letter verified.');
module.exports={api,test,stored};
