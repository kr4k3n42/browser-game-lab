import { Vector3, Quaternion, Matrix } from '@babylonjs/core';

export type CollisionBox={center:Vector3;half:Vector3;orientation:Quaternion};
export function boxesContact(a:CollisionBox,b:CollisionBox){
  const axes=(q:Quaternion)=>{const m=Matrix.FromQuaternionToRef(q,Matrix.Identity());return [Vector3.Right(),Vector3.Up(),Vector3.Forward()].map(v=>Vector3.TransformNormal(v,m));};
  const aa=axes(a.orientation),bb=axes(b.orientation),delta=b.center.subtract(a.center);
  let depth=Infinity,normal=Vector3.Right();
  for(const candidate of [...aa,...bb,...aa.flatMap(x=>bb.map(y=>Vector3.Cross(x,y)))]){
    if(candidate.lengthSquared()<1e-10)continue;
    const n=candidate.normalize();
    const extent=(box:CollisionBox,axis:Vector3[])=>[box.half.x,box.half.y,box.half.z].reduce((sum,h,i)=>sum+h*Math.abs(Vector3.Dot(axis[i],n)),0);
    const overlap=extent(a,aa)+extent(b,bb)-Math.abs(Vector3.Dot(delta,n));
    if(overlap<=0)return;
    if(overlap<depth){depth=overlap;normal=Vector3.Dot(delta,n)>=0?n:n.scale(-1);}
  }
  return {normal,depth};
}

export function collisionImpulse(a:Vector3,b:Vector3,normal:Vector3,massA:number,massB:number){
  const closing=Vector3.Dot(b.subtract(a),normal);
  if(closing>=0)return 0;
  const impulse=-(1+.12)*closing/(1/massA+1/massB);
  a.subtractInPlace(normal.scale(impulse/massA));
  b.addInPlace(normal.scale(impulse/massB));
  return impulse;
}

// Sphere against a box in station-local coordinates, including embedded centers.
export function boxContact(point:Vector3,center:Vector3,half:Vector3,radius:number){
  const p=point.subtract(center);
  const closest=new Vector3(Math.max(-half.x,Math.min(half.x,p.x)),Math.max(-half.y,Math.min(half.y,p.y)),Math.max(-half.z,Math.min(half.z,p.z)));
  const delta=p.subtract(closest),distance=delta.length();
  if(distance>=radius)return;
  if(distance>1e-8)return {normal:delta.scale(1/distance),depth:radius-distance};
  const gaps=[half.x-Math.abs(p.x),half.y-Math.abs(p.y),half.z-Math.abs(p.z)];
  const axis=gaps.indexOf(Math.min(...gaps));
  const normal=Vector3.Zero();normal[['x','y','z'][axis] as 'x'|'y'|'z']=([p.x,p.y,p.z][axis]<0?-1:1);
  return {normal,depth:radius+gaps[axis]};
}

// Visible ring lies in the local XY plane. The hole remains open.
export function ringContact(point:Vector3,radius:number){
  const radial=Math.hypot(point.x,point.y);
  const closest=radial>1e-8?new Vector3(point.x*.7/radial,point.y*.7/radial,0):new Vector3(.7,0,0);
  const delta=point.subtract(closest),distance=delta.length(),reach=radius+.065;
  if(distance>=reach)return;
  return {normal:distance>1e-8?delta.scale(1/distance):new Vector3(0,0,1),depth:reach-distance};
}
