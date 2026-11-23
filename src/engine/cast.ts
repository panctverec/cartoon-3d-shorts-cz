// Engine: the per-frame stage. The scene's stage(ctx) function says who/what is on screen at (id, f):
//   ctx.host({...})           the host (src/characters/host.ts) as a lit yaw billboard + contact blob (skipped automatically on info-card keys)
//   ctx.hand(x, y)            world point at a spot of the host's drawing (design units: x 0..600, y 0..975 = feet)
//   ctx.lit(key, ...)         a lit character card (SCALE, BRAIN, ...) standing at pos (bottom-anchored)
//   ctx.fx(key, ...)          an unlit effect card facing the camera (CENTRED at pos), or flat on the floor
//   ctx.card(key, ...)        a full-frame info card at the active card key's anchor
//   ctx.blob(pos, w, h)       soft contact shadow on the floor
// Drawings are cached by key: put every parameter that changes the picture into the key (quantize with q()).
import * as THREE from "three";
import { Pool, Actor, Fx } from "../videos/bridge/cast";
import { Pen, fxContact, Expr } from "../videos/bridge/toon";
import { NOINK } from "../videos/bridge/ink";
import { cardShade, CARD_K } from "../videos/bridge/cardshade";
import { drawHost } from "../characters/host";
import { FPS, V3, Shot } from "./camera";

