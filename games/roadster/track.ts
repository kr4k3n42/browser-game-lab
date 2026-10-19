import {Scene,MeshBuilder,StandardMaterial,Color3,Vector3,DynamicTexture,Mesh,TransformNode} from '@babylonjs/core';
export function createTestFacility(scene:Scene){
  function mat(name:string,color:string){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();return m;}
  const sand=mat('desert','#b89b76'),asphalt=mat('asphalt','#293238'),line=mat('track paint','#ddd8bb'),amber=mat('amber','#e6a951'),dark=mat('structures','#28343b');
  const emissive=mat('cyan markers','#66d8d7');emissive.emissiveColor=emissive.diffuseColor.scale(.5);
  const ground=MeshBuilder.CreateGround('desert',{width:3000,height:3000},scene);ground.material=sand;ground.position.y=-.025;
  const surface=new DynamicTexture('asphalt grain',{width:256,height:256},scene,false),ctx=surface.getContext();ctx.fillStyle='#30383e';ctx.fillRect(0,0,256,256);
  let seed=135;for(let i=0;i<8000;i++){seed=(seed*16807)%2147483647;const x=seed%256;seed=(seed*16807)%2147483647;ctx.fillStyle=i%2?'#394147':'#252d33';ctx.fillRect(x,seed%256,1,1);}surface.update();surface.uScale=8;surface.vScale=20;asphalt.diffuseTexture=surface;
  function box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial){const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);mesh.position.set(x,y,z);mesh.material=m;return mesh;}
  box('launch straight',0,-.02,20,24,.04,570,asphalt);
  box('handling apron',0,-.035,-105,150,.04,100,asphalt);
  const paths=[96,112].map(radius=>Array.from({length:257},(_,i)=>{const a=i*Math.PI/128;return new Vector3(Math.cos(a)*radius,.015,Math.sin(a)*210+20);}));
  const circuit=MeshBuilder.CreateRibbon('handling circuit',{pathArray:paths,sideOrientation:Mesh.DOUBLESIDE},scene);circuit.material=asphalt;
  for(let z=-245;z<300;z+=12){if(z>=28&&z<=70)continue;box('runway dash',0,.035,z,.18,.02,5,line);}
  for(const x of [-11.5,11.5])box('runway edge',x,.025,20,.14,.02,570,line);
  const ramp=MeshBuilder.CreateRibbon('launch ramp',{pathArray:[-7,7].map(x=>[new Vector3(x,.02,35),new Vector3(x,6.6,65)]),sideOrientation:Mesh.DOUBLESIDE},scene);ramp.material=asphalt;
  for(const x of [-6.8,6.8]){const edge=MeshBuilder.CreateLines('ramp edge',{points:[new Vector3(x,.08,35),new Vector3(x,6.68,65)]},scene);edge.color=Color3.FromHexString('#efb96a');}
  for(let i=0;i<6;i++){
    const z=37+i*4.5,y=(z-35)*.22+.05;
    for(const side of [-1,1]){const chevron=box('launch chevron',side*1.1,y,z,.12,.025,2.7,amber);chevron.rotation.x=-Math.atan(.22);chevron.rotation.y=side*.65;}
  }
  for(const [z,radius] of [[130,11],[205,16]]){
    const target=MeshBuilder.CreateTorus('landing target',{diameter:radius*2,thickness:.13,tessellation:80},scene);target.position.set(0,.08,z);target.material=emissive;
    box('landing stripe',0,.04,z,.2,.02,radius*2,emissive);box('landing stripe',0,.04,z,radius*2,.02,.2,emissive);
  }
  for(let i=0;i<65;i++){
    const a=i*Math.PI*2/65;
    for(const radius of [94,114]){
      const bollard=MeshBuilder.CreateCylinder('circuit bollard',{height:.7,diameter:.22,tessellation:6},scene);bollard.position.set(Math.cos(a)*radius,.35,Math.sin(a)*210+20);bollard.material=i%2?line:amber;
    }
  }
  for(let z=-420;z<=420;z+=20)for(const x of [-262,262])box('safety fence post',x,1,z,.22,2,.22,dark);
  for(const z of [-432,432])box('safety fence',0,1,z,525,2,.2,dark);
  for(const x of [-262,262])box('safety rail',x,1,0,.15,.12,860,dark);
  function sign(text:string,x:number,y:number,z:number,width=12){
    const tex=new DynamicTexture(text,{width:1024,height:256},scene,false);const c=tex.getContext() as CanvasRenderingContext2D;c.fillStyle='#14222b';c.fillRect(0,0,1024,256);c.fillStyle='#b7e5dd';c.font='bold 72px sans-serif';c.textAlign='center';c.fillText(text,512,150);tex.update();
    const material=mat(text+' sign','#ffffff');material.diffuseTexture=tex;material.emissiveColor=new Color3(.15,.18,.18);material.backFaceCulling=false;
    const panel=MeshBuilder.CreatePlane(text,{width,height:width/4,sideOrientation:Mesh.DOUBLESIDE},scene);panel.position.set(x,y,z);panel.material=material;
    box('sign support',x,y/2,z,.15,y,.15,dark);
  }
  sign('01 / LAUNCH',-15,4,29);sign('02 / LANDING',-20,4,130);sign('ROADSTER / TEST OPERATIONS',-28,6,-75,22);
  box('hangar',-65,5,-160,30,10,22,dark);box('hangar opening',-65,3.5,-148.8,22,7,.1,asphalt);
  for(let i=0;i<9;i++){const rib=box('hangar ribs',-79+i*3.5,5.5,-148.6,.2,9,.3,line);rib.isPickable=false;}
  // Distant low-poly ridges establish scale without downloaded scenery.
  for(let i=0;i<38;i++){
    const angle=i*Math.PI*2/38,r=800+(i%4)*70;
    const mountain=MeshBuilder.CreateCylinder('mesa',{height:70+(i%6)*18,diameterTop:25,diameterBottom:180+(i%4)*30,tessellation:5},scene);
    mountain.position.set(Math.sin(angle)*r,20,Math.cos(angle)*r);mountain.material=sand;
  }
}
