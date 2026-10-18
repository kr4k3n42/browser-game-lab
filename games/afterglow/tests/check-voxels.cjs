const assert=require('assert/strict');
const {api,test,stored}=require('./check-game.cjs');
function walkableGraph(){
 const state=api.getState(),n=state.grid.length,step=.10,scale=10,size=n*scale,valid=new Uint8Array(size*size),seen=new Set(),queue=[];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)valid[y*size+x]=api.canMove((x+.5)/scale,(y+.5)/scale)?1:0;
 const sx=Math.floor(state.player.x*scale),sy=Math.floor(state.player.y*scale),start=sy*size+sx;
 assert(valid[start],'Player starts outside all colliders');seen.add(start);queue.push(start);
 for(let i=0;i<queue.length;i++){const p=queue[i],x=p%size,y=Math.floor(p/size);for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dx,ny=y+dy,id=ny*size+nx;if(nx>=0&&ny>=0&&nx<size&&ny<size&&valid[id]&&!seen.has(id)){seen.add(id);queue.push(id)}}}
 for(const o of state.objects){
  if(o.kind==='window'){assert.equal(api.objectBox(o),null,'Window is non-solid');continue}
  assert(!api.canMove(o.x,o.y),o.kind+' centre is solid');
  if(o.action){let accessible=false;for(const id of seen){const x=(id%size+.5)/scale,y=(Math.floor(id/size)+.5)/scale;if(Math.hypot(x-o.x,y-o.y)>.95)continue;let clear=true;for(let t=0;t<=1;t+=.1){if(state.grid[Math.floor(y+(o.y-y)*t)]?.[Math.floor(x+(o.x-x)*t)]!==0){clear=false;break}}if(clear){accessible=true;break}}assert(accessible,o.kind+' accessible from spawn without crossing walls or objects')}
 }
 // Every originally traversable tile retains at least one reachable standing point.
 let unreachable=[];for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){if(state.grid[y][x])continue;let found=false;for(let yy=y*scale;yy<(y+1)*scale&&!found;yy++)for(let xx=x*scale;xx<(x+1)*scale;xx++)if(seen.has(yy*size+xx)){found=true;break}if(!found)unreachable.push([x,y])}
 if(state.stage)assert.equal(unreachable.length,0,'No maze tile is cut off by a solid prop');
 return seen.size;
}
api.start(false);
assert(walkableGraph()>1000);
for(const o of api.getState().objects){const model=api.voxelModel(o.kind);assert(model.blocks.length>=3,o.kind+' uses stacked cuboids');for(const b of model.blocks){assert(b.w>0&&b.d>0&&b.h>0);assert(b.color.every(Number.isFinite))}}
// Attempt a large forward move through the table: substeps must stop before it.
test.setPosition(4.5,5.8,-Math.PI/2);test.move(0,-2.8);let p=api.getState().player;
const table=api.getState().objects.find(o=>o.kind==='table'),limit=api.objectBox(table).maxY+api.scale.PLAYER_RADIUS_UNITS/api.scale.WORLD_UNITS_PER_TILE;assert(p.y>=limit&&p.y<limit+.06,'High displacement does not tunnel through table');assert(api.canMove(p.x,p.y));
// Walking around the blocked footprint remains possible.
test.move(1,0);test.move(0,-2);assert(api.getState().player.y<4.0,'Can walk around solid table');
// A save from the old game may put the player inside a newly solid table.
const old=JSON.parse(stored['afterglow-save-v1']);old.player={x:4.5,y:4.3,a:0};stored['afterglow-save-v1']=JSON.stringify(old);api.start(true);p=api.getState().player;assert(api.canMove(p.x,p.y),'Old saves are resolved out of new colliders');assert(Math.hypot(p.x-4.5,p.y-4.3)>.5);
for(let n=1;n<=3;n++){api.loadWorld(n);const reachable=walkableGraph();console.log(`Chapter ${n}: ${reachable} reachable collision-safe standing points; all paths and interactions open.`)}
api.loadRoom();test.setPosition(4.5,6.5,-Math.PI/2);
const near={kind:'lamp',x:4.5,y:4.5},far={kind:'lamp',x:4.5,y:3.5};
test.setObjects([near]);const a=test.renderProps();test.setObjects([far]);const b=test.renderProps();test.setObjects([far,near]);const together=test.renderProps();
let overlap=0,painted=0;for(let i=0;i<a.depth.length;i++){const expected=Math.min(a.depth[i],b.depth[i]);if(Number.isFinite(expected)){painted++;assert(Math.abs(together.depth[i]-expected)<.0001,'Nearest face wins per pixel');}if(Number.isFinite(a.depth[i])&&Number.isFinite(b.depth[i]))overlap++}
assert(painted>400&&overlap>100,'Depth test covers a substantial overlap');
test.setObjects([near,far]);const reversed=test.renderProps();assert.deepEqual([...reversed.depth],[...together.depth],'Object draw order cannot change occlusion');
const behindWall=test.renderProps(.8);assert(!behindWall.pixels.some((v,i)=>i%4===3&&v),'Wall occludes voxel geometry');
test.setObjects([near]);test.setPosition(5.7,5.8,Math.atan2(4.5-5.8,4.5-5.7));const side=test.renderProps();assert.notDeepEqual([...a.pixels],[...side.pixels],'Walking around shows different projected faces');
test.setPosition(4.5,4.53,-Math.PI/2);const close=test.renderProps();assert(close.depth.every(v=>v===Infinity||(Number.isFinite(v)&&v>=.054)),'Near-plane clipping produces valid depth');
console.log(`Voxel geometry verified: ${painted} covered pixels, ${overlap} overlapping pixels, correct wall and mutual occlusion, walk-around view, near clipping, solid footprints, substep collision, and old-save recovery.`);
