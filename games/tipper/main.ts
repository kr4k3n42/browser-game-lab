import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  DynamicTexture,
  EngineFactory,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Matrix,
  PointLight,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import "./style.css";

type Order = {
  name: string;
  targetFill: number;
  targetFoam: number;
  tip: string;
  color: Color3;
  hint: string;
};

type BeerTicket = {
  order: Order;
  fill: number;
  foam: number;
  served: boolean;
};

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const loadingStatus = document.querySelector<HTMLDivElement>("#loading-status")!;
const startPanel = document.querySelector<HTMLElement>("#start-panel")!;
const orderPanel = document.querySelector<HTMLElement>("#order-panel")!;
const resultPanel = document.querySelector<HTMLElement>("#result-panel")!;
const endPanel = document.querySelector<HTMLElement>("#end-panel")!;
const controls = document.querySelector<HTMLElement>("#controls")!;
const singleActionControls = document.querySelector<HTMLElement>("#single-action-controls")!;
const dualActionControls = document.querySelector<HTMLElement>("#dual-action-controls")!;
const rushPanel = document.querySelector<HTMLElement>("#rush-panel")!;
const startButton = document.querySelector<HTMLButtonElement>("#start-button")!;
const nextButton = document.querySelector<HTMLButtonElement>("#next-button")!;
const restartButton = document.querySelector<HTMLButtonElement>("#restart-button")!;
const pourButton = document.querySelector<HTMLButtonElement>("#pour-button")!;
const primaryPourButton = document.querySelector<HTMLButtonElement>("#pour-primary-button")!;
const secondaryPourButton = document.querySelector<HTMLButtonElement>("#pour-secondary-button")!;
const primaryPourLabel = document.querySelector<HTMLElement>("#primary-pour-label")!;
const secondaryPourLabel = document.querySelector<HTMLElement>("#secondary-pour-label")!;
const serveButton = document.querySelector<HTMLButtonElement>("#serve-button")!;
const switchButton = document.querySelector<HTMLButtonElement>("#switch-button")!;
const flowRange = document.querySelector<HTMLInputElement>("#flow-range")!;
const flowValue = document.querySelector<HTMLElement>("#flow-value")!;
const liveStatus = document.querySelector<HTMLElement>("#live-status")!;
const scoreValue = document.querySelector<HTMLElement>("#score-value")!;
const streakValue = document.querySelector<HTMLElement>("#streak-value")!;
const livesValue = document.querySelector<HTMLElement>("#lives-value")!;
const roundValue = document.querySelector<HTMLElement>("#round-value")!;
const roundSuffix = document.querySelector<HTMLElement>("#round-suffix")!;
const orderName = document.querySelector<HTMLElement>("#order-name")!;
const tipValue = document.querySelector<HTMLElement>("#tip-value")!;
const fillTarget = document.querySelector<HTMLElement>("#fill-target")!;
const foamTarget = document.querySelector<HTMLElement>("#foam-target")!;
const fillMeter = document.querySelector<HTMLElement>("#fill-meter")!;
const foamMeter = document.querySelector<HTMLElement>("#foam-meter")!;
const fillMarker = document.querySelector<HTMLElement>("#fill-marker")!;
const foamMarker = document.querySelector<HTMLElement>("#foam-marker")!;
const orderHint = document.querySelector<HTMLElement>("#order-hint")!;
const rushName = document.querySelector<HTMLElement>("#rush-name")!;
const rushStatus = document.querySelector<HTMLElement>("#rush-status")!;
const resultKicker = document.querySelector<HTMLElement>("#result-kicker")!;
const resultTitle = document.querySelector<HTMLElement>("#result-title")!;
const resultCopy = document.querySelector<HTMLElement>("#result-copy")!;
const resultQuality = document.querySelector<HTMLElement>("#result-quality")!;
const resultPoints = document.querySelector<HTMLElement>("#result-points")!;
const endTitle = document.querySelector<HTMLElement>("#end-title")!;
const endCopy = document.querySelector<HTMLElement>("#end-copy")!;
const finalScore = document.querySelector<HTMLElement>("#final-score")!;
const bestScore = document.querySelector<HTMLElement>("#best-score")!;
const primaryPintReadout = document.querySelector<HTMLElement>("#primary-pint-readout")!;
const secondaryPintReadout = document.querySelector<HTMLElement>("#secondary-pint-readout")!;
const primaryReadoutName = document.querySelector<HTMLElement>("#primary-readout-name")!;
const secondaryReadoutName = document.querySelector<HTMLElement>("#secondary-readout-name")!;
const primaryReadoutFill = document.querySelector<HTMLElement>("#primary-readout-fill")!;
const secondaryReadoutFill = document.querySelector<HTMLElement>("#secondary-readout-fill")!;
const primaryReadoutFoam = document.querySelector<HTMLElement>("#primary-readout-foam")!;
const secondaryReadoutFoam = document.querySelector<HTMLElement>("#secondary-readout-foam")!;
const primaryReadoutFillBar = document.querySelector<HTMLElement>("#primary-readout-fill-bar")!;
const secondaryReadoutFillBar = document.querySelector<HTMLElement>("#secondary-readout-fill-bar")!;
const primaryReadoutFoamBar = document.querySelector<HTMLElement>("#primary-readout-foam-bar")!;
const secondaryReadoutFoamBar = document.querySelector<HTMLElement>("#secondary-readout-foam-bar")!;

if (!canvas || !loadingStatus || !startPanel || !orderPanel || !rushPanel || !resultPanel || !endPanel || !controls || !singleActionControls || !dualActionControls || !startButton || !nextButton || !restartButton || !pourButton || !primaryPourButton || !secondaryPourButton || !primaryPourLabel || !secondaryPourLabel || !serveButton || !switchButton || !flowRange || !flowValue || !liveStatus || !scoreValue || !streakValue || !livesValue || !roundValue || !roundSuffix || !orderName || !tipValue || !fillTarget || !foamTarget || !fillMeter || !foamMeter || !fillMarker || !foamMarker || !orderHint || !rushName || !rushStatus || !resultKicker || !resultTitle || !resultCopy || !resultQuality || !resultPoints || !endTitle || !endCopy || !finalScore || !bestScore || !primaryPintReadout || !secondaryPintReadout || !primaryReadoutName || !secondaryReadoutName || !primaryReadoutFill || !secondaryReadoutFill || !primaryReadoutFoam || !secondaryReadoutFoam || !primaryReadoutFillBar || !secondaryReadoutFillBar || !primaryReadoutFoamBar || !secondaryReadoutFoamBar) {
  throw new Error("Perfect Pour could not find its interface.");
}

const orders: Order[] = [
  { name: "House Lager", targetFill: 0.78, targetFoam: 0.12, tip: "$2.00", color: new Color3(1, 0.54, 0.12), hint: "A clean, confident pour. Don't rush the crown." },
  { name: "Sunset IPA", targetFill: 0.71, targetFoam: 0.19, tip: "$3.50", color: new Color3(1, 0.32, 0.07), hint: "Let it breathe. This one wants a generous head." },
  { name: "Midnight Stout", targetFill: 0.84, targetFoam: 0.08, tip: "$4.00", color: new Color3(0.22, 0.045, 0.018), hint: "Dark and patient. Too much speed wakes the spill." },
  { name: "Crisp Pils", targetFill: 0.75, targetFoam: 0.14, tip: "$2.75", color: new Color3(0.82, 0.68, 0.17), hint: "The regular knows exactly what they want." },
  { name: "Velvet Porter", targetFill: 0.80, targetFoam: 0.16, tip: "$5.00", color: new Color3(0.13, 0.025, 0.012), hint: "A soft landing, a precise finish, a very large tip." },
  { name: "Last Call", targetFill: 0.68, targetFoam: 0.22, tip: "$8.00", color: new Color3(0.92, 0.2, 0.06), hint: "The room is closing. Make this one count." },
];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const percent = (value: number): string => `${Math.round(value * 100)}%`;

