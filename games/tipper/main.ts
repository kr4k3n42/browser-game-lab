import {
  ArcRotateCamera,
  Color3,
  Color4,
  EngineFactory,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
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

const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;
const loadingStatus = document.querySelector<HTMLDivElement>("#loading-status")!;
const startPanel = document.querySelector<HTMLElement>("#start-panel")!;
const orderPanel = document.querySelector<HTMLElement>("#order-panel")!;
const resultPanel = document.querySelector<HTMLElement>("#result-panel")!;
const endPanel = document.querySelector<HTMLElement>("#end-panel")!;
const controls = document.querySelector<HTMLElement>("#controls")!;
const startButton = document.querySelector<HTMLButtonElement>("#start-button")!;
const nextButton = document.querySelector<HTMLButtonElement>("#next-button")!;
const restartButton = document.querySelector<HTMLButtonElement>("#restart-button")!;
const pourButton = document.querySelector<HTMLButtonElement>("#pour-button")!;
const serveButton = document.querySelector<HTMLButtonElement>("#serve-button")!;
const flowRange = document.querySelector<HTMLInputElement>("#flow-range")!;
const flowValue = document.querySelector<HTMLElement>("#flow-value")!;
const liveStatus = document.querySelector<HTMLElement>("#live-status")!;
const scoreValue = document.querySelector<HTMLElement>("#score-value")!;
const streakValue = document.querySelector<HTMLElement>("#streak-value")!;
const livesValue = document.querySelector<HTMLElement>("#lives-value")!;
const roundValue = document.querySelector<HTMLElement>("#round-value")!;
const orderName = document.querySelector<HTMLElement>("#order-name")!;
const tipValue = document.querySelector<HTMLElement>("#tip-value")!;
const fillTarget = document.querySelector<HTMLElement>("#fill-target")!;
const foamTarget = document.querySelector<HTMLElement>("#foam-target")!;
const fillMeter = document.querySelector<HTMLElement>("#fill-meter")!;
const foamMeter = document.querySelector<HTMLElement>("#foam-meter")!;
const fillMarker = document.querySelector<HTMLElement>("#fill-marker")!;
const foamMarker = document.querySelector<HTMLElement>("#foam-marker")!;
const orderHint = document.querySelector<HTMLElement>("#order-hint")!;
const resultKicker = document.querySelector<HTMLElement>("#result-kicker")!;
const resultTitle = document.querySelector<HTMLElement>("#result-title")!;
const resultCopy = document.querySelector<HTMLElement>("#result-copy")!;
const resultQuality = document.querySelector<HTMLElement>("#result-quality")!;
const resultPoints = document.querySelector<HTMLElement>("#result-points")!;
const endTitle = document.querySelector<HTMLElement>("#end-title")!;
const endCopy = document.querySelector<HTMLElement>("#end-copy")!;
const finalScore = document.querySelector<HTMLElement>("#final-score")!;
const bestScore = document.querySelector<HTMLElement>("#best-score")!;

if (!canvas || !loadingStatus || !startPanel || !orderPanel || !resultPanel || !endPanel || !controls || !startButton || !nextButton || !restartButton || !pourButton || !serveButton || !flowRange || !flowValue || !liveStatus || !scoreValue || !streakValue || !livesValue || !roundValue || !orderName || !tipValue || !fillTarget || !foamTarget || !fillMeter || !foamMeter || !fillMarker || !foamMarker || !orderHint || !resultKicker || !resultTitle || !resultCopy || !resultQuality || !resultPoints || !endTitle || !endCopy || !finalScore || !bestScore) {
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
let stream: Mesh;
let streamTip: Mesh;
let tapHandle: Mesh;
let rim: Mesh;
let glow: GlowLayer;
let activeOrder = 0;
let score = 0;
let streak = 0;
let lives = 3;
let fill = 0;
let foamAmount = 0;
let flow = 0.52;
let pouring = false;
let shiftStarted = false;
let judging = false;
let roundTime = 0;
let lastPourTone = 0;
let audioContext: AudioContext | undefined;

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

function makeBottle(index: number, x: number, z: number, color: Color3): void {
  const bottleMaterial = material(`bottle-${index}`, color, scene, color.scale(0.17));
  const bottle = MeshBuilder.CreateCylinder(`bottle-${index}`, { height: 0.82, diameterTop: 0.18, diameterBottom: 0.42, tessellation: 12 }, scene);
  bottle.position = new Vector3(x, 1.75 + (index % 2) * 0.04, z);
  bottle.material = bottleMaterial;
  const neck = MeshBuilder.CreateCylinder(`bottle-neck-${index}`, { height: 0.28, diameter: 0.13, tessellation: 12 }, scene);
  neck.position = new Vector3(x, 2.28 + (index % 2) * 0.04, z);
  neck.material = bottleMaterial;
  const label = MeshBuilder.CreateTorus(`bottle-label-${index}`, { diameter: 0.28, thickness: 0.018, tessellation: 20 }, scene);
  label.rotation.x = Math.PI / 2;
  label.position = new Vector3(x, 1.72 + (index % 2) * 0.04, z - 0.01);
  label.material = material(`label-${index}`, new Color3(0.92, 0.67, 0.3), scene, new Color3(0.16, 0.06, 0.02));
}

function makeScene(): void {
  scene = new Scene(engine);
  scene.clearColor = new Color4(0.035, 0.018, 0.015, 1);

  const camera = new ArcRotateCamera("camera", 1.15, 1.12, 8.6, new Vector3(0, 1.55, 0), scene);
  camera.lowerRadiusLimit = 8.6;
  camera.upperRadiusLimit = 8.6;
  camera.inputs.clear();

  const ambient = new HemisphericLight("warm-ambient", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.72;
  ambient.diffuse = new Color3(1, 0.68, 0.48);
  ambient.groundColor = new Color3(0.07, 0.025, 0.02);

  const counterLight = new PointLight("counter-light", new Vector3(-1.2, 3.9, 1.4), scene);
  counterLight.diffuse = new Color3(1, 0.32, 0.12);
  counterLight.intensity = 14;
  counterLight.range = 8;
  const signLight = new PointLight("sign-light", new Vector3(1.8, 4.1, -0.5), scene);
  signLight.diffuse = new Color3(0.95, 0.2, 0.04);
  signLight.intensity = 16;
  signLight.range = 10;

  const floorMat = material("floor", new Color3(0.055, 0.023, 0.018), scene);
  const wallMat = material("wall", new Color3(0.075, 0.032, 0.027), scene);
  const woodMat = material("wood", new Color3(0.17, 0.065, 0.035), scene);
  const brassMat = material("brass", new Color3(0.52, 0.2, 0.06), scene, new Color3(0.17, 0.045, 0.012));
  const redGlow = material("red-glow", new Color3(0.55, 0.06, 0.015), scene, new Color3(1, 0.08, 0.02));
  const darkGlow = material("dark-glow", new Color3(0.08, 0.01, 0.04), scene, new Color3(0.5, 0.025, 0.08));
  floorMat.emissiveColor = new Color3(0.022, 0.006, 0.004);
  wallMat.emissiveColor = new Color3(0.035, 0.008, 0.006);
  woodMat.emissiveColor = new Color3(0.06, 0.012, 0.004);

  const floor = MeshBuilder.CreateGround("floor", { width: 20, height: 20 }, scene);
  floor.material = floorMat;
  box("back-wall", { width: 13, height: 6.5, depth: 0.28 }, new Vector3(0, 3.1, -2.7), wallMat);
  box("bar-front", { width: 9.5, height: 1.15, depth: 0.72 }, new Vector3(0, 0.78, 0.85), woodMat);
  box("bar-top", { width: 10, height: 0.2, depth: 1.25 }, new Vector3(0, 1.38, 0.55), brassMat);
  box("shelf-1", { width: 8.8, height: 0.12, depth: 0.46 }, new Vector3(0, 2.36, -2.23), woodMat);
  box("shelf-2", { width: 8.8, height: 0.12, depth: 0.46 }, new Vector3(0, 3.25, -2.23), woodMat);
  box("shelf-light", { width: 7.6, height: 0.035, depth: 0.06 }, new Vector3(0, 3.38, -1.98), redGlow);

  const sign = MeshBuilder.CreateTorus("neon-sign", { diameter: 2.7, thickness: 0.075, tessellation: 64 }, scene);
  sign.position = new Vector3(-2.8, 4.55, -2.48);
  sign.rotation.x = Math.PI / 2;
  sign.material = redGlow;
  const signCore = MeshBuilder.CreateTorus("neon-sign-core", { diameter: 1.9, thickness: 0.035, tessellation: 64 }, scene);
  signCore.position = sign.position.clone();
  signCore.rotation.x = Math.PI / 2;
  signCore.material = darkGlow;

  for (let i = 0; i < 10; i += 1) {
    const x = -3.7 + (i % 5) * 1.8;
    const z = -2.0 - Math.floor(i / 5) * 0.01;
    makeBottle(i, x, z, [new Color3(0.18, 0.5, 0.36), new Color3(0.54, 0.12, 0.08), new Color3(0.08, 0.24, 0.4), new Color3(0.6, 0.28, 0.06)][i % 4]);
  }

  const tapBody = box("tap-body", { width: 0.42, height: 1.35, depth: 0.42 }, new Vector3(1.65, 2.3, 0.12), brassMat);
  tapBody.rotation.z = -0.12;
  const tapHead = MeshBuilder.CreateCylinder("tap-head", { height: 0.78, diameter: 0.31, tessellation: 18 }, scene);
  tapHead.rotation.z = Math.PI / 2;
  tapHead.position = new Vector3(1.15, 3.03, 0.12);
  tapHead.material = brassMat;
  const nozzle = MeshBuilder.CreateCylinder("nozzle", { height: 0.48, diameter: 0.15, tessellation: 16 }, scene);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position = new Vector3(0.7, 3.03, 0.12);
  nozzle.material = brassMat;
  tapHandle = MeshBuilder.CreateCylinder("tap-handle", { height: 0.5, diameter: 0.12, tessellation: 16 }, scene);
  tapHandle.position = new Vector3(1.64, 3.58, 0.12);
  tapHandle.material = redGlow;

  const glassMat = material("glass", new Color3(0.52, 0.18, 0.08), scene, new Color3(0.18, 0.045, 0.02), 0.22);
  glassMat.backFaceCulling = false;
  const glass = MeshBuilder.CreateCylinder("glass", { height: 1.55, diameterTop: 1.05, diameterBottom: 0.82, tessellation: 32 }, scene);
  glass.position = new Vector3(0, 1.2, 0.18);
  glass.material = glassMat;
  rim = MeshBuilder.CreateTorus("glass-rim", { diameter: 1.05, thickness: 0.045, tessellation: 32 }, scene);
  rim.position = new Vector3(0, 1.975, 0.18);
  rim.material = brassMat;
  const glassBase = MeshBuilder.CreateTorus("glass-base", { diameter: 0.72, thickness: 0.045, tessellation: 32 }, scene);
  glassBase.position = new Vector3(0, 0.43, 0.18);
  glassBase.material = brassMat;

  const beerMaterial = material("beer", orders[0].color, scene, orders[0].color.scale(0.32), 0.94);
  beer = MeshBuilder.CreateCylinder("beer", { height: 1.45, diameterTop: 0.96, diameterBottom: 0.73, tessellation: 32 }, scene);
  beer.position = new Vector3(0, 0.44, 0.18);
  beer.scaling.y = 0.001;
  beer.material = beerMaterial;
  const foamMaterial = material("foam", new Color3(1, 0.72, 0.38), scene, new Color3(0.48, 0.19, 0.035), 0.92);
  foam = MeshBuilder.CreateCylinder("foam", { height: 0.12, diameter: 0.95, tessellation: 32 }, scene);
  foam.position = new Vector3(0, 0.46, 0.18);
  foam.scaling.y = 0.2;
  foam.material = foamMaterial;

  stream = MeshBuilder.CreateCylinder("pour-stream", { height: 1.55, diameter: 0.055, tessellation: 12 }, scene);
  stream.position = new Vector3(0.32, 2.21, 0.18);
  stream.material = foamMaterial;
  stream.isVisible = false;
  streamTip = MeshBuilder.CreateSphere("stream-tip", { diameter: 0.18, segments: 10 }, scene);
  streamTip.position = new Vector3(0.32, 1.43, 0.18);
  streamTip.material = foamMaterial;
  streamTip.isVisible = false;

  const bubbleMat = material("bubble", new Color3(1, 0.82, 0.5), scene, new Color3(0.3, 0.1, 0.02), 0.72);
  for (let i = 0; i < 13; i += 1) {
    const bubble = MeshBuilder.CreateSphere(`bubble-${i}`, { diameter: 0.025 + (i % 3) * 0.012, segments: 7 }, scene);
    bubble.position = new Vector3(-0.32 + (i % 5) * 0.16, 0.48 + (i % 4) * 0.22, 0.1 + (i % 3) * 0.04);
    bubble.material = bubbleMat;
  }

  glow = new GlowLayer("taproom-glow", scene, { blurKernelSize: 32 });
  glow.intensity = 0.65;
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

function currentOrder(): Order { return orders[activeOrder]; }

function updateHud(): void {
  const order = currentOrder();
  scoreValue.textContent = score.toLocaleString();
  streakValue.textContent = String(streak);
  livesValue.textContent = `${"●".repeat(lives)}${"○".repeat(Math.max(0, 3 - lives))}`;
  roundValue.textContent = String(activeOrder + 1).padStart(2, "0");
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
  serveButton.disabled = fill < 0.32 || judging;
}

function setOrderColor(): void {
  const order = currentOrder();
  const beerMaterial = beer.material as StandardMaterial;
  beerMaterial.diffuseColor = order.color;
  beerMaterial.emissiveColor = order.color.scale(0.32);
}

function resetOrder(): void {
  fill = 0;
  foamAmount = 0;
  pouring = false;
  judging = false;
  roundTime = 0;
  lastPourTone = 0;
  setOrderColor();
  stream.isVisible = false;
  streamTip.isVisible = false;
  tapHandle.rotation.z = 0;
  beer.scaling.y = 0.001;
  foam.scaling.y = 0.2;
  updateHud();
  liveStatus.textContent = "Dial in your flow, then hold the pour.";
  pourButton.classList.remove("is-pouring");
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
  resetOrder();
}

function startPour(): void {
  if (!shiftStarted || judging || fill >= 1.05) return;
  unlockAudio();
  pouring = true;
  pourButton.classList.add("is-pouring");
  stream.isVisible = true;
  streamTip.isVisible = true;
  tapHandle.rotation.z = -0.38;
  liveStatus.textContent = "Keep the crown under control…";
}

function stopPour(): void {
  pouring = false;
  pourButton.classList.remove("is-pouring");
  stream.isVisible = false;
  streamTip.isVisible = false;
  tapHandle.rotation.z = 0;
  if (!judging && fill >= 0.32) liveStatus.textContent = "Looks close. Serve it—or risk a better pour.";
}

function judgeOrder(): void {
  if (!shiftStarted || judging || fill < 0.32) return;
  stopPour();
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
  updateHud();
  resultPanel.hidden = false;
  controls.hidden = true;
}

function nextOrder(): void {
  if (activeOrder >= orders.length - 1 || lives <= 0) {
    finishShift();
    return;
  }
  activeOrder += 1;
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

function updateScene(deltaSeconds: number, timeSeconds: number): void {
  if (!scene) return;
  if (shiftStarted && !judging) {
    roundTime += deltaSeconds;
    if (pouring) {
      const flowRate = 0.018 + flow * 0.115;
      fill = clamp(fill + deltaSeconds * flowRate, 0, 1.12);
      foamAmount = clamp(foamAmount + deltaSeconds * (0.004 + flow * 0.023), 0, 0.34);
      if (timeSeconds - lastPourTone > 0.12) {
        playTone(80 + flow * 30, 0.045, "sine", 0.006);
        lastPourTone = timeSeconds;
      }
      if (fill >= 1.05) {
        liveStatus.textContent = "Spill! Stop pouring.";
        stopPour();
      }
    } else {
      foamAmount = clamp(foamAmount - deltaSeconds * 0.0022, 0, 0.34);
    }
    if (roundTime > 22) {
      liveStatus.textContent = "The customer is tapping the bar.";
      judgeOrder();
    }
    const beerHeight = 1.45 * clamp(fill, 0.001, 1);
    beer.scaling.y = clamp(fill, 0.001, 1.08);
    beer.position.y = 0.44 + beerHeight / 2;
    const foamHeight = 0.12 * clamp(foamAmount / 0.19, 0.18, 1.35);
    foam.scaling.y = foamHeight / 0.12;
    foam.position.y = 0.44 + beerHeight + foamHeight / 2;
    stream.scaling.y = 0.84 + flow * 0.25;
    stream.scaling.x = 0.65 + flow * 0.7;
    stream.scaling.z = stream.scaling.x;
    stream.position.y = 2.23 - flow * 0.1;
    streamTip.position.y = 1.43 + Math.sin(timeSeconds * 16) * 0.025;
    updateHud();
  }
  rim.rotation.y = Math.sin(timeSeconds * 0.25) * 0.012;
  if (tapHandle) tapHandle.position.y = 3.58 + Math.sin(timeSeconds * 1.2) * 0.012;
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
  });
  window.addEventListener("resize", () => engine.resize());

  startButton.addEventListener("click", startShift);
  nextButton.addEventListener("click", nextOrder);
  restartButton.addEventListener("click", startShift);
  flowRange.addEventListener("input", () => {
    flow = Number(flowRange.value) / 100;
    updateHud();
  });
  pourButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pourButton.setPointerCapture(event.pointerId);
    startPour();
  });
  pourButton.addEventListener("pointerup", stopPour);
  pourButton.addEventListener("pointercancel", stopPour);
  serveButton.addEventListener("click", judgeOrder);
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (!event.repeat) startPour();
    }
    if (event.code === "Enter" && shiftStarted && !judging) judgeOrder();
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      const change = event.code === "ArrowLeft" ? -3 : 3;
      flowRange.value = String(clamp(Number(flowRange.value) + change, 18, 92));
      flow = Number(flowRange.value) / 100;
      updateHud();
    }
  });
  document.addEventListener("keyup", (event) => {
    if (event.code === "Space") stopPour();
  });
}

start().catch((error: unknown) => {
  console.error(error);
  loadingStatus.textContent = "The taproom could not open in this browser.";
});
