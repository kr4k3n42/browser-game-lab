import { Scene, FreeCamera, TransformNode, Mesh, MeshBuilder, Vector3, Quaternion, StandardMaterial, Color3 } from '@babylonjs/core';

export function addWristRockets(scene:Scene,camera:FreeCamera,hands:TransformNode[],planet:Mesh,canFire:()=>boolean){
  const material=(name:string,color:string,emissive=false)=>{
    const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(.08,.08,.08);
    if(emissive){m.disableLighting=true;m.emissiveColor=m.diffuseColor;}return m;
  };
  const housing=material('launcher graphite','#344953'),shell=material('rocket shell','#b5c9cc');
  const flame=material('rocket flame','#ffb75b',true),fire=material('planet fire','#ff823d',true),rock=material('planet fragments','#31566a');
  const mounts=hands.map((hand,i)=>{
    const mount=new TransformNode('wrist launcher '+i,scene);mount.parent=hand;mount.position.set(0,.09,-.04);
    const tube=MeshBuilder.CreateCylinder('launcher barrel',{height:.32,diameter:.085,tessellation:12},scene);
    tube.parent=mount;tube.rotation.x=Math.PI/2;tube.material=housing;
    const rim=MeshBuilder.CreateTorus('launcher muzzle',{diameter:.085,thickness:.018,tessellation:12},scene);
    rim.parent=mount;rim.rotation.x=Math.PI/2;rim.position.z=.17;rim.material=shell;
    return mount;
  });
  const shots:{mesh:TransformNode;velocity:Vector3;age:number}[]=[];
  const fragments:{mesh:Mesh;velocity:Vector3;age:number}[]=[];
  let cooldown=0,side=0,blast:Mesh|null=null,blastAge=0;
  const fireButton=document.createElement('button');fireButton.id='fire-rockets';fireButton.textContent='F · FIRE';fireButton.title='Fire wrist rocket toward crosshair';
  const mobile=document.querySelector('.mobile-holds');(mobile??document.body).append(fireButton);
  const notice=document.createElement('div');notice.id='rocket-status';notice.setAttribute('role','status');document.body.append(notice);
  function explode(){
    if(!planet.isEnabled())return;
    planet.setEnabled(false);notice.textContent='PLANET DESTROYED · RESET PRACTICE TO RESTORE';
    blast=MeshBuilder.CreateSphere('planet explosion',{diameter:100,segments:20},scene);blast.position.copyFrom(planet.position);blast.material=fire;blastAge=0;
    for(let i=0;i<96;i++){
      const y=1-2*(i+.5)/96,angle=i*2.399963,r=Math.sqrt(1-y*y),direction=new Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r);
      const chunk=MeshBuilder.CreatePolyhedron('planet debris',{type:1,size:1.5+Math.random()*4},scene);
      chunk.position=planet.position.add(direction.scale(25+Math.random()*20));chunk.material=i%5===0?fire:rock;chunk.isPickable=false;
      fragments.push({mesh:chunk,velocity:direction.scale(12+Math.random()*22),age:0});
    }
  }
  function launch(){
    if(!canFire()||cooldown>0)return;
    cooldown=.4;
    const mount=mounts[side++%mounts.length];mount.computeWorldMatrix(true);
    const origin=Vector3.TransformCoordinates(new Vector3(0,0,.22),mount.getWorldMatrix());
    const direction=camera.getForwardRay().direction.normalize();
    const target=camera.position.add(direction.scale(600));
    const travel=target.subtract(origin).normalize();
    const missile=new TransformNode('fired rocket',scene);missile.position.copyFrom(origin);
    const axis=Vector3.Cross(Vector3.Up(),travel),angle=Math.acos(Math.max(-1,Math.min(1,travel.y)));
    missile.rotationQuaternion=axis.lengthSquared()>1e-8?Quaternion.RotationAxis(axis.normalize(),angle):Quaternion.RotationAxis(Vector3.Right(),angle);
    const body=MeshBuilder.CreateCylinder('rocket',{height:.5,diameter:.09,tessellation:8},scene);body.parent=missile;body.material=shell;
    const nose=MeshBuilder.CreateCylinder('rocket nose',{height:.17,diameterTop:0,diameterBottom:.09,tessellation:8},scene);nose.parent=missile;nose.position.y=.335;nose.material=shell;
    const exhaust=MeshBuilder.CreateCylinder('rocket exhaust',{height:.65,diameterTop:.08,diameterBottom:0,tessellation:8},scene);exhaust.parent=missile;exhaust.position.y=-.55;exhaust.material=flame;
    shots.push({mesh:missile,velocity:travel.scale(110),age:0});
  }
  fireButton.onclick=launch;
  window.addEventListener('keydown',event=>{if(event.code==='KeyF'&&!event.repeat&&!event.ctrlKey&&!event.metaKey){event.preventDefault();launch();}});
  function reset(){
    shots.splice(0).forEach(s=>s.mesh.dispose());fragments.splice(0).forEach(f=>f.mesh.dispose());blast?.dispose();blast=null;
    planet.setEnabled(true);cooldown=0;notice.textContent='';
  }
  scene.onBeforeRenderObservable.add(()=>{
    if(!canFire())return;
    const dt=Math.min(scene.getEngine().getDeltaTime()/1000,.04);cooldown=Math.max(0,cooldown-dt);
    for(let i=shots.length-1;i>=0;i--){
      const shot=shots[i],previous=shot.mesh.position.clone(),step=shot.velocity.scale(dt);shot.mesh.position.addInPlace(step);shot.age+=dt;
      // Swept sphere intersection prevents fast rockets passing through the planet.
      const toCenter=planet.position.subtract(previous),t=Math.max(0,Math.min(1,Vector3.Dot(toCenter,step)/Math.max(step.lengthSquared(),1e-8)));
      const hit=planet.isEnabled()&&Vector3.DistanceSquared(previous.add(step.scale(t)),planet.position)<=2500;
      if(hit)explode();
      if(hit||shot.age>8){shot.mesh.dispose();shots.splice(i,1);}
    }
    if(blast){blastAge+=dt;blast.scaling.setAll(1+blastAge*.85);blast.visibility=Math.max(0,1-blastAge/1.8);if(blastAge>=1.8){blast.dispose();blast=null;}}
    for(let i=fragments.length-1;i>=0;i--){const f=fragments[i];f.age+=dt;f.mesh.position.addInPlace(f.velocity.scale(dt));f.mesh.rotation.addInPlace(new Vector3(dt*.3,dt*.5,dt*.2));f.mesh.visibility=Math.min(1,Math.max(0,(9-f.age)/3));if(f.age>=9){f.mesh.dispose();fragments.splice(i,1);}}
  });
  return {reset};
}