let scene: Scene;
let engine: Awaited<ReturnType<typeof EngineFactory.CreateAsync>>;
let beer: Mesh;
let foam: Mesh;
let secondGlass: Mesh;
let secondBeer: Mesh;
let secondFoam: Mesh;
let stream: Mesh;
let streamTip: Mesh;
let secondStream: Mesh;
let secondStreamTip: Mesh;
const tapHandles: Mesh[] = [];
const tapNameTextures: DynamicTexture[] = [];
let rim: Mesh;
let glow: GlowLayer;
const TAP_XS = [-2.25, -1.35, -0.45, 0.45, 1.35, 2.25];
const TICKET_TAPS = [1, 4];
const GLASS_X = TAP_XS[TICKET_TAPS[0]];
const SECOND_GLASS_X = TAP_XS[TICKET_TAPS[1]];
const GLASS_Z = 0.62;
const GLASS_BASE_Y = 1.57;
const SPOUT_Y = 3.42;
const HANDLE_Y = 3.79;
const bubbles: Mesh[] = [];
let activeOrder = 0;
let score = 0;
let streak = 0;
let lives = 3;
let fill = 0;
let foamAmount = 0;
let flow = 0.52;
const pouringTickets: boolean[] = [false, false];
let shiftStarted = false;
let judging = false;
let roundTime = 0;
let lastPourTone = 0;
let audioContext: AudioContext | undefined;
let tickets: BeerTicket[] = [];
let activeTicket = 0;

const isRushRound = (): boolean => activeOrder >= 3;

function setSecondaryPintVisible(visible: boolean): void {
  if (!scene) return;
  if (secondGlass) secondGlass.isVisible = visible;
  if (secondBeer) secondBeer.isVisible = visible;
  if (secondFoam) secondFoam.isVisible = visible;
  for (const mesh of scene.meshes) {
    if (mesh.name.includes("secondary-")) {
      mesh.isVisible = visible;
      mesh.visibility = visible ? 1 : 0;
    }
  }
}

function material(name: string, color: Color3, sceneToUse: Scene, emissive?: Color3, alpha = 1): StandardMaterial {
  const result = new StandardMaterial(name, sceneToUse);
  result.diffuseColor = color;
  result.specularColor = new Color3(0.28, 0.2, 0.15);
  result.alpha = alpha;
  if (emissive) {
    result.emissiveColor = emissive;
  }
  return result;
}

function box(name: string, options: Parameters<typeof MeshBuilder.CreateBox>[1], position: Vector3, mat: StandardMaterial): Mesh {
  const result = MeshBuilder.CreateBox(name, options, scene);
  result.position = position;
  result.material = mat;
  return result;
}

// Every texture and prop is generated locally: the room needs no downloaded assets.
function textureMaterial(name: string, width: number, height: number, draw: (context: CanvasRenderingContext2D) => void): StandardMaterial {
  const texture = new DynamicTexture(`${name}-texture`, { width, height }, scene, false);
  draw(texture.getContext() as CanvasRenderingContext2D);
  texture.update();
  const result = material(name, Color3.White(), scene);
  result.diffuseTexture = texture;
  result.specularColor = new Color3(0.16, 0.13, 0.1);
  return result;
}

function cylinder(name: string, height: number, diameter: number, position: Vector3, mat: StandardMaterial): Mesh {
  const mesh = MeshBuilder.CreateCylinder(name, { height, diameter, tessellation: 24 }, scene);
  mesh.position = position;
  mesh.material = mat;
  return mesh;
}

function createPintGlass(prefix: string, x: number, z: number, baseY: number, beerColor: Color3): { glass: Mesh; beer: Mesh; foam: Mesh; rim: Mesh } {
  const glassMat = material(`${prefix}-glass`, new Color3(0.8, 0.94, 0.94), scene, undefined, 0.12);
  glassMat.backFaceCulling = false;
  glassMat.specularColor = Color3.White();
  glassMat.specularPower = 130;
  const glass = MeshBuilder.CreateLathe(`${prefix}-pint`, {
    shape: [
      new Vector3(0, 0, 0), new Vector3(0.36, 0, 0), new Vector3(0.42, 0.1, 0),
      new Vector3(0.47, 1.16, 0), new Vector3(0.53, 1.26, 0), new Vector3(0.55, 1.34, 0),
      new Vector3(0.55, 1.5, 0), new Vector3(0.52, 1.56, 0), new Vector3(0.49, 1.56, 0),
      new Vector3(0.49, 1.47, 0), new Vector3(0.47, 1.34, 0), new Vector3(0.44, 1.23, 0),
      new Vector3(0.39, 0.1, 0), new Vector3(0, 0.1, 0),
    ], tessellation: 48,
  }, scene);
  glass.position = new Vector3(x, baseY, z);
  glass.material = glassMat;
  const edge = material(`${prefix}-glass-edge`, new Color3(0.73, 0.84, 0.82), scene, new Color3(0.12, 0.15, 0.14), 0.5);
  const rim = MeshBuilder.CreateTorus(`${prefix}-rim`, { diameter: 1.07, thickness: 0.032, tessellation: 48 }, scene);
  rim.position = new Vector3(x, baseY + 1.56, z);
  rim.material = edge;
  const shoulder = MeshBuilder.CreateTorus(`${prefix}-nonic-shoulder`, { diameter: 1.05, thickness: 0.026, tessellation: 48 }, scene);
  shoulder.position = new Vector3(x, baseY + 1.27, z);
  shoulder.material = edge;
  const base = MeshBuilder.CreateTorus(`${prefix}-heavy-base`, { diameter: 0.82, thickness: 0.06, tessellation: 40 }, scene);
  base.position = new Vector3(x, baseY + 0.04, z);
  base.material = edge;
  for (const side of [-1, 1]) {
    pipe(`${prefix}-side-highlight-${side}`, [new Vector3(x + side * 0.4, baseY + 0.08, z + 0.1), new Vector3(x + side * 0.515, baseY + 1.5, z + 0.12)], 0.01, edge);
  }
  const beerMat = material(`${prefix}-beer`, beerColor, scene, beerColor.scale(0.09));
  beerMat.specularPower = 95;
  const beer = MeshBuilder.CreateCylinder(`${prefix}-liquid`, { height: 1.45, diameterTop: 1.0, diameterBottom: 0.76, tessellation: 48 }, scene);
  beer.position = new Vector3(x, baseY + 0.075, z);
  beer.scaling.y = 0.001;
  beer.material = beerMat;
  const foamMat = material(`${prefix}-foam`, new Color3(0.97, 0.93, 0.8), scene, new Color3(0.045, 0.04, 0.025));
  foamMat.specularColor = new Color3(0.1, 0.09, 0.07);
  const foam = MeshBuilder.CreateCylinder(`${prefix}-foam-head`, { height: 0.12, diameter: 0.99, tessellation: 48 }, scene);
  foam.position = new Vector3(x, baseY + 0.09, z);
  foam.scaling.y = 0.2;
  foam.material = foamMat;
  return { glass, beer, foam, rim };
}

function pipe(name: string, path: Vector3[], radius: number, mat: StandardMaterial): Mesh {
  const mesh = MeshBuilder.CreateTube(name, { path, radius, tessellation: 16, cap: Mesh.CAP_ALL }, scene);
  mesh.material = mat;
  return mesh;
}

