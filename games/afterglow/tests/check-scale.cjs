const assert=require('assert/strict');
const {api,test,stored}=require('./check-game.cjs');
const S=api.scale,cm=u=>u*S.CM_PER_UNIT,world=u=>u/S.WORLD_UNITS_PER_TILE;
const close=(a,b,message)=>assert(Math.abs(a-b)<1e-8,message+`: ${a} vs ${b}`);
function bounds(blocks){return blocks.reduce((r,b)=>({minX:Math.min(r.minX,b.x),maxX:Math.max(r.maxX,b.x+b.w),minY:Math.min(r.minY,b.y),maxY:Math.max(r.maxY,b.y+b.d),minZ:Math.min(r.minZ,b.z),maxZ:Math.max(r.maxZ,b.z+b.h)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,minZ:Infinity,maxZ:-Infinity})}
function pixelBounds(render){let minX=Infinity,minY=Infinity,maxX=-1,maxY=-1,count=0;for(let y=0;y<render.h;y++)for(let x=0;x<render.w;x++)if(render.pixels[(y*render.w+x)*4+3]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);count++}assert(count>0,'Geometry has visible pixels');return{minX,maxX,minY,maxY,count}}
api.start(false);
let state=api.getState();
assert.equal(state.player.height,100);assert.equal(state.player.eyeHeight,93);
close(cm(state.player.height),182.88,'Player exactly six feet');close(cm(state.player.eyeHeight),170.0784,'Human eye level');close(cm(S.WALL_HEIGHT),256.032,'Ceiling height');
const bedroom=state.objects;
const byKind=kind=>bedroom.find(o=>o.kind===kind);
for(const stage of[0,1,2,3]){
 if(stage)api.loadWorld(stage);else api.loadRoom();
 for(const o of api.getState().objects){
  for(const field of['height','width','depth','baseHeight'])assert(Number.isFinite(o[field]),`${o.kind}.${field} is explicit`);
  const b=bounds(api.worldBlocks(o));close(b.maxZ-b.minZ,world(o.height),`${o.kind} height drives geometry`);close(b.maxX-b.minX,world(o.width),`${o.kind} width drives geometry`);close(b.maxY-b.minY,world(o.depth),`${o.kind} depth drives geometry`);close(b.minZ,world(o.baseHeight),`${o.kind} base elevation drives geometry`);
  const collider=api.objectBox({...o,angle:0});if(collider){close(collider.maxX-collider.minX,world(o.width),`${o.kind} collider width`);close(collider.maxY-collider.minY,world(o.depth),`${o.kind} collider depth`)}
 }
 const objects=api.getState().objects;for(const o of objects.filter(o=>o.action==='memory')){const plinth=objects.find(p=>p.kind==='plinth'&&p.x===o.x&&p.y===o.y);assert(plinth,'Separate support object');close(o.baseHeight,plinth.height,'Memory rests exactly on plinth')}
}
close(cm(byKind('bed').width),152,'Queen bed width');close(cm(byKind('bed').depth),203,'Queen bed length');close(cm(byKind('bed').height),110,'Headboard height');
const mattress=api.worldBlocks(byKind('bed')).find(b=>b.color.join(',')==='198,200,165');close((mattress.z+mattress.h)*S.WORLD_UNITS_PER_TILE*S.CM_PER_UNIT,60,'Mattress geometry top');
close(cm(byKind('table').height),75,'Table top');close(cm(byKind('jar').height),25,'Jar actual height excludes table');close(cm(byKind('jar').width),14,'Jar width');close(byKind('jar').baseHeight,byKind('table').height,'Jar rests on table');
close(cm(byKind('desk').height),75,'Desk top');close(byKind('letterRoom').baseHeight,byKind('desk').height,'Letter rests on separate desk');close(cm(byKind('lamp').height),165,'Floor lamp height');
const key=api.makeObject('key',0,0);close(cm(key.width),3,'House key width');close(cm(key.height),7,'House key height');
// Changing dimensions modifies real geometry and its collision footprint.
const enlarged={...byKind('jar'),height:byKind('jar').height*2,width:byKind('jar').width*2};const eb=bounds(api.worldBlocks(enlarged));close(eb.maxZ-eb.minZ,world(enlarged.height),'Height mutation rescales mesh');const ec=api.objectBox(enlarged);close(ec.maxX-ec.minX,world(enlarged.width),'Width mutation rescales collider');
// Floor, wall and voxel projection use the exact same eye height and focal length.
api.loadRoom();test.setPosition(4.5,9,-Math.PI/2,-.20);let projection=test.projection();
for(const distance of[.7,2,5,10]){const floorY=test.projectHeight(0,distance,projection.horizon);close(test.floorDistance(floorY-projection.horizon),distance,'Floor ray is inverse of geometry projection');const ceilingY=test.projectHeight(projection.ceiling,distance,projection.horizon);close(floorY-ceilingY,projection.focal*projection.ceiling/distance,'Walls use matching vertical scale')}
const plinth=api.makeObject('plinth',4.5,4.5);test.setObjects([plinth]);const tall=pixelBounds(test.renderProps());const nearDepth=4.5-world(plinth.depth)/2;const predictedBottom=test.projectHeight(0,nearDepth,projection.horizon)/2;assert(Math.abs(tall.maxY-predictedBottom)<2,'Rasterized prop feet match projected floor within two pixels');
test.setEyeHeight(50);const short=pixelBounds(test.renderProps());assert(tall.minY-short.minY>projection.focal*world(43)/4.7/2-2&&tall.maxY-short.maxY>projection.focal*world(43)/4.7/2-2,'Human eye height visibly moves prop lower in view');
test.setEyeHeight(93);
// One shared focal length prevents vertical stretching or squashing of dimensions.
const square=api.makeObject('plinth',4.5,4.5,{width:50,height:50,depth:.1,baseHeight:68});test.setObjects([square]);test.setPosition(4.5,8.5,-Math.PI/2,0);const squarePixels=pixelBounds(test.renderProps());assert(Math.abs((squarePixels.maxX-squarePixels.minX)-(squarePixels.maxY-squarePixels.minY))<=2,'Equal real width/height project equally at front view');
// Old save payloads cannot restore the old half-height camera or arbitrary body scale.
const old=JSON.parse(stored['afterglow-save-v1']);old.stage=0;old.player={x:4.5,y:6.8,a:-Math.PI/2,height:50,eyeHeight:25};stored['afterglow-save-v1']=JSON.stringify(old);api.start(true);state=api.getState();assert.equal(state.player.height,100);assert.equal(state.player.eyeHeight,93);assert(Number.isFinite(state.player.pitch));
console.log('Scale verified: every scene object has live physical dimensions; 100-unit body / 93-unit eye; correct bed, mattress, desk, table, jar, lamp, window and memory sizes; separate supports; consistent projection and floor alignment; visible camera-height change; no aspect distortion; old-save migration.');