export const SU = 0.00216; // metres per design unit of the character canvases
export const HOST_S = 0.78; // the host's scale (1.68 m)
const CARDG = (() => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); return g; })();
/** lit, bottom-anchored card for characters other than the host */
class Card {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; r: ReturnType<Pool["req"]> | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: null, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mesh = new THREE.Mesh(CARDG, this.mat);
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.receiveShadow = true; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK); this.mesh.visible = false; this.mesh.rotation.order = "YXZ";
    parent.add(this.mesh);
  }
  bind() { const t = this.r?.tex; if (t) this.mat.map = t; }
}
/** the host's canvas resolution by camera distance */
const tier = (d: number): [number, number, number] => d < 1.6 ? [1800, 3000, 3.0] : d < 3.5 ? [1080, 1800, 1.8] : [600, 1000, 1.0];
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const LID = [0.5, 1, 1, 0.5];
/** natural blinking (4-frame lid curve every 0.6-2.4 s), deterministic per seed */
export const blinkAt = (t: number, seed: number) => {
  const f = Math.round(t * FPS);
  let s = Math.round(-40 * hh(seed, 9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(18 + 54 * hh(seed * 31 + n, 13)); }
  return 0;
};
/** expressions switch this much before the word (reads as reacting, not lagging) */
const LEAD = 2 / FPS;

export type HostPose = { pos: V3; expr: Expr; lid?: number; look?: number; wave?: number; walk?: number };
export type FxOpts = { soft?: boolean; flat?: boolean; rot?: number };
type FxReq = { key: string; cw: number; ch: number; draw: (p: Pen) => void; pos: V3; w: number; h: number } & FxOpts;

export class Ctx<M extends string = string, P = unknown> {
  // ---- frame info (read-only for the scene) ----
  id = 1; f = 0; t = 0; shot!: Shot<M>; cam!: THREE.PerspectiveCamera; parts!: P;
  /** camera's right vector (for placing things beside the host) */
  right = new THREE.Vector3();
  /** true while an info-card key is active (host hidden) */
  cardShot = false;
  private anchor: V3 | null = null;
  private light = 0;
  private hostAt: V3 | null = null;
  private pool = new Pool();
  private hostA: Actor; private cards: Card[] = []; private fxs: Fx[] = [];
  private list: FxReq[] = []; private ci = 0;
  private v = new THREE.Vector3();
  constructor(private root: THREE.Object3D) { this.hostA = new Actor(root); }

  /** true from word time s on (with the 2-frame lead) */
  L = (s: number) => this.t >= s - LEAD;
  blink = (seed = 3) => blinkAt(this.t, seed);

  begin(id: number, f: number, shot: Shot<M>, cam: THREE.PerspectiveCamera, sunDir: THREE.Vector3, card: V3 | undefined, parts: P) {
    this.id = id; this.f = f; this.t = f / FPS; this.shot = shot; this.cam = cam; this.parts = parts;
    this.cardShot = !!card; this.anchor = card ?? null;
    this.right.setFromMatrixColumn(cam.matrixWorld, 0);
    const sx = sunDir.dot(this.right), sy = -sunDir.y;
    this.light = Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
    this.list = []; this.ci = 0; this.hostAt = null; this.hostA.mesh.visible = false;
  }

  host(s: HostPose | null) {
    if (!s || this.cardShot) return;
    const cam = this.cam, [x, y, z] = s.pos, head: V3 = [x, y + 666 * SU * HOST_S, z];
    const [cw, ch, k] = tier(cam.position.distanceTo(this.v.set(...head)));
    const opts = { expr: s.expr, blink: s.lid ?? this.blink(), look: s.look ?? 0, wave: s.wave, light: this.light,
      walk: s.walk !== undefined ? Math.round(s.walk * 24) / 24 : undefined };
    this.hostA.r = this.pool.req(`host|${JSON.stringify(opts)}`, cw, ch, k, (p) => drawHost(p, opts));
    const m = this.hostA.mesh;
    m.visible = true; m.position.set(x, y, z);
    m.rotation.set(0, Math.atan2(cam.position.x - x, cam.position.z - z), 0); m.scale.setScalar(HOST_S);
    this.hostAt = s.pos;
    this.blob([x, y + 0.012, z], 0.5, 0.36);
  }
  /** the host's position (for thought bubbles); null when not on screen */
  get hostPos() { return this.hostAt; }
  /** world point at the host's drawing coordinate (x 300 = centre line; right hand ~416, y 630-651 = hands at rest) */
  hand(dxu: number, yu: number): V3 {
    const [x, y, z] = this.hostAt ?? [0, 0, 0], r = this.right, k = SU * HOST_S;
    return [x + r.x * (dxu - 300) * k, y + (975 - yu) * k, z + r.z * (dxu - 300) * k];
  }
  /** lit character card standing at pos (feet), facing the camera unless yaw is given */
  lit(key: string, cw: number, ch: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: { yaw?: number; res?: [number, number] } = {}) {
    const cam = this.cam;
    while (this.cards.length <= this.ci) this.cards.push(new Card(this.root));
    const cd = this.cards[this.ci++], [rn, rf] = o.res ?? [2.4, 1.4];
    const res = cam.position.distanceTo(this.v.set(pos[0], pos[1] + h / 2, pos[2])) < 1.5 ? rn : rf;
    cd.r = this.pool.req(`${key}|${res}`, Math.round(cw * res), Math.round(ch * res), res, draw);
    cd.mesh.visible = true; cd.mesh.position.set(...pos);
    cd.mesh.rotation.set(0, o.yaw ?? Math.atan2(cam.position.x - pos[0], cam.position.z - pos[2]), 0);
    cd.mesh.scale.set(w, h, 1);
  }
  fx(key: string, cw: number, ch: number, draw: (p: Pen) => void, pos: V3, w: number, h: number, o: FxOpts = {}) {
    this.list.push({ key, cw, ch, draw, pos, w, h, ...o });
  }
  blob(pos: V3, w: number, h: number, col = "#5a5a78") {
    this.fx(`blob|contact|${col}`, 128, 128, (p) => fxContact(p, col), pos, w, h, { flat: true });
  }
  /** info card at the active card key's anchor (dx/dy/dz nudge); ignored outside card keys */
  card(key: string, cw: number, ch: number, draw: (p: Pen) => void, w: number, h: number, o: FxOpts & { dx?: number; dy?: number; dz?: number } = {}) {
    const a = this.anchor;
    if (!a) return;
    this.fx(key, cw, ch, draw, [a[0] + (o.dx ?? 0), a[1] + (o.dy ?? 0), a[2] + (o.dz ?? 0)], w, h, o);
  }
  /** card anchor of the active card key (for effects layered over a card) */
  get cardAt() { return this.anchor; }

  end() {
    for (let i = this.ci; i < this.cards.length; i++) this.cards[i].mesh.visible = false;
    let fi = 0;
    for (const p of this.list) {
      while (this.fxs.length <= fi) this.fxs.push(new Fx(this.root));
      const e = this.fxs[fi++];
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true; e.mesh.position.set(...p.pos);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(this.cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    if (this.hostA.mesh.visible) this.hostA.bind();
    for (let i = 0; i < this.ci; i++) this.cards[i].bind();
    for (let i = 0; i < fi; i++) this.fxs[i].bind();
  }
}
