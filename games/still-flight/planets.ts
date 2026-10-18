import { Scene, Mesh, MeshBuilder, StandardMaterial, DynamicTexture, Color3, Vector3 } from '@babylonjs/core';

export type PlanetTarget={mesh:Mesh;radius:number;rings:Mesh[]};
export function createPlanetSystem(scene:Scene,original:Mesh):PlanetTarget[]{
  let seed=9821;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const specs=[
    {name:'Pelagic',radius:50,position:original.position.clone(),colors:['#124467','#287f96','#8ebbb8'],style:'ocean',ring:false},
    {name:'Cinder',radius:12,position:new Vector3(-48,-12,100),colors:['#512f27','#ae6540','#dba872'],style:'crater',ring:false},
    {name:'Aurora',radius:32,position:new Vector3(10,48,215),colors:['#53697e','#a9b1ac','#d8c4a0'],style:'bands',ring:true},
    {name:'Frost',radius:20,position:new Vector3(-145,60,280),colors:['#486c87','#aacdd9','#e7f4ef'],style:'ice',ring:true},
    {name:'Vesper',radius:65,position:new Vector3(235,100,410),colors:['#584d76','#927a9d','#d4b7ae'],style:'bands',ring:false}
  ];
  return specs.map((s,index)=>{
    const mesh=index===0?original:MeshBuilder.CreateSphere(s.name,{diameter:s.radius*2,segments:40},scene);
    mesh.position.copyFrom(s.position);mesh.name=s.name;
    const texture=new DynamicTexture(s.name+' surface',{width:1024,height:512},scene,false);
    const ctx=texture.getContext() as CanvasRenderingContext2D;ctx.fillStyle=s.colors[0];ctx.fillRect(0,0,1024,512);
    if(s.style==='bands'){
      for(let y=0;y<512;y+=3){ctx.fillStyle=s.colors[Math.floor(random()*3)];ctx.globalAlpha=.25+random()*.5;ctx.fillRect(0,y,1024,3+random()*10);}
    }else{
      for(let i=0;i<650;i++){
        ctx.globalAlpha=.12+random()*.5;ctx.fillStyle=s.colors[1+Math.floor(random()*2)];
        ctx.beginPath();ctx.ellipse(random()*1024,random()*512,3+random()*45,2+random()*18,random()*Math.PI,0,Math.PI*2);ctx.fill();
      }
      if(s.style==='ice'){ctx.globalAlpha=.65;ctx.fillStyle=s.colors[2];ctx.fillRect(0,0,1024,38);ctx.fillRect(0,474,1024,38);}
      if(s.style==='crater')for(let i=0;i<75;i++){
        ctx.globalAlpha=.4;ctx.strokeStyle=s.colors[0];ctx.lineWidth=2;ctx.beginPath();ctx.arc(random()*1024,random()*512,3+random()*16,0,Math.PI*2);ctx.stroke();
      }
    }
    ctx.globalAlpha=1;texture.update();
    const material=new StandardMaterial(s.name+' matte surface',scene);material.diffuseTexture=texture;material.specularColor=Color3.Black();mesh.material=material;
    const rings:Mesh[]=[];
    if(s.ring){
      const ringMaterial=new StandardMaterial(s.name+' ring dust',scene);ringMaterial.diffuseColor=Color3.FromHexString(s.colors[2]);ringMaterial.specularColor=Color3.Black();ringMaterial.backFaceCulling=false;ringMaterial.alpha=.65;
      for(let band=0;band<4;band++){
        const inner=s.radius*(1.35+band*.19),outer=inner+s.radius*.13;
        const ring=MeshBuilder.CreateRibbon(s.name+' rings',{pathArray:[inner,outer].map(radius=>Array.from({length:129},(_,k)=>new Vector3(Math.cos(k*Math.PI/64)*radius,0,Math.sin(k*Math.PI/64)*radius))),sideOrientation:Mesh.DOUBLESIDE},scene);
        ring.parent=mesh;ring.rotation.z=.36;ring.rotation.x=.25;ring.material=ringMaterial;ring.isPickable=false;rings.push(ring);
      }
    }
    return {mesh,radius:s.radius,rings};
  });
}
