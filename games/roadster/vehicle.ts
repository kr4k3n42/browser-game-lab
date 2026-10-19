import {
  Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode,
  Vector3, VertexData,
} from '@babylonjs/core';

/** Procedural artistic prototype. Metres, +Z forward; origin ~0.7m above ground.
 * Parent a first-person camera at (0, .58, .05). Inputs are visual only:
 * speed in m/s, steer in [-1,1], and lift/boost/brake in [0,1].
 */
export function createRocketRoadster(scene: Scene): {
  root: TransformNode;
  yoke: TransformNode;
  update: (speed: number, steer: number, lift: number, boost: number, brake: number) => void;
} {
  const root = new TransformNode('roadster', scene);
  const mat = (name: string, hex: string, glow?: string) => {
    const m = new StandardMaterial(`roadster-${name}`, scene);
    m.diffuseColor = Color3.FromHexString(hex);
    m.specularColor = new Color3(.08, .08, .09);
    m.specularPower = 24;
    if (glow) m.emissiveColor = Color3.FromHexString(glow);
    return m;
  };
  const silver = mat('satin-silver', '#9EA8AF');
  const bright = mat('upper-facets', '#C0C7CC');
  const graphite = mat('graphite', '#303840');
  const carbon = mat('carbon', '#141B21');
  const cockpit = mat('cockpit', '#10171C');
  const upholstery = mat('upholstery', '#263039');
  const rubber = mat('rubber', '#131719');
  const alloy = mat('wheel-alloy', '#737F88');
  const cyan = mat('cyan', '#71C8D9', '#3B8494');
  const white = mat('white', '#D9F2F4', '#97C5CC');
  const red = mat('rear-light', '#752D35', '#9F2932');
  const screen = mat('screen', '#091D29', '#123D50');

  function box(name: string, size: number[], pos: number[], material: StandardMaterial,
    parent: TransformNode = root): Mesh {
    const m = MeshBuilder.CreateBox(`roadster-${name}`, {
      width: size[0], height: size[1], depth: size[2],
    }, scene);
    m.position.set(pos[0], pos[1], pos[2]);
    m.material = material;
    m.parent = parent;
    return m;
  }
  function beam(name: string, a: number[], b: number[], width: number,
    material: StandardMaterial, parent: TransformNode = root): Mesh {
    const start = Vector3.FromArray(a), end = Vector3.FromArray(b);
    const m = box(name, [width, width, Vector3.Distance(start, end)], [0, 0, 0], material, parent);
    m.position.copyFrom(start.add(end).scale(.5));
    m.lookAt(end);
    return m;
  }
  // Closed polygonal sections: each ring is left-bottom, right-bottom,
  // right-shoulder, right-top, left-top, left-shoulder. Hard normals keep facets crisp.
  function shell(name: string, rings: number[][][], material: StandardMaterial): Mesh {
    const positions = rings.flat(2);
    const indices: number[] = [];
    const n = rings[0].length;
    for (let r = 0; r < rings.length - 1; r++) {
      for (let j = 0; j < n; j++) {
        const a = r * n + j, b = r * n + (j + 1) % n;
        indices.push(a, a + n, b, b, a + n, b + n);
      }
    }
    for (let j = 1; j < n - 1; j++) {
      indices.push(0, j, j + 1);
      const o = (rings.length - 1) * n;
      indices.push(o, o + j + 1, o + j);
    }
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    const data = new VertexData();
    data.positions = positions; data.indices = indices; data.normals = normals;
    const mesh = new Mesh(`roadster-${name}`, scene);
    data.applyToMesh(mesh);
    mesh.convertToFlatShadedMesh();
    mesh.material = material; mesh.parent = root;
    return mesh;
  }
  function ring(z: number, halfWidth: number, low: number, shoulder: number, top: number): number[][] {
    return [[-halfWidth, low, z], [halfWidth, low, z], [halfWidth, shoulder, z],
      [halfWidth * .78, top, z], [-halfWidth * .78, top, z], [-halfWidth, shoulder, z]];
  }

  // The hood and rear deck stop at the cockpit opening; no solid cabin block.
  shell('hood-wedge', [ring(.82, .90, -.34, .19, .24),
    ring(1.48, 1.02, -.34, .10, .17), ring(2.40, .85, -.32, -.12, -.07)], silver);
  shell('rear-haunches', [ring(-2.36, .91, -.38, .03, .18),
    ring(-1.48, 1.04, -.38, .22, .39), ring(-.70, .86, -.35, .26, .38)], silver);
  box('undertray', [1.77, .09, 4.30], [0, -.43, -.02], carbon);
  for (const side of [-1, 1]) {
    const x = side * .91;
    box('sculpted-sill', [.23, .31, 1.57], [x, -.23, .02], graphite);
    const rail = box('silver-door-rail', [.17, .11, 1.56], [side * .87, .04, .02], bright);
    rail.rotation.z = side * -.12;
    beam('door-crease', [side * 1.025, -.14, -.70], [side * 1.025, -.23, .76], .025, silver);
    box('side-intake', [.025, .16, .33], [side * 1.036, -.13, -.58], carbon);
    for (let j = 0; j < 3; j++) {
      box('intake-blade', [.032, .015, .29], [side * 1.055, -.18 + j * .05, -.58], alloy);
    }
    // Outboard pillars bound an entirely clear forward sightline.
    beam('A-pillar', [side * .86, .13, .85], [side * .86, .63, -.08], .045, graphite);
    beam('T-top-edge', [side * .86, .63, -.08], [side * .82, .62, -.74], .04, silver);
    beam('rear-buttress', [side * .82, .62, -.74], [side * .83, .34, -1.15], .065, graphite);
    box('mirror-stalk', [.16, .035, .04], [side * 1.01, .17, .65], graphite);
    const mirror = box('mirror', [.18, .075, .17], [side * 1.10, .19, .66], silver);
    mirror.rotation.y = side * -.15;
    // Thin angular light signatures sit on the tapered nose.
    beam('headlight', [side * .32, -.075, 2.405], [side * .78, -.125, 2.405], .032, white);
    beam('hood-shutline', [side * .57, .243, .84], [side * .64, -.063, 2.33], .009, graphite);
    box('rear-light', [.64, .035, .025], [side * .51, .075, -2.371], red);
  }
  box('front-splitter', [1.85, .055, .28], [0, -.37, 2.27], carbon);
  box('nose-intake', [1.15, .10, .025], [0, -.235, 2.405], carbon);
  box('rear-diffuser', [1.69, .09, .40], [0, -.38, -2.22], graphite);
  for (const x of [-.69, -.35, 0, .35, .69]) {
    box('diffuser-fin', [.025, .16, .42], [x, -.39, -2.23], carbon);
  }
  for (let i = 0; i < 6; i++) {
    box('rear-deck-louver', [1.20, .021, .045], [0, .29 - i * .016, -1.72 - i * .09], graphite);
  }

  // Single-seat tub and deliberate first-person detail, all below the eye line.
  box('tub-floor', [1.42, .07, 1.49], [0, -.32, .02], cockpit);
  box('seat-cushion', [.53, .14, .58], [0, -.18, -.29], upholstery);
  const seatBack = box('seat-back', [.55, .58, .13], [0, .02, -.60], upholstery);
  seatBack.rotation.x = -.12;
  box('headrest', [.30, .22, .13], [0, .39, -.64], cockpit);
  for (const side of [-1, 1]) {
    box('seat-bolster', [.09, .24, .57], [side * .29, -.13, -.29], cockpit);
    beam('seat-piping', [side * .23, -.09, -.54], [side * .23, -.09, -.06], .012, graphite);
    box('inner-door-panel', [.075, .30, 1.28], [side * .74, -.11, .04], cockpit);
    box('door-pull', [.06, .035, .24], [side * .69, .05, .14], alloy);
    box('door-accent', [.015, .012, .70], [side * .694, .078, .13], cyan);
  }
  box('broad-dash', [1.58, .18, .32], [0, .25, .65], cockpit);
  box('dash-brow', [1.62, .035, .34], [0, .35, .66], graphite);
  box('instrument-bezel', [.56, .19, .035], [0, .295, .475], graphite);
  box('instrument-screen', [.51, .145, .012], [0, .30, .452], screen);
  // Layered bars make the instruments legible without fonts or texture assets.
  const speedBars: Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    speedBars.push(box('speed-bar', [.022, .014 + i * .003, .006],
      [-.21 + i * .038, .275, .442], cyan));
  }
  box('instrument-horizon', [.42, .006, .006], [0, .331, .441], white);
  for (const side of [-1, 1]) {
    box('aux-screen', [.24, .11, .015], [side * .57, .285, .478], screen);
    for (let i = 0; i < 3; i++) {
      box('aux-readout', [.12 - i * .026, .008, .006], [side * .57, .31 - i * .028, .466], cyan);
    }
    for (let i = 0; i < 4; i++) {
      box('dash-vent', [.025, .038, .012], [side * (.35 + i * .035), .245, .478], carbon);
    }
  }
  beam('steering-column', [0, .13, .65], [0, .28, .42], .075, graphite);
  const yoke = new TransformNode('roadster-yoke', scene);
  yoke.parent = root; yoke.position.set(0, .28, .42);
  box('yoke-hub', [.15, .095, .075], [0, 0, 0], graphite, yoke);
  box('yoke-center-mark', [.035, .009, .008], [0, .015, -.041], cyan, yoke);
  beam('yoke-bottom', [-.22, -.10, 0], [.22, -.10, 0], .042, graphite, yoke);
  for (const side of [-1, 1]) {
    beam('yoke-spoke', [side * .05, 0, 0], [side * .22, -.07, 0], .032, alloy, yoke);
    beam('yoke-grip', [side * .23, -.08, 0], [side * .25, .10, 0], .056, cockpit, yoke);
    box('yoke-switch', [.028, .026, .009], [side * .15, -.027, -.028], cyan, yoke);
  }

  const wheels: { steering: TransformNode; spin: TransformNode; front: boolean }[] = [];
  for (const z of [-1.45, 1.45]) for (const side of [-1, 1]) {
    const steering = new TransformNode(`roadster-wheel-pivot-${side}-${z}`, scene);
    steering.parent = root; steering.position.set(side * .96, -.35, z);
    const spin = new TransformNode('roadster-wheel-spin', scene); spin.parent = steering;
    const tire = MeshBuilder.CreateCylinder('roadster-tire', {
      diameter: .70, height: .26, tessellation: 32,
    }, scene);
    tire.rotation.z = Math.PI / 2; tire.material = rubber; tire.parent = spin;
    const rim = MeshBuilder.CreateCylinder('roadster-rim', {
      diameter: .52, height: .272, tessellation: 24,
    }, scene);
    rim.rotation.z = Math.PI / 2; rim.material = graphite; rim.parent = spin;
    const hub = MeshBuilder.CreateCylinder('roadster-hub', {
      diameter: .14, height: .285, tessellation: 12,
    }, scene);
    hub.rotation.z = Math.PI / 2; hub.material = alloy; hub.parent = spin;
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const spoke = box('wheel-spoke', [.018, .20, .045],
        [side * .143, Math.cos(angle) * .15, Math.sin(angle) * .15], alloy, spin);
      spoke.rotation.x = angle;
    }
    // Upper wheel-arch blades leave visible tires and room for steering.
    box('fender-blade', [.30, .055, .77], [side * .94, .075, z], silver);
    wheels.push({ steering, spin, front: z > 0 });
  }

  const wing = new TransformNode('roadster-active-wing', scene);
  wing.parent = root; wing.position.set(0, .38, -1.90);
  for (const side of [-1, 1]) {
    beam('wing-stanchion', [side * .62, .19, -1.90], [side * .62, .40, -1.90], .035, graphite);
    box('wing-endplate', [.035, .16, .40], [side * .96, .04, 0], graphite, wing);
  }
  box('wing-plane', [1.94, .045, .34], [0, .02, 0], graphite, wing);
  box('wing-trailing-edge', [1.86, .014, .018], [0, .045, -.17], silver, wing);

  const vaporMaterial = mat('cold-gas-vapor', '#C4F4FA', '#9DDAE6');
  vaporMaterial.alpha = .22;
  vaporMaterial.disableLighting = true;
  vaporMaterial.backFaceCulling = false;
  vaporMaterial.disableDepthWrite = true;
  const coreMaterial = mat('vapor-core', '#EFFCFF', '#BDDDE3');
  coreMaterial.alpha = .32;
  coreMaterial.disableLighting = true;
  coreMaterial.backFaceCulling = false;
  coreMaterial.disableDepthWrite = true;
  const jets: { vapor: TransformNode; group: 'rear' | 'front' | 'down'; phase: number }[] = [];
  function nozzle(pos: number[], group: 'rear' | 'front' | 'down', index: number) {
    const mount = new TransformNode(`roadster-nozzle-${group}-${index}`, scene);
    mount.parent = root; mount.position.set(pos[0], pos[1], pos[2]);
    // Cylinder's local +Y is the exhaust direction.
    if (group === 'rear') mount.rotation.x = -Math.PI / 2;
    else if (group === 'front') mount.rotation.x = Math.PI / 2;
    else mount.rotation.z = Math.PI;
    const housing = MeshBuilder.CreateCylinder('roadster-nozzle-housing', {
      height: .12, diameterBottom: .17, diameterTop: .14, tessellation: 12,
    }, scene);
    housing.parent = mount; housing.material = alloy;
    const throat = MeshBuilder.CreateCylinder('roadster-nozzle-throat', {
      height: .013, diameter: .103, tessellation: 16,
    }, scene);
    throat.parent = mount; throat.position.y = .065; throat.material = carbon;
    const rim = MeshBuilder.CreateTorus('roadster-nozzle-lip', {
      diameter: .127, thickness: .014, tessellation: 16,
    }, scene);
    rim.parent = mount; rim.position.y = .070; rim.material = graphite;
    const vapor = new TransformNode('roadster-cold-gas', scene);
    vapor.parent = mount; vapor.position.y = .08;
    const plume = MeshBuilder.CreateCylinder('roadster-vapor-cone', {
      height: .80, diameterBottom: .07, diameterTop: .34, tessellation: 16,
    }, scene);
    plume.parent = vapor; plume.position.y = .40; plume.material = vaporMaterial;
    const core = MeshBuilder.CreateCylinder('roadster-vapor-core', {
      height: .38, diameterBottom: .055, diameterTop: .15, tessellation: 12,
    }, scene);
    core.parent = vapor; core.position.y = .19; core.material = coreMaterial;
    plume.isPickable = core.isPickable = false;
    vapor.setEnabled(false);
    jets.push({ vapor, group, phase: index * 1.7 });
  }
  for (let i = 0; i < 4; i++) nozzle([-.66 + i * .44, -.17, -2.39], 'rear', i);
  for (let i = 0; i < 2; i++) nozzle([i === 0 ? -.64 : .64, -.24, 2.40], 'front', i);
  for (let i = 0; i < 4; i++) nozzle([i % 2 === 0 ? -.68 : .68, -.46, i < 2 ? 1.04 : -1.04], 'down', i);

  let time = 0;
  const finite = (v: number) => Number.isFinite(v) ? v : 0;
  const unit = (v: number) => Math.max(0, Math.min(1, finite(v)));
  function update(speed: number, steer: number, lift: number, boost: number, brake: number): void {
    const dt = Math.min(.05, Math.max(0, finite(scene.getEngine().getDeltaTime()) / 1000));
    time += dt;
    const s = Math.max(-1, Math.min(1, finite(steer)));
    const l = unit(lift), b = unit(boost), braking = unit(brake);
    yoke.rotation.z = -s * .65;
    for (const wheel of wheels) {
      wheel.steering.rotation.y = wheel.front ? s * .43 : 0;
      wheel.spin.rotation.x = (wheel.spin.rotation.x + finite(speed) * dt / .35) % (Math.PI * 2);
    }
    wing.rotation.x = braking * .62;
    wing.position.y = .38 + braking * .11;
    red.emissiveColor.set(.38 + braking * .52, .035, .045);
    for (let i = 0; i < speedBars.length; i++) {
      speedBars[i].scaling.y = Math.abs(finite(speed)) / 100 > i / 12 ? 1.5 : .45;
    }
    for (const jet of jets) {
      const power = jet.group === 'down' ? l : jet.group === 'rear' ? b : Math.max(l * .22, b * .16);
      jet.vapor.setEnabled(power > .015);
      const flutter = 1 + Math.sin(time * 33 + jet.phase) * .045;
      jet.vapor.scaling.set(.55 + power * .45, (.18 + power * 1.25) * flutter, .55 + power * .45);
    }
  }
  return { root, yoke, update };
}
