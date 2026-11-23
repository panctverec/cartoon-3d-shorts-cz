// Engine: sets built in code (no model kits). Rooms are boxes (floor, 4 walls, ceiling) in one Batch that does not
// cast shadows; furniture goes in a second Batch that does. Place every set far apart on x (0, 40, 80 ...): each shot
// only ever sees one room. RULE: every camera position must stay INSIDE its room box (a lens behind a wall = blank frame).
// Textures are cached by key; the key's length + first letter seed the painter's random dots, so keep keys unique.
import * as THREE from "three";
import { Batch, boxGeo, V, lam } from "../videos/bridge/build";
import { ctex, planksHD, jit } from "../videos/bridge/paint";
import { NOINK } from "../videos/bridge/ink";

export { Batch, boxGeo, V, lam, ctex, jit, NOINK };
export type Box = { x0: number; x1: number; z0: number; z1: number; h: number };
export const solid = (key: string, col: string) => lam(key, () => ({ color: col }));
export const tex = (key: string, map: () => THREE.Texture, rx = 1, ry = 1) =>
  lam(key, () => { const t = map().clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return { map: t }; });
export const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
export const cyl = (r0: number, r1: number, h: number, n = 20) => new THREE.CylinderGeometry(r0, r1, h, n);
export const box = (b: Batch, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: THREE.Material) => b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1)), m);

// ---------------- painted textures ----------------
/** dotted wallpaper */
export const wallpaper = (key: string, base: string, dot: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { g.fillStyle = jit(r, dot, 0.08); g.beginPath(); g.arc(r() * 512, r() * 512, 5, 0, Math.PI * 2); g.fill(); }
});
/** checked quilt with dashed stitching */
export const quiltTex = (key: string, a = "#a6c8e0", b = "#c9dcea") => ctex(key, 512, 512, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 128, y * 128, 128, 128); }
  g.strokeStyle = "rgba(60,90,120,0.35)"; g.lineWidth = 3; g.setLineDash([10, 8]);
  for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
});
/** rug with concentric stripes */
export const rugTex = (key: string, a: string, b: string) => ctex(key, 512, 512, (g) => {
  g.fillStyle = a; g.fillRect(0, 0, 512, 512); g.strokeStyle = b; g.lineWidth = 18;
  for (let i = 40; i < 260; i += 50) g.strokeRect(i, i, 512 - 2 * i, 512 - 2 * i);
});
/** blue sky with little clouds (window glass) */
export const skyTex = (key = "sky_win") => ctex(key, 256, 256, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#7fb4ec"); gr.addColorStop(1, "#d6e8f8"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#ffffff"; for (const [x, y, r] of [[60, 80, 26], [90, 70, 32], [125, 82, 24], [190, 140, 20], [215, 132, 26]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
});
/** plank floor material (shared) */
export const plankFloor = (key = "eng_floor", rep = 2.6) => lam(key, () => { const t = planksHD().clone(); t.repeat.set(rep, rep); t.needsUpdate = true; return { map: t }; });

// ---------------- shell ----------------
/** floor + 4 walls + ceiling around the box (walls 10 cm thick, outside the box) */
export const room = (shell: Batch, r: Box, wall: THREE.Material, floor: THREE.Material, ceil: THREE.Material) => {
  const { x0, x1, z0, z1, h } = r;
  shell.add(boxGeo(V(x0, -0.1, z0), V(x1, 0, z1)), floor);
  shell.add(boxGeo(V(x0, 0, z0 - 0.1), V(x1, h, z0)), wall);
  shell.add(boxGeo(V(x0 - 0.1, 0, z0), V(x0, h, z1)), wall);
  shell.add(boxGeo(V(x1, 0, z0), V(x1 + 0.1, h, z1)), wall);
  shell.add(boxGeo(V(x0, 0, z1), V(x1, h, z1 + 0.1)), wall);
  shell.add(boxGeo(V(x0, h, z0), V(x1, h + 0.1, z1)), ceil);
};
/** window on a back wall (z = wall plane): frame with a middle bar + sky glass. sky = a texture (skyTex) */
export const windowOn = (R: THREE.Object3D, f: Batch, x: number, y: number, z: number, w: number, h: number, sky: THREE.Texture, frameCol = "#f4efe6") => {
  const frame = solid(`frame_${frameCol}`, frameCol);
  f.add(boxGeo(V(x - w / 2, y - 0.04, z), V(x + w / 2, y + 0.04, z + 0.06)), frame);
  f.add(boxGeo(V(x - w / 2, y + h - 0.04, z), V(x + w / 2, y + h + 0.04, z + 0.06)), frame);
  for (const xx of [x - w / 2, x, x + w / 2 - 0.06]) f.add(boxGeo(V(xx, y, z), V(xx + 0.06, y + h, z + 0.06)), frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sky })); glass.position.set(x, y + h / 2, z + 0.005); glass.layers.set(NOINK); R.add(glass);
  return glass;
};
/** an unlit, un-inked plane (screens, displays, mirror glass); returns its material so the scene can swap the map */
export const panel = (R: THREE.Object3D, w: number, h: number, pos: [number, number, number], rot: [number, number, number], p: THREE.MeshBasicMaterialParameters) => {
  const mat = new THREE.MeshBasicMaterial(p), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(...pos); m.rotation.set(...rot); m.layers.set(NOINK); R.add(m);
  return mat;
};

