import {
  ArcRotateCamera,
  Color3,
  Color4,
  EngineFactory,
  GlowLayer,
  HemisphericLight,
  MeshBuilder,
  PBRMaterial,
  PointLight,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from "@babylonjs/core";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas");
const status = document.querySelector<HTMLDivElement>("#loading-status");

if (!canvas || !status) throw new Error("First Light could not find its canvas.");

const gameCanvas = canvas;
const loadingStatus = status;

async function start(): Promise<void> {
  const engine = await EngineFactory.CreateAsync(gameCanvas, {
    antialias: true,
    adaptToDeviceRatio: true,
  });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.025, 0.03, 0.055, 1);

  const camera = new ArcRotateCamera("camera", -Math.PI / 2.2, Math.PI / 2.65, 15, new Vector3(0, 1.5, 0), scene);
  camera.lowerRadiusLimit = 7;
  camera.upperRadiusLimit = 28;
  camera.wheelDeltaPercentage = 0.01;
  camera.attachControl(gameCanvas, true);

  const moonLight = new HemisphericLight("moon-light", new Vector3(0, 1, 0), scene);
  moonLight.intensity = 0.18;
  moonLight.diffuse = new Color3(0.28, 0.38, 0.9);
  moonLight.groundColor = new Color3(0.03, 0.05, 0.1);

  const sun = new PointLight("first-light", new Vector3(0, 6, 1), scene);
  sun.diffuse = new Color3(1, 0.46, 0.18);
  sun.intensity = 9;
  sun.range = 18;

  const groundMaterial = new PBRMaterial("ground-material", scene);
  groundMaterial.albedoColor = new Color3(0.035, 0.05, 0.09);
  groundMaterial.roughness = 0.82;
  const ground = MeshBuilder.CreateGround("ground", { width: 34, height: 34, subdivisions: 32 }, scene);
  ground.material = groundMaterial;

  const horizonMaterial = new StandardMaterial("horizon-material", scene);
  horizonMaterial.diffuseColor = new Color3(0.07, 0.04, 0.18);
  horizonMaterial.emissiveColor = new Color3(0.05, 0.025, 0.14);
  const horizon = MeshBuilder.CreateDisc("horizon", { radius: 18, tessellation: 64 }, scene);
  horizon.rotation.x = Math.PI / 2;
  horizon.position.y = 0.02;
  horizon.material = horizonMaterial;

  const beaconMaterial = new PBRMaterial("beacon-material", scene);
  beaconMaterial.albedoColor = new Color3(0.24, 0.12, 0.08);
  beaconMaterial.emissiveColor = new Color3(1, 0.15, 0.035);
  beaconMaterial.emissiveIntensity = 4;

  const beacon = MeshBuilder.CreateCylinder("beacon", { height: 4.2, diameterTop: 0.7, diameterBottom: 1.4, tessellation: 8 }, scene);
  beacon.position.y = 2.1;
  beacon.material = beaconMaterial;

  const ringMaterial = new StandardMaterial("ring-material", scene);
  ringMaterial.diffuseColor = new Color3(0.08, 0.02, 0.02);
  ringMaterial.emissiveColor = new Color3(1, 0.16, 0.04);
  const ring = MeshBuilder.CreateTorus("ring", { diameter: 3.4, thickness: 0.08, tessellation: 64 }, scene);
  ring.position.y = 2.2;
  ring.material = ringMaterial;

  const glow = new GlowLayer("glow", scene, { blurKernelSize: 48 });
  glow.intensity = 0.8;

  const dustMaterial = new StandardMaterial("dust-material", scene);
  dustMaterial.diffuseTexture = new Texture("data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=", scene);
  dustMaterial.emissiveColor = new Color3(0.22, 0.22, 0.55);
  for (let i = 0; i < 70; i += 1) {
    const dust = MeshBuilder.CreateSphere(`dust-${i}`, { diameter: 0.025 + Math.random() * 0.06, segments: 4 }, scene);
    dust.position = new Vector3((Math.random() - 0.5) * 26, 0.3 + Math.random() * 9, (Math.random() - 0.5) * 26);
    dust.material = dustMaterial;
  }

  let time = 0;
  engine.runRenderLoop(() => {
    time += engine.getDeltaTime() * 0.001;
    ring.rotation.y = time * 0.7;
    beacon.rotation.y = Math.sin(time * 0.4) * 0.08;
    sun.position.x = Math.sin(time * 0.45) * 3;
    sun.position.z = Math.cos(time * 0.45) * 3;
    scene.render();
  });

  window.addEventListener("resize", () => engine.resize());
  loadingStatus.textContent = "Prototype ready";
}

start().catch((error: unknown) => {
  console.error(error);
  loadingStatus.textContent = "The prototype could not start in this browser.";
});
