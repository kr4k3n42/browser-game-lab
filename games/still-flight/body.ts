import { Scene, TransformNode, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, Quaternion } from '@babylonjs/core';

export function createAstronautBody(scene:Scene,suit:TransformNode,hands:TransformNode[]){
  const fabric=new StandardMaterial('suit-fabric',scene);fabric.diffuseColor=Color3.FromHexString('#b9c8ce');fabric.specularColor=Color3.FromHexString('#18232a');
  const joints=new StandardMaterial('joint-fabric',scene);joints.diffuseColor=Color3.FromHexString('#263c48');
  const trim=new StandardMaterial('suit-orange',scene);trim.diffuseColor=Color3.FromHexString('#ce8047');
  const cuffMaterial=new StandardMaterial('matte-gray-cuffs',scene);cuffMaterial.diffuseColor=Color3.FromHexString('#727b80');cuffMaterial.specularColor=Color3.Black();
  function box(name:string,size:Vector3,p:Vector3,material:StandardMaterial){const m=MeshBuilder.CreateBox(name,{width:size.x,height:size.y,depth:size.z},scene);m.parent=suit;m.position=p;m.material=material;return m;}
  function sphere(name:string,p:Vector3,scale:Vector3){const m=MeshBuilder.CreateSphere(name,{diameter:1,segments:16},scene);m.parent=suit;m.position=p;m.scaling=scale;m.material=fabric;return m;}
  sphere('pressure-torso',new Vector3(0,-.65,-.1),new Vector3(.66,.84,.46));
  box('chest-control-pack',new Vector3(.34,.25,.12),new Vector3(0,-.57,.17),joints);
  box('chest-stripe',new Vector3(.35,.045,.025),new Vector3(0,-.5,.24),trim);
  box('life-support-pack',new Vector3(.51,.72,.26),new Vector3(0,-.68,-.4),joints);
  sphere('hip-section',new Vector3(0,-1.08,-.08),new Vector3(.59,.35,.4));
  function link(name:string,a:Vector3,b:Vector3,diameter:number,material:StandardMaterial){const mesh=MeshBuilder.CreateCylinder(name,{height:1,diameter,tessellation:16},scene);mesh.parent=suit;mesh.material=material;updateLink(mesh,a,b);return mesh;}
  function updateLink(mesh:Mesh,a:Vector3,b:Vector3){const delta=b.subtract(a);mesh.position=a.add(b).scale(.5);mesh.scaling.y=delta.length();const direction=delta.normalize(),axis=Vector3.Cross(Vector3.Up(),direction),angle=Math.acos(Math.max(-1,Math.min(1,direction.y)));mesh.rotationQuaternion=axis.lengthSquared()>1e-8?Quaternion.RotationAxis(axis.normalize(),angle):Quaternion.RotationAxis(Vector3.Right(),angle);
  }
  for(const side of [-1,1]){
    const hip=new Vector3(side*.18,-1.13,-.06),knee=new Vector3(side*.22,-1.63,.04),ankle=new Vector3(side*.25,-2.04,.12);
    link('thigh',hip,knee,.26,fabric);sphere('knee',knee,new Vector3(.25,.2,.25));link('shin',knee,ankle,.22,fabric);
    box('boot',new Vector3(.25,.22,.43),new Vector3(side*.25,-2.13,.22),joints);
  }
  const arms=hands.map((hand,i)=>{const side=i===0?-1:1,shoulder=new Vector3(side*.35,-.42,-.08),elbow=new Vector3(side*.5,-.65,.25);
    const shoulderMesh=sphere('shoulder',shoulder,new Vector3(.24,.25,.26));
    const upper=link('upper-arm',shoulder,elbow,.19,fabric),fore=link('forearm',elbow,hand.position,.16,fabric);
    const joint=sphere('elbow',elbow,new Vector3(.18,.18,.18));joint.material=joints;
    const cuff=sphere('wrist-cuff',hand.position.clone(),new Vector3(.18,.14,.15));cuff.material=cuffMaterial;
    return {side,shoulder,shoulderMesh,hand,upper,fore,joint,cuff};});
  return ()=>arms.forEach(a=>{const wrist=a.hand.position.add(new Vector3(0,0,-.09));const elbow=a.shoulder.add(wrist).scale(.5).add(new Vector3(a.side*.17,-.17,-.03));updateLink(a.upper,a.shoulder,elbow);updateLink(a.fore,elbow,wrist);a.joint.position.copyFrom(elbow);a.cuff.position.copyFrom(wrist);});
}