// ---------------- furniture (all sizes in metres; x0..x1 / z0..z1 are footprints) ----------------
export const rugOn = (f: Batch, x: number, z: number, w: number, d: number, m: THREE.Material, y = 0.006) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); f.add(g, m, T(x, y, z));
};
/** bed against a back wall at z0: frame, quilt, headboard, n pillows */
export const bed = (f: Batch, x0: number, x1: number, z0: number, z1: number, m: { wood: THREE.Material; quilt: THREE.Material; head: THREE.Material; pillow: THREE.Material }) => {
  f.add(boxGeo(V(x0, 0.12, z0 + 0.05), V(x1, 0.42, z1)), m.wood);
  f.add(boxGeo(V(x0 + 0.05, 0.42, z0 + 0.1), V(x1 - 0.05, 0.6, z1 - 0.05)), m.quilt);
  f.add(boxGeo(V(x0 - 0.1, 0, z0), V(x1 + 0.1, 1.15, z0 + 0.12)), m.head);
  const w = x1 - x0;
  for (const x of [x0 + w * 0.25, x0 + w * 0.75]) { const pg = new THREE.SphereGeometry(1, 20, 10); pg.scale(0.36, 0.1, 0.22); f.add(pg, m.pillow, T(x, 0.68, z0 + 0.35)); }
};
/** wardrobe against the LEFT wall (x0 = wall plane), two doors facing +x, brass handles */
export const wardrobeLeft = (f: Batch, x0: number, z0: number, z1: number, body: THREE.Material, door: THREE.Material, brass: THREE.Material, depth = 0.6, h = 2.1) => {
  const x1 = x0 + depth, mid = (z0 + z1) / 2;
  f.add(boxGeo(V(x0, 0, z0), V(x1, h, z1)), body);
  f.add(boxGeo(V(x1 - 0.01, 0.1, z0 + 0.05), V(x1 + 0.01, h - 0.1, mid - 0.02)), door);
  f.add(boxGeo(V(x1 - 0.01, 0.1, mid + 0.02), V(x1 + 0.01, h - 0.1, z1 - 0.05)), door);
  for (const z of [mid - 0.1, mid + 0.1]) f.add(boxGeo(V(x1 + 0.01, 1.0, z - 0.01), V(x1 + 0.04, 1.3, z + 0.01)), brass);
};
/** full-length mirror leaning on the RIGHT wall (x1 = wall plane); returns the glass material */
export const mirrorRight = (R: THREE.Object3D, f: Batch, x1: number, z0: number, z1: number, frame: THREE.Material, glass = "#cfe3ef", h = 1.9) => {
  f.add(boxGeo(V(x1 - 0.15, 0, z0), V(x1, h, z1)), frame);
  return panel(R, z1 - z0 - 0.13, h - 0.15, [x1 - 0.155, h / 2, (z0 + z1) / 2], [0, -Math.PI / 2, 0], { color: glass });
};
/** potted plant: pot (r, h) on a base height y, leaf balls [dx, dy, dz, r] relative to the pot top */
export const plant = (f: Batch, x: number, y: number, z: number, pot: THREE.Material, leaf: THREE.Material, r = 0.12, h = 0.22, balls: [number, number, number, number][] = [[0, 0.13, 0, 0.18], [0.1, 0.25, 0.03, 0.13]]) => {
  f.add(cyl(r, r * 0.75, h), pot, T(x, y + h / 2, z));
  for (const [dx, dy, dz, rr] of balls) f.add(new THREE.SphereGeometry(rr, 14, 10), leaf, T(x + dx, y + h + dy, z + dz));
};
/** sofa against a back wall (z0), seat + back + arms, cushions */
export const sofa = (f: Batch, x0: number, x1: number, z0: number, body: THREE.Material, cushion: THREE.Material, depth = 0.8, cushions = [0.4, 1.2]) => {
  const z1 = z0 + depth;
  f.add(boxGeo(V(x0, 0.1, z0), V(x1, 0.5, z1)), body);
  f.add(boxGeo(V(x0, 0.5, z0), V(x1, 1.0, z0 + 0.25)), body);
  for (const x of [x0 - 0.05, x1 - 0.05]) f.add(boxGeo(V(x - 0.1, 0.1, z0), V(x + 0.15, 0.7, z1)), body);
  for (const x of cushions.map((c) => x0 + c)) f.add(boxGeo(V(x - 0.18, 0.5, z0 + 0.3), V(x + 0.18, 0.86, z0 + 0.4)), cushion);
};
/** small dumbbell lying on the floor along x */
export const dumbbell = (f: Batch, x: number, z: number, bar: THREE.Material, plate: THREE.Material) => {
  f.add(cyl(0.02, 0.02, 0.28, 8).rotateZ(Math.PI / 2), bar, T(x, 0.06, z));
  for (const s of [-1, 1]) f.add(cyl(0.055, 0.055, 0.06, 12).rotateZ(Math.PI / 2), plate, T(x + s * 0.12, 0.06, z));
};
/** framed picture on a back wall (z = wall plane) */
export const picture = (f: Batch, x0: number, y0: number, x1: number, y1: number, z: number, frame: THREE.Material, art: THREE.Material) => {
  f.add(boxGeo(V(x0, y0, z), V(x1, y1, z + 0.04)), frame);
  f.add(boxGeo(V(x0 + 0.05, y0 + 0.05, z + 0.04), V(x1 - 0.05, y1 - 0.05, z + 0.05)), art);
};
/** side table with a lamp */
export const tableLamp = (f: Batch, x: number, z: number, wood: THREE.Material, stem: THREE.Material, shade: THREE.Material, w = 0.5, h = 0.55) => {
  f.add(boxGeo(V(x - w / 2, 0, z - w / 2), V(x + w / 2, h, z + w / 2)), wood);
  f.add(cyl(0.02, 0.02, 0.4, 8), stem, T(x, h + 0.2, z)); f.add(cyl(0.08, 0.16, 0.2), shade, T(x, h + 0.45, z));
};