function wallSign(name: string, width: number, height: number, position: Vector3, mat: StandardMaterial): Mesh {
  const sign = MeshBuilder.CreatePlane(name, { width, height }, scene);
  sign.position = position;
  sign.rotation.y = Math.PI;
  sign.material = mat;
  return sign;
}

function makeTapLabel(index: number, x: number, initialName: string): void {
  const texture = new DynamicTexture(`tap-name-${index}-texture`, { width: 320, height: 72 }, scene, false);
  const mat = material(`tap-name-${index}`, Color3.White(), scene);
  mat.diffuseTexture = texture;
  mat.emissiveColor = new Color3(0.08, 0.06, 0.03);
  wallSign(`tap-name-${index}`, 0.78, 0.18, new Vector3(x, HANDLE_Y + 0.5, 0.27), mat);
  tapNameTextures[index] = texture;
  const context = texture.getContext() as CanvasRenderingContext2D;
  context.fillStyle = "#efe1bd";
  context.font = "bold 25px Georgia";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(initialName.toUpperCase(), 160, 36);
  texture.update();
}

function updateTapLabels(): void {
  if (tapNameTextures.length < TAP_XS.length) return;
  const names = ["Sunset IPA", "House Lager", "Crisp Pils", "Midnight Stout", "Velvet Porter", "Last Call"];
  if (tickets[0]) names[TICKET_TAPS[0]] = tickets[0].order.name;
  if (tickets[1]) names[TICKET_TAPS[1]] = tickets[1].order.name;
  names.forEach((name, index) => {
    const texture = tapNameTextures[index];
    const context = texture.getContext() as CanvasRenderingContext2D;
    context.clearRect(0, 0, 320, 72);
    context.fillStyle = "#efe1bd";
    context.font = "bold 25px Georgia";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(name.toUpperCase(), 160, 36);
    texture.update();
  });
}

function makeBottle(index: number, x: number, y: number, z: number, color: Color3, label: StandardMaterial, cap: StandardMaterial): void {
  const bottleMaterial = material(`bottle-glass-${index}`, color, scene);
  bottleMaterial.specularColor = new Color3(0.65, 0.65, 0.55);
  bottleMaterial.specularPower = 90;
  const shape = [new Vector3(0, 0, 0), new Vector3(0.12, 0, 0), new Vector3(0.13, 0.04, 0), new Vector3(0.13, 0.39, 0), new Vector3(0.12, 0.43, 0), new Vector3(0.057, 0.52, 0), new Vector3(0.057, 0.72, 0), new Vector3(0, 0.72, 0)];
  const bottle = MeshBuilder.CreateLathe(`bottle-${index}`, { shape, tessellation: 16 }, scene);
  bottle.position = new Vector3(x, y, z);
  bottle.scaling.y = 0.84 + (index % 3) * 0.09;
  bottle.material = bottleMaterial;
  const band = cylinder(`paper-label-${index}`, 0.21, 0.265, new Vector3(x, y + 0.25 * bottle.scaling.y, z), label);
  band.rotation.y = (index % 4) * 0.27;
  cylinder(`bottle-cap-${index}`, 0.055, 0.125, new Vector3(x, y + 0.72 * bottle.scaling.y, z), cap);
}

function makeScene(): void {
  scene = new Scene(engine);
  scene.clearColor = new Color4(0.035, 0.043, 0.035, 1);
  scene.ambientColor = new Color3(0.1, 0.08, 0.065);
  const camera = new ArcRotateCamera("camera", 1.43, 1.26, 8.5, new Vector3(0, 2.55, -0.15), scene);
  camera.fov = 0.78;
  camera.inputs.clear();
  // Keep the work station visible above the touch controls on portrait screens.
  const frameRoom = (): void => {
    const portrait = engine.getRenderWidth() / engine.getRenderHeight() < 0.9;
    camera.radius = portrait ? 8.2 : 8.5;
    camera.fov = portrait ? 1.04 : 0.78;
    camera.target.x = portrait ? GLASS_X - 0.22 : 0;
    camera.target.y = portrait ? 2.45 : 2.55;
  };
  frameRoom();
  engine.onResizeObservable.add(frameRoom);

  const ambient = new HemisphericLight("warm-ambient", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.55;
  ambient.diffuse = new Color3(1, 0.87, 0.7);
  ambient.groundColor = new Color3(0.19, 0.14, 0.1);
  const key = new DirectionalLight("window-and-practical-fill", new Vector3(-0.5, -1, -0.7), scene);
  key.position = new Vector3(2.5, 7, 4);
  key.intensity = 1.15;
  key.diffuse = new Color3(1, 0.83, 0.61);
  const shadow = new ShadowGenerator(1024, key);
  shadow.usePercentageCloserFiltering = true;
  shadow.bias = 0.002;
  shadow.normalBias = 0.025;
  shadow.setDarkness(0.3);
  const counterLight = new PointLight("pint-highlight", new Vector3(1.5, 4.5, 2), scene);
  counterLight.diffuse = new Color3(1, 0.91, 0.73);
  counterLight.intensity = 0.8;
  counterLight.range = 8;
  const shelfLight = new PointLight("back-bar-practical", new Vector3(-1, 4.3, -1.7), scene);
  shelfLight.diffuse = new Color3(1, 0.73, 0.4);
  shelfLight.intensity = 0.75;
  shelfLight.range = 6;

  let seed = 42;
  const random = (): number => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const woodMat = textureMaterial("oiled-walnut", 1024, 512, (ctx) => {
    ctx.fillStyle = "#764726"; ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 950; i++) {
      const y = random() * 512;
      ctx.strokeStyle = random() > 0.4 ? `rgba(35,17,8,${0.03 + random() * 0.16})` : `rgba(220,158,88,${random() * 0.13})`;
      ctx.lineWidth = 0.4 + random() * 2.3;
      ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(270, y + random() * 12, 600, y - random() * 16, 1024, y + random() * 5); ctx.stroke();
    }
    for (let y = 128; y < 512; y += 128) { ctx.fillStyle = "rgba(24,12,5,.45)"; ctx.fillRect(0, y, 1024, 2); }
  });
  woodMat.specularColor = new Color3(0.38, 0.27, 0.17);
  woodMat.specularPower = 75;
  const brickMat = textureMaterial("aged-red-brick", 1024, 512, (ctx) => {
    ctx.fillStyle = "#595048"; ctx.fillRect(0, 0, 1024, 512);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 9; col++) {
      const tone = Math.floor(random() * 22);
      ctx.fillStyle = `rgb(${105 + tone},${65 + tone},${48 + tone})`;
      ctx.fillRect(col * 128 + (row % 2) * 64 + 3, row * 64 + 3, 122, 58);
      ctx.fillStyle = "rgba(236,177,126,.1)"; ctx.fillRect(col * 128 + (row % 2) * 64 + 4, row * 64 + 4, 120, 2);
    }
  });
  brickMat.specularColor = Color3.Black();
  const floorMat = textureMaterial("small-floor-tiles", 512, 512, (ctx) => {
    ctx.fillStyle = "#222c27"; ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#343c35" : "#727365";
      ctx.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
    }
  });
  const floorTexture = floorMat.diffuseTexture as DynamicTexture;
  floorTexture.uScale = 4; floorTexture.vScale = 4;
  const greenMat = material("bottle-green-wainscot", new Color3(0.075, 0.16, 0.13), scene);
  const darkWood = material("ebony-shelf-frames", new Color3(0.095, 0.065, 0.044), scene);
  const brassMat = material("aged-brass", new Color3(0.64, 0.43, 0.19), scene);
  brassMat.specularColor = new Color3(0.85, 0.7, 0.4); brassMat.specularPower = 85;
  const chromeMat = material("polished-stainless", new Color3(0.49, 0.53, 0.52), scene);
  chromeMat.specularColor = new Color3(0.95, 0.95, 0.87); chromeMat.specularPower = 120;
  const blackMat = material("rubber-and-iron", new Color3(0.025, 0.035, 0.03), scene);
  const leatherMat = material("oxblood-leather", new Color3(0.23, 0.065, 0.042), scene);
  const warmBulb = material("warm-filament", new Color3(1, 0.8, 0.4), scene, new Color3(1, 0.67, 0.25));
  const creamMat = material("ivory-ceramic", new Color3(0.9, 0.85, 0.71), scene);
  const floor = MeshBuilder.CreateGround("tiled-floor", { width: 18, height: 18 }, scene);
  floor.material = floorMat;
  box("back-wall", { width: 12, height: 6, depth: 0.22 }, new Vector3(0, 3, -3.15), brickMat);
  box("left-wall", { width: 0.2, height: 6, depth: 10 }, new Vector3(-6, 3, 1.8), greenMat);
  box("right-wall", { width: 0.2, height: 6, depth: 10 }, new Vector3(6, 3, 1.8), greenMat);
  box("back-wainscot", { width: 12, height: 1.3, depth: 0.15 }, new Vector3(0, 0.68, -2.99), greenMat);
  box("back-chair-rail", { width: 12, height: 0.065, depth: 0.22 }, new Vector3(0, 1.36, -2.97), woodMat);
  box("backbar-cabinet", { width: 10, height: 1.4, depth: 0.64 }, new Vector3(0, 0.7, -2.55), greenMat);
  box("backbar-worktop", { width: 10.2, height: 0.12, depth: 0.82 }, new Vector3(0, 1.46, -2.47), woodMat);
  for (let x = -4.2; x < 5; x += 1.4) {
    box(`cabinet-door-${x}`, { width: 1.22, height: 1.11, depth: 0.03 }, new Vector3(x, 0.71, -2.21), darkWood);
    box(`cabinet-inset-${x}`, { width: 1.1, height: 0.97, depth: 0.04 }, new Vector3(x, 0.71, -2.18), greenMat);
    cylinder(`cabinet-pull-${x}`, 0.13, 0.035, new Vector3(x + 0.44, 0.78, -2.13), brassMat);
  }

  // Deep green panelled bar, a thick walnut slab, and a continuous brass foot rail.
  box("bar-case", { width: 10.4, height: 1.34, depth: 1.24 }, new Vector3(0, 0.77, 0.15), greenMat);
  box("counter-walnut-slab", { width: 10.9, height: 0.18, depth: 2.0 }, new Vector3(0, 1.45, 0.25), woodMat);
  box("counter-front-lip", { width: 10.92, height: 0.095, depth: 0.075 }, new Vector3(0, 1.41, 1.28), darkWood);
  box("bar-plinth", { width: 10.45, height: 0.16, depth: 1.31 }, new Vector3(0, 0.14, 0.18), darkWood);
  for (let x = -4.5; x <= 4.5; x += 1.5) {
    box(`bar-panel-frame-${x}`, { width: 1.34, height: 0.98, depth: 0.04 }, new Vector3(x, 0.76, 0.79), woodMat);
    box(`bar-panel-inset-${x}`, { width: 1.2, height: 0.83, depth: 0.05 }, new Vector3(x, 0.76, 0.81), greenMat);
    pipe(`footrail-bracket-${x}`, [new Vector3(x, 0.38, 0.83), new Vector3(x, 0.24, 1.25)], 0.035, brassMat);
  }
  pipe("brass-footrail", [new Vector3(-5.1, 0.24, 1.25), new Vector3(5.1, 0.24, 1.25)], 0.045, brassMat);

  const labelMats = ["HOUSE", "BOTANIC", "RESERVE"].map((word, index) => textureMaterial(`bottle-paper-${index}`, 256, 128, (ctx) => {
    ctx.fillStyle = ["#e9d9ac", "#bfc7a0", "#cf9970"][index]; ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = "#57442e"; ctx.lineWidth = 3; ctx.strokeRect(6, 6, 244, 116);
    ctx.fillStyle = "#403d29"; ctx.textAlign = "center"; ctx.font = "bold 22px Georgia"; ctx.fillText(word, 128, 59);
    ctx.font = "12px Georgia"; ctx.fillText("SMALL BATCH · NO. 42", 128, 88);
  }));
  const bottleColors = [new Color3(0.085, 0.2, 0.105), new Color3(0.24, 0.095, 0.028), new Color3(0.14, 0.2, 0.18), new Color3(0.3, 0.13, 0.04)];
  for (let side = -1; side <= 1; side += 2) {
    const center = side * 2.8;
    box(`shelf-recess-${side}`, { width: 3.8, height: 2.65, depth: 0.15 }, new Vector3(center, 2.99, -2.98), darkWood);
    for (let row = 0; row < 3; row++) {
      const y = 1.69 + row * 0.89;
      box(`shelf-${side}-${row}`, { width: 3.8, height: 0.09, depth: 0.58 }, new Vector3(center, y, -2.61), woodMat);
      box(`shelf-warm-strip-${side}-${row}`, { width: 3.5, height: 0.015, depth: 0.018 }, new Vector3(center, y - 0.052, -2.36), warmBulb);
      for (let i = 0; i < 9; i++) {
        const index = (side + 1) * 30 + row * 9 + i;
        makeBottle(index, center - 1.56 + i * 0.38, y + 0.047, -2.62, bottleColors[index % 4], labelMats[index % 3], brassMat);
      }
    }
    for (const dx of [-1.93, 1.93]) box(`shelf-upright-${side}-${dx}`, { width: 0.1, height: 2.75, depth: 0.63 }, new Vector3(center + dx, 2.98, -2.64), woodMat);
  }

  const mainSign = textureMaterial("painted-taproom-sign", 1024, 320, (ctx) => {
    ctx.fillStyle = "#172f28"; ctx.fillRect(0, 0, 1024, 320);
    ctx.strokeStyle = "#bc965e"; ctx.lineWidth = 5; ctx.strokeRect(16, 16, 992, 288);
    ctx.strokeRect(25, 25, 974, 270);
    ctx.textAlign = "center"; ctx.fillStyle = "#e9d5ac";
    ctx.font = "bold 108px Georgia"; ctx.fillText("THE LAST DROP", 512, 164);
    ctx.font = "28px Georgia"; ctx.fillText("NEIGHBORHOOD TAPROOM  •  EST. 2026", 512, 236);
  });
  box("sign-walnut-frame", { width: 7.2, height: 1.17, depth: 0.12 }, new Vector3(0, 4.75, -2.98), woodMat);
  wallSign("taproom-lettering", 7.03, 1.02, new Vector3(0, 4.75, -2.9), mainSign);
  const menuMat = textureMaterial("handwritten-draft-list", 512, 1024, (ctx) => {
    ctx.fillStyle = "#162420"; ctx.fillRect(0, 0, 512, 1024);
    ctx.textAlign = "center"; ctx.fillStyle = "#eee2c4"; ctx.font = "bold 56px Georgia";
    ctx.fillText("ON DRAFT", 256, 112);
    ctx.strokeStyle = "#bbaa7e"; ctx.beginPath(); ctx.moveTo(58, 142); ctx.lineTo(454, 142); ctx.stroke();
    ctx.font = "italic 31px Georgia";
    ["House Lager", "Sunset IPA", "Midnight Stout", "Crisp Pils", "Velvet Porter"].forEach((word, i) => {
      ctx.fillText(word, 256, 225 + i * 128); ctx.font = "20px Georgia"; ctx.fillStyle = "#bbae8e";
      ctx.fillText(["CRISP • GOLDEN", "CITRUS • HOPPY", "ROASTED • SMOOTH", "BRIGHT • CLEAN", "RICH • VELVETY"][i], 256, 260 + i * 128);
      ctx.font = "italic 31px Georgia"; ctx.fillStyle = "#eee2c4";
    });
    ctx.font = "24px Georgia"; ctx.fillText("GOOD BEER. GOOD COMPANY.", 256, 942);
  });
  box("chalkboard-frame", { width: 1.65, height: 2.66, depth: 0.12 }, new Vector3(0, 2.94, -2.84), woodMat);
  wallSign("chalkboard-menu", 1.49, 2.49, new Vector3(0, 2.94, -2.765), menuMat);

  // Pendant shades, visible bulbs, and their cords make the lighting feel situated.
  for (const x of [-3.65, 3.7]) {
    cylinder(`pendant-cord-${x}`, 0.88, 0.024, new Vector3(x, 5.34, 0.2), blackMat);
    const shade = MeshBuilder.CreateCylinder(`pendant-brass-shade-${x}`, { height: 0.33, diameterTop: 0.18, diameterBottom: 0.92, tessellation: 32 }, scene);
    shade.position = new Vector3(x, 4.75, 0.2); shade.material = brassMat;
    cylinder(`pendant-diffuser-${x}`, 0.018, 0.75, new Vector3(x, 4.575, 0.2), warmBulb);
  }

  // Two stools in the foreground provide a recognizable customer side of the bar.
  for (const x of [-3.65, 3.75]) {
    cylinder(`stool-seat-${x}`, 0.15, 0.86, new Vector3(x, 1.01, 2.05), leatherMat);
    cylinder(`stool-seat-piping-${x}`, 0.025, 0.88, new Vector3(x, 0.95, 2.05), brassMat);
    cylinder(`stool-pedestal-${x}`, 0.8, 0.075, new Vector3(x, 0.49, 2.05), blackMat);
    cylinder(`stool-foot-${x}`, 0.08, 0.62, new Vector3(x, 0.05, 2.05), blackMat);
    const ring = MeshBuilder.CreateTorus(`stool-footrest-${x}`, { diameter: 0.58, thickness: 0.04, tessellation: 24 }, scene);
    ring.position = new Vector3(x, 0.37, 2.05); ring.material = brassMat;
    pipe(`stool-back-frame-${x}`, [new Vector3(x - 0.35, 0.99, 2.29), new Vector3(x - 0.35, 1.6, 2.29), new Vector3(x + 0.35, 1.6, 2.29), new Vector3(x + 0.35, 0.99, 2.29)], 0.028, brassMat);
    box(`stool-back-cushion-${x}`, { width: 0.7, height: 0.26, depth: 0.1 }, new Vector3(x, 1.45, 2.29), leatherMat);
  }

  // A six-faucet bridge tower leaves a wide lane between the two rush-hour pints.
  for (const x of [-2.7, 2.7]) {
    cylinder(`tap-mount-${x}`, 0.045, 0.4, new Vector3(x, 1.56, -0.02), brassMat);
    cylinder(`tap-upright-${x}`, 1.98, 0.2, new Vector3(x, 2.57, -0.02), chromeMat);
  }
  pipe("tap-tower-crossbar", [new Vector3(-2.7, 3.54, -0.02), new Vector3(2.7, 3.54, -0.02)], 0.16, chromeMat);
  const handleMats = [greenMat, woodMat, leatherMat, blackMat, brassMat, chromeMat];
  const tapNames = ["Sunset IPA", "House Lager", "Crisp Pils", "Midnight Stout", "Velvet Porter", "Last Call"];
  for (let i = 0; i < TAP_XS.length; i++) {
    const x = TAP_XS[i];
    pipe(`faucet-${i}`, [new Vector3(x, 3.54, -0.02), new Vector3(x, 3.54, 0.36), new Vector3(x, 3.5, 0.57), new Vector3(x, SPOUT_Y, GLASS_Z)], 0.059, chromeMat);
    cylinder(`handle-stem-${i}`, 0.17, 0.045, new Vector3(x, 3.62, 0.22), brassMat);
    const handle = cylinder(`tap-handle-${i}`, 0.36, 0.12, new Vector3(x, HANDLE_Y, 0.22), handleMats[i]);
    tapHandles.push(handle);
    const badge = textureMaterial(`tap-badge-${i}`, 128, 128, (ctx) => {
      ctx.fillStyle = "#eee0bd"; ctx.fillRect(0, 0, 128, 128); ctx.fillStyle = "#254239";
      ctx.textAlign = "center"; ctx.font = "bold 44px Georgia"; ctx.fillText(String(i + 1).padStart(2, "0"), 64, 72);
      ctx.font = "14px Georgia"; ctx.fillText("DRAFT", 64, 97);
    });
    const badgeMesh = wallSign(`tap-number-${i}`, 0.11, 0.13, new Vector3(x, HANDLE_Y + 0.015, 0.283), badge);
    makeTapLabel(i, x, tapNames[i]);
    if (i === TICKET_TAPS[0]) badgeMesh.setParent(handle);
  }
  box("stainless-drip-tray", { width: 3.55, height: 0.035, depth: 0.87 }, new Vector3(0.76, 1.555, 0.46), chromeMat);
  for (let i = 0; i < 35; i++) box(`drip-tray-slot-${i}`, { width: 0.024, height: 0.005, depth: 0.69 }, new Vector3(-0.88 + i * 0.096, 1.575, 0.46), blackMat);

  const primaryPint = createPintGlass("primary", GLASS_X, GLASS_Z, GLASS_BASE_Y, orders[0].color);
  beer = primaryPint.beer;
  foam = primaryPint.foam;
  rim = primaryPint.rim;
  const secondaryPint = createPintGlass("secondary", SECOND_GLASS_X, GLASS_Z, GLASS_BASE_Y, orders[1].color);
  secondGlass = secondaryPint.glass;
  secondBeer = secondaryPint.beer;
  secondFoam = secondaryPint.foam;
  setSecondaryPintVisible(false);
  stream = MeshBuilder.CreateCylinder("pour-stream", { height: 1, diameter: 0.064, tessellation: 12 }, scene);
  stream.position = new Vector3(GLASS_X, SPOUT_Y - 0.5, GLASS_Z);
  stream.material = beer.material;
  stream.isVisible = false;
  streamTip = MeshBuilder.CreateSphere("stream-tip", { diameter: 0.13, segments: 12 }, scene);
  streamTip.position = new Vector3(GLASS_X, GLASS_BASE_Y + 0.08, GLASS_Z);
  streamTip.scaling.y = 0.25;
  streamTip.material = foam.material;
  streamTip.isVisible = false;
  secondStream = MeshBuilder.CreateCylinder("second-pour-stream", { height: 1, diameter: 0.064, tessellation: 12 }, scene);
  secondStream.position = new Vector3(SECOND_GLASS_X, SPOUT_Y - 0.5, GLASS_Z);
  secondStream.material = secondBeer.material;
  secondStream.isVisible = false;
  secondStreamTip = MeshBuilder.CreateSphere("second-stream-tip", { diameter: 0.13, segments: 12 }, scene);
  secondStreamTip.position = new Vector3(SECOND_GLASS_X, GLASS_BASE_Y + 0.08, GLASS_Z);
  secondStreamTip.scaling.y = 0.25;
  secondStreamTip.material = secondFoam.material;
  secondStreamTip.isVisible = false;
  const bubbleMat = material("carbonation", new Color3(1, 0.91, 0.65), scene, new Color3(0.12, 0.09, 0.035), 0.55);
  for (let i = 0; i < 18; i++) {
    const bubble = MeshBuilder.CreateSphere(`bubble-${i}`, { diameter: 0.016 + (i % 3) * 0.006, segments: 6 }, scene);
    bubble.position = new Vector3(GLASS_X - 0.3 + (i % 6) * 0.12, GLASS_BASE_Y + 0.15, GLASS_Z + 0.31);
    bubble.material = bubbleMat; bubble.isVisible = false; bubbles.push(bubble);
  }

  // Water glasses, coasters, a bar towel and a small plant soften the work surface.
  const glassEdge = material("bar-glass-edge", new Color3(0.73, 0.84, 0.82), scene, new Color3(0.12, 0.15, 0.14), 0.46);
  for (let i = 0; i < 5; i++) {
    const tumbler = MeshBuilder.CreateLathe(`backbar-water-glass-${i}`, { shape: [new Vector3(0, 0, 0), new Vector3(0.11, 0, 0), new Vector3(0.135, 0.31, 0), new Vector3(0.12, 0.31, 0), new Vector3(0.095, 0.03, 0), new Vector3(0, 0.03, 0)], tessellation: 16 }, scene);
    tumbler.position = new Vector3(1.5 + i * 0.3, 1.525, -2.32); tumbler.material = glassEdge;
  }
  cylinder("ceramic-coaster", 0.025, 0.66, new Vector3(-2.3, 1.556, 0.77), creamMat);
  box("folded-bar-towel", { width: 0.57, height: 0.035, depth: 0.38 }, new Vector3(3.1, 1.57, 0.59), creamMat).rotation.y = -0.18;
  for (let i = 0; i < 3; i++) box(`towel-stripe-${i}`, { width: 0.035, height: 0.002, depth: 0.36 }, new Vector3(2.99 + i * 0.06, 1.59, 0.59), greenMat).rotation.y = -0.18;
  cylinder("terracotta-plant-pot", 0.28, 0.34, new Vector3(4.22, 1.67, -2.39), leatherMat);
  for (let i = 0; i < 7; i++) {
    const leaf = MeshBuilder.CreateSphere(`plant-leaf-${i}`, { diameter: 0.25, segments: 8 }, scene);
    leaf.scaling = new Vector3(0.35, 1.8, 0.7); leaf.rotation.z = (i - 3) * 0.25;
    leaf.position = new Vector3(4.22 + Math.sin(i * 2) * 0.12, 1.99 + Math.cos(i) * 0.1, -2.39 + Math.cos(i * 2) * 0.1); leaf.material = greenMat;
  }
  for (const mesh of scene.meshes) {
    mesh.receiveShadows = true;
    if (mesh.material?.alpha === 1 && mesh !== beer && mesh !== foam && mesh !== stream && mesh !== streamTip && mesh.material !== warmBulb) shadow.addShadowCaster(mesh);
  }
  glow = new GlowLayer("practical-light-bloom", scene, { blurKernelSize: 24 });
  glow.intensity = 0.17;
  for (const mesh of scene.meshes) if (mesh instanceof Mesh && mesh.material !== warmBulb) glow.addExcludedMesh(mesh);
  loadingStatus.textContent = "Taproom ready";
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.035): void {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.03, audioContext.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function unlockAudio(): void {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
}

function currentTicket(): BeerTicket { return tickets[activeTicket]; }
function currentOrder(): Order { return currentTicket().order; }

function setupTickets(): void {
  tickets = [{ order: orders[activeOrder], fill: 0, foam: 0, served: false }];
  if (isRushRound()) {
    tickets.push({ order: orders[(activeOrder + 1) % orders.length], fill: 0, foam: 0, served: false });
  }
  activeTicket = 0;
  pouringTickets[0] = false;
  pouringTickets[1] = false;
  if (stream) stream.isVisible = false;
  if (streamTip) streamTip.isVisible = false;
  if (secondStream) secondStream.isVisible = false;
  if (secondStreamTip) secondStreamTip.isVisible = false;
  for (const handle of tapHandles) handle.rotation.z = 0;
  setSecondaryPintVisible(isRushRound());
  updateTapLabels();
}

function saveActiveTicket(): void {
  const ticket = tickets[activeTicket];
  if (!ticket) return;
  ticket.fill = fill;
  ticket.foam = foamAmount;
}

function loadActiveTicket(): void {
  const ticket = currentTicket();
  fill = ticket.fill;
  foamAmount = ticket.foam;
  judging = false;
  roundTime = 0;
  lastPourTone = 0;
  setOrderColor();
  updateHud();
  liveStatus.textContent = isRushRound() ? `Pint ${activeTicket + 1} of 2 is on the rail. Hold both buttons—or A/D—to pour together.` : "Dial in your flow, then hold the pour.";
  const activeButton = activeTicket === 1 ? secondaryPourButton : isRushRound() ? primaryPourButton : pourButton;
  activeButton.classList.remove("is-pouring");
}

function updateHud(): void {
  const order = currentOrder();
  scoreValue.textContent = score.toLocaleString();
  streakValue.textContent = String(streak);
  livesValue.textContent = `${"●".repeat(lives)}${"○".repeat(Math.max(0, 3 - lives))}`;
  roundValue.textContent = String(activeOrder + 1).padStart(2, "0");
  roundSuffix.textContent = isRushRound() ? `· Pint ${activeTicket + 1} / 2` : "/ 06";
  orderName.textContent = order.name;
  tipValue.textContent = order.tip;
  fillTarget.textContent = percent(order.targetFill);
  foamTarget.textContent = percent(order.targetFoam);
  orderHint.textContent = order.hint;
  fillMeter.style.width = `${clamp(fill, 0, 1) * 100}%`;
  foamMeter.style.width = `${clamp(foamAmount / 0.3, 0, 1) * 100}%`;
  fillMarker.style.left = `${order.targetFill * 100}%`;
  foamMarker.style.left = `${clamp(order.targetFoam / 0.3, 0, 1) * 100}%`;
  flowValue.textContent = `${Math.round(flow * 100)}%`;
  rushPanel.hidden = !isRushRound();
  if (isRushRound()) {
    const other = tickets[activeTicket === 0 ? 1 : 0];
    rushName.textContent = other.order.name;
    rushStatus.textContent = other.served ? "Served" : activeTicket === 0 ? "Waiting at the rail" : "Waiting for your pour";
    switchButton.textContent = activeTicket === 0 ? "Switch pint" : "Back to first";
    switchButton.disabled = judging || other.served;
  }
  serveButton.disabled = fill < 0.32 || judging || currentTicket().served;
  singleActionControls.hidden = isRushRound();
  dualActionControls.hidden = !isRushRound();
  primaryPourLabel.textContent = tickets[0]?.order.name ?? "First pint";
  secondaryPourLabel.textContent = tickets[1]?.order.name ?? "Second pint";
}

function updatePintReadouts(): void {
  const active = shiftStarted && resultPanel.hidden && endPanel.hidden;
  const cssRect = canvas.getBoundingClientRect();
  const renderWidth = engine.getRenderWidth();
  const renderHeight = engine.getRenderHeight();
  const scaleX = cssRect.width / renderWidth;
  const scaleY = cssRect.height / renderHeight;
  const camera = scene.activeCamera as ArcRotateCamera;
  const projectReadout = (element: HTMLElement, x: number, y: number): void => {
    const projected = Vector3.Project(new Vector3(x, y, GLASS_Z + 0.12), Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(renderWidth, renderHeight));
    element.style.left = `${cssRect.left + projected.x * scaleX}px`;
    element.style.top = `${cssRect.top + projected.y * scaleY}px`;
  };
  const updateReadout = (element: HTMLElement, nameElement: HTMLElement, fillElement: HTMLElement, foamElement: HTMLElement, fillBar: HTMLElement, foamBar: HTMLElement, ticket: BeerTicket | undefined, x: number): void => {
    const visible = active && Boolean(ticket) && !ticket?.served;
    element.hidden = !visible;
    if (!visible || !ticket) return;
    nameElement.textContent = ticket.order.name;
    fillElement.textContent = percent(ticket.fill);
    foamElement.textContent = percent(ticket.foam / 0.3);
    fillBar.style.width = `${clamp(ticket.fill, 0, 1) * 100}%`;
    foamBar.style.width = `${clamp(ticket.foam / 0.3, 0, 1) * 100}%`;
    projectReadout(element, x - 0.62, GLASS_BASE_Y + 0.7);
  };
  updateReadout(primaryPintReadout, primaryReadoutName, primaryReadoutFill, primaryReadoutFoam, primaryReadoutFillBar, primaryReadoutFoamBar, tickets[0], GLASS_X);
  updateReadout(secondaryPintReadout, secondaryReadoutName, secondaryReadoutFill, secondaryReadoutFoam, secondaryReadoutFillBar, secondaryReadoutFoamBar, tickets[1], SECOND_GLASS_X);
}

function setOrderColor(): void {
  const primaryOrder = tickets[0]?.order ?? orders[activeOrder];
  const secondaryOrder = tickets[1]?.order ?? orders[(activeOrder + 1) % orders.length];
  const primaryMaterial = beer.material as StandardMaterial;
  const secondaryMaterial = secondBeer.material as StandardMaterial;
  primaryMaterial.diffuseColor = primaryOrder.color;
  primaryMaterial.emissiveColor = primaryOrder.color.scale(0.09);
  secondaryMaterial.diffuseColor = secondaryOrder.color;
  secondaryMaterial.emissiveColor = secondaryOrder.color.scale(0.09);
}

function resetOrder(): void {
  loadActiveTicket();
}

function startShift(): void {
  unlockAudio();
  playTone(220, 0.18, "triangle", 0.045);
  activeOrder = 0;
  score = 0;
  streak = 0;
  lives = 3;
  shiftStarted = true;
  startPanel.hidden = true;
  endPanel.hidden = true;
  resultPanel.hidden = true;
  orderPanel.hidden = false;
  controls.hidden = false;
  setupTickets();
  resetOrder();
}

function startPourFor(ticketIndex: number): void {
  const ticket = tickets[ticketIndex];
  if (!shiftStarted || judging || !ticket || ticket.served || ticket.fill >= 1.05) return;
  saveActiveTicket();
  activeTicket = ticketIndex;
  fill = ticket.fill;
  foamAmount = ticket.foam;
  unlockAudio();
  pouringTickets[ticketIndex] = true;
  const button = ticketIndex === 1 ? secondaryPourButton : isRushRound() ? primaryPourButton : pourButton;
  button.classList.add("is-pouring");
  const streamMesh = ticketIndex === 1 ? secondStream : stream;
  const tipMesh = ticketIndex === 1 ? secondStreamTip : streamTip;
  streamMesh.material = (ticketIndex === 1 ? secondBeer : beer).material;
  tipMesh.material = (ticketIndex === 1 ? secondFoam : foam).material;
  streamMesh.isVisible = true;
  tipMesh.isVisible = true;
  tapHandles[TICKET_TAPS[ticketIndex]].rotation.z = -0.38;
  liveStatus.textContent = isRushRound() ? `Pouring ${ticket.order.name}…` : "Keep the crown under control…";
}

function stopPourFor(ticketIndex: number): void {
  if (ticketIndex === activeTicket) saveActiveTicket();
  pouringTickets[ticketIndex] = false;
  const button = ticketIndex === 1 ? secondaryPourButton : isRushRound() ? primaryPourButton : pourButton;
  button.classList.remove("is-pouring");
  const streamMesh = ticketIndex === 1 ? secondStream : stream;
  const tipMesh = ticketIndex === 1 ? secondStreamTip : streamTip;
  streamMesh.isVisible = false;
  tipMesh.isVisible = false;
  tapHandles[TICKET_TAPS[ticketIndex]].rotation.z = 0;
  if (ticketIndex === activeTicket && !judging && fill >= 0.32) liveStatus.textContent = "Looks close. Serve it—or risk a better pour.";
}

function stopAllPouring(): void {
  for (let i = 0; i < tickets.length; i++) {
    if (pouringTickets[i]) stopPourFor(i);
  }
  pouringTickets[0] = false;
  pouringTickets[1] = false;
  stream.isVisible = false;
  streamTip.isVisible = false;
  secondStream.isVisible = false;
  secondStreamTip.isVisible = false;
  if (!judging && fill >= 0.32) liveStatus.textContent = "Looks close. Serve it—or risk a better pour.";
}

function switchTicket(): void {
  if (!isRushRound() || judging || tickets.length < 2) return;
  stopPourFor(activeTicket);
  saveActiveTicket();
  activeTicket = activeTicket === 0 ? 1 : 0;
  loadActiveTicket();
}

function judgeOrder(): void {
  if (!shiftStarted || judging || currentTicket().served || fill < 0.32) return;
  stopAllPouring();
  judging = true;
  const order = currentOrder();
  const fillError = Math.abs(fill - order.targetFill);
  const foamError = Math.abs(foamAmount - order.targetFoam);
  const fillQuality = clamp(1 - fillError / 0.19, 0, 1);
  const foamQuality = clamp(1 - foamError / 0.14, 0, 1);
  const quality = Math.round((fillQuality * 0.68 + foamQuality * 0.32) * 100);
  const perfect = fillError < 0.045 && foamError < 0.045;
  const passed = quality >= 55 && fill <= 1.05;
  let points = 0;
  if (passed) {
    streak += 1;
    points = Math.round((420 + quality * 7 + Math.max(0, 14 - roundTime) * 18) * (1 + Math.min(streak, 5) * 0.12));
    score += points;
    playTone(perfect ? 660 : 460, perfect ? 0.38 : 0.2, "triangle", perfect ? 0.065 : 0.04);
    resultKicker.textContent = perfect ? "That is the one" : "Order judged";
    resultTitle.textContent = perfect ? "Perfect pour." : "Nice recovery.";
    resultCopy.textContent = perfect ? "The room goes quiet for half a second." : "A little wild, but still worth the tip.";
  } else {
    lives -= 1;
    streak = 0;
    points = 0;
    playTone(150, 0.28, "sawtooth", 0.03);
    resultKicker.textContent = "Order judged";
    resultTitle.textContent = fill > order.targetFill + 0.12 ? "That one got away." : "Not quite serviceable.";
    resultCopy.textContent = lives > 0 ? "The next customer is already waiting." : "The taproom has seen enough for tonight.";
  }
  resultQuality.textContent = `Quality ${quality}%`;
  resultPoints.textContent = points > 0 ? `+${points.toLocaleString()}` : "No tip";
  saveActiveTicket();
  currentTicket().served = true;
  nextButton.innerHTML = tickets.some((ticket) => !ticket.served) ? "Switch to next pint <span>→</span>" : "Next order <span>→</span>";
  updateHud();
  resultPanel.hidden = false;
  controls.hidden = true;
}

function nextOrder(): void {
  const pendingTicket = tickets.findIndex((ticket) => !ticket.served);
  if (pendingTicket >= 0 && lives > 0) {
    activeTicket = pendingTicket;
    resultPanel.hidden = true;
    controls.hidden = false;
    loadActiveTicket();
    return;
  }
  if (activeOrder >= orders.length - 1 || lives <= 0) {
    finishShift();
    return;
  }
  activeOrder += 1;
  setupTickets();
  resultPanel.hidden = true;
  controls.hidden = false;
  resetOrder();
}

function finishShift(): void {
  shiftStarted = false;
  resultPanel.hidden = true;
  orderPanel.hidden = true;
  controls.hidden = true;
  endPanel.hidden = false;
  finalScore.textContent = score.toLocaleString();
  const previousBest = Number(localStorage.getItem("perfect-pour-best") ?? 0);
  const best = Math.max(previousBest, score);
  localStorage.setItem("perfect-pour-best", String(best));
  bestScore.textContent = `Best ${best.toLocaleString()}`;
  if (lives <= 0) {
    endTitle.textContent = "Last call.";
    endCopy.textContent = `You built a ${streak === 0 ? "memorable" : "brave"} shift before the taproom closed.`;
  } else {
    endTitle.textContent = "The house remembers.";
    endCopy.textContent = `Six orders, ${lives} ${lives === 1 ? "life" : "lives"} left, and a score worth chasing.`;
  }
}

function updateLiquidMesh(liquid: Mesh, head: Mesh, liquidFill: number, headFoam: number, x: number): void {
  const beerHeight = 1.45 * clamp(liquidFill, 0.001, 1);
  liquid.scaling.y = clamp(liquidFill, 0.001, 1.08);
  liquid.position.x = x;
  liquid.position.y = GLASS_BASE_Y + 0.075 + beerHeight / 2;
  const foamHeight = 0.12 * clamp(headFoam / 0.19, 0.18, 1.35);
  head.scaling.y = foamHeight / 0.12;
  head.position.x = x;
  head.position.y = GLASS_BASE_Y + 0.075 + beerHeight + foamHeight / 2;
}

function updatePourStream(streamMesh: Mesh, tipMesh: Mesh, liquid: Mesh, ticket: BeerTicket | undefined, x: number, timeSeconds: number): void {
  const streamFill = ticket?.fill ?? 0;
  const streamFoam = ticket?.foam ?? 0;
  const beerHeight = 1.45 * clamp(streamFill, 0.001, 1);
  const foamHeight = 0.12 * clamp(streamFoam / 0.19, 0.18, 1.35);
  const liquidSurface = GLASS_BASE_Y + 0.075 + beerHeight + foamHeight;
  streamMesh.position.x = x;
  streamMesh.scaling.y = Math.max(0.08, SPOUT_Y - liquidSurface);
  streamMesh.scaling.x = 0.65 + flow * 0.7;
  streamMesh.scaling.z = streamMesh.scaling.x;
  streamMesh.position.y = (SPOUT_Y + liquidSurface) / 2;
  tipMesh.position.x = x;
  tipMesh.position.y = liquidSurface + Math.sin(timeSeconds * 16) * 0.009;
  streamMesh.material = liquid.material;
}

function updateScene(deltaSeconds: number, timeSeconds: number): void {
  if (!scene) return;
  if (shiftStarted && !judging) {
    roundTime += deltaSeconds;
    saveActiveTicket();
    const flowRate = 0.018 + flow * 0.115;
    tickets.forEach((ticket, index) => {
      if (ticket.served) return;
      if (pouringTickets[index]) {
        ticket.fill = clamp(ticket.fill + deltaSeconds * flowRate, 0, 1.12);
        ticket.foam = clamp(ticket.foam + deltaSeconds * (0.004 + flow * 0.023), 0, 0.34);
        if (ticket.fill >= 1.05) {
          ticket.fill = 1.05;
          stopPourFor(index);
          if (index === activeTicket) liveStatus.textContent = "Spill! Stop pouring.";
        }
      } else {
        ticket.foam = clamp(ticket.foam - deltaSeconds * 0.0022, 0, 0.34);
      }
    });
    const active = currentTicket();
    fill = active.fill;
    foamAmount = active.foam;
    if (timeSeconds - lastPourTone > 0.12 && pouringTickets.some(Boolean)) {
      playTone(80 + flow * 30, 0.045, "sine", 0.006);
      lastPourTone = timeSeconds;
    }
    if (roundTime > 22) {
      liveStatus.textContent = "The customer is tapping the bar.";
      judgeOrder();
    }
    saveActiveTicket();
    updateHud();
  }
  const primary = tickets[0];
  const secondary = tickets[1];
  updateLiquidMesh(beer, foam, primary?.fill ?? 0, primary?.foam ?? 0, GLASS_X);
  updateLiquidMesh(secondBeer, secondFoam, secondary?.fill ?? 0, secondary?.foam ?? 0, SECOND_GLASS_X);
  updatePourStream(stream, streamTip, beer, primary, GLASS_X, timeSeconds);
  updatePourStream(secondStream, secondStreamTip, secondBeer, secondary, SECOND_GLASS_X, timeSeconds);
  rim.rotation.y = Math.sin(timeSeconds * 0.25) * 0.012;
  for (let i = 0; i < bubbles.length; i++) {
    const bubble = bubbles[i];
    bubble.isVisible = activeTicket === 0 && fill > 0.08;
    bubble.position.y = GLASS_BASE_Y + 0.1 + ((timeSeconds * 0.12 + i * 0.063) % Math.max(0.01, 1.4 * Math.min(fill, 1)));
  }
}

async function start(): Promise<void> {
  engine = await EngineFactory.CreateAsync(canvas, { antialias: true, adaptToDeviceRatio: true });
  makeScene();
  let time = 0;
  engine.runRenderLoop(() => {
    const delta = Math.min(engine.getDeltaTime() * 0.001, 0.05);
    time += delta;
    updateScene(delta, time);
    scene.render();
    updatePintReadouts();
  });
  window.addEventListener("resize", () => engine.resize());

  startButton.addEventListener("click", startShift);
  nextButton.addEventListener("click", nextOrder);
  restartButton.addEventListener("click", startShift);
  flowRange.addEventListener("input", () => {
    flow = Number(flowRange.value) / 100;
    updateHud();
  });
  const bindPourButton = (button: HTMLButtonElement, ticketIndex: number): void => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      startPourFor(ticketIndex);
    });
    button.addEventListener("pointerup", () => stopPourFor(ticketIndex));
    button.addEventListener("pointercancel", () => stopPourFor(ticketIndex));
  };
  bindPourButton(pourButton, 0);
  bindPourButton(primaryPourButton, 0);
  bindPourButton(secondaryPourButton, 1);
  serveButton.addEventListener("click", judgeOrder);
  switchButton.addEventListener("click", switchTicket);
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" || event.code === "ArrowDown") {
      event.preventDefault();
      if (!event.repeat) startPourFor(0);
    }
    if (event.code === "KeyA") {
      event.preventDefault();
      if (!event.repeat) startPourFor(0);
    }
    if (event.code === "KeyD") {
      event.preventDefault();
      if (!event.repeat) startPourFor(1);
    }
    if ((event.code === "Enter" || event.code === "ArrowUp") && shiftStarted && !judging) {
      event.preventDefault();
      judgeOrder();
    }
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      event.preventDefault();
      const change = event.code === "ArrowLeft" ? -3 : 3;
      flowRange.value = String(clamp(Number(flowRange.value) + change, 18, 92));
      flow = Number(flowRange.value) / 100;
      updateHud();
    }
  });
  document.addEventListener("keyup", (event) => {
    if (event.code === "Space" || event.code === "ArrowDown" || event.code === "KeyA") stopPourFor(0);
    if (event.code === "KeyD") stopPourFor(1);
  });
}

start().catch((error: unknown) => {
  console.error(error);
  loadingStatus.textContent = "The taproom could not open in this browser.";
});
