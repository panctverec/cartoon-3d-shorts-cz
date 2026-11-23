// Engine: timeline + cameras. A short is a list of shots; each shot owns its camera keys. A key can be a glide
// (default 24 frames, quintic ease) or a hard cut, carries the lens-blur strength (dof = cInf) and, for full-frame
// info-card shots, the card anchor (the host is hidden automatically while a card key is active).
export const FPS = 30;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
/** quantize (keeps the canvas pool small: animated drawings only redraw n times per unit) */
export const q = (v: number, n = 60) => Math.round(v * n) / n;

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Pose = Partial<Cam> & { pos: V3; look: V3 };
export type Key = {
  f: number; dur?: number; cut?: boolean; s: (f: number) => Pose;
  /** lens blur at infinity for this key (glides blend over dur, cuts switch) */
  dof?: number; focus?: (f: number) => V3;
  /** info-card key: anchor where ctx.card() drawings float; the host is hidden */
  card?: V3;
};

/** slow push-in factor (1 -> smaller): rate per frame, optional punch (faster for n frames) */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 30) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Pose =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** the workhorse: camera at pos looking at look, pushing in from frame f0 */
export const at = (pos: V3, look: V3, fov: number, f0: number, rate = 0.0025, roll = 0, punch = 0) =>
  (f: number) => dolly(pos, look, pushK(f, f0, rate, punch), { fov, roll });

// ---- key builders ----
type KeyOpts = Omit<Key, "f" | "s" | "cut">;
/** first key of a shot (or a glide when used later in the shot) */
export const key = (f: number, s: (f: number) => Pose, o: KeyOpts = {}): Key => ({ f, s, ...o });
export const glideTo = key;
export const cut = (f: number, s: (f: number) => Pose, o: KeyOpts = {}): Key => ({ f, s, cut: true, ...o });
/** full-frame info card: camera 2.35 m in front of a card floating at (x, 1.52, z0 + 0.3); room blurred behind */
export const CARD_H = 1.42;
export const cardCam = (f0: number, o: { x?: number; z0?: number; roll?: number; dof?: number; rate?: number } = {}) => {
  const x = o.x ?? 0, z0 = o.z0 ?? 0;
  return at([x, CARD_H, z0 + 2.35], [x, CARD_H, z0], 40, f0, o.rate ?? 0.0015, o.roll ?? 0);
};
/** rate = push-in speed (default 0.0015, 0 = static card) */
export const cardKey = (f: number, o: { x?: number; z0?: number; roll?: number; dof?: number; rate?: number; first?: boolean } = {}): Key =>
  ({ f, cut: !o.first, s: cardCam(f, o), dof: o.dof ?? 14, card: [o.x ?? 0, 1.52, (o.z0 ?? 0) + 0.3] });

const full = (c: Pose): Cam => ({ fov: 40, roll: 0, ...c });
const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});

export type ShotDef<M extends string> = {
  /** last frame (exclusive); the shot starts where the previous one ended */
  to: number; mood: M; keys: Key[];
  /** crossfade INTO this shot over n frames (centred on the cut) */
  xfade?: number; note?: string;
};
export type Shot<M extends string> = ShotDef<M> & { id: number; a: number; b: number };

export class Timeline<M extends string> {
  shots: Shot<M>[];
  private dof: { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 }[] = [];
  constructor(defs: ShotDef<M>[], public total: number, private kicks: [number, number][] = [], public flashAt = -1) {
    let a = 0;
    this.shots = defs.map((d, i) => { const s = { ...d, id: i + 1, a, b: d.to }; a = d.to; return s; });
    // global lens-blur table from every key (same over crossfades as the old per-video DOF tables)
    let last = 12;
    for (const s of this.shots) s.keys.forEach((k, i) => {
      const glideKey = i > 0 && !k.cut;
      if (k.dof === undefined && !k.focus) return;
      last = k.dof ?? last;
      this.dof.push({ f: k.f, dur: glideKey ? k.dur ?? 24 : undefined, cInf: last, focus: k.focus });
    });
    this.dof.sort((x, y) => x.f - y.f);
  }
  shot(id: number) { return this.shots[id - 1]; }
  shotAt(f: number) { return this.shots.find((s) => f >= s.a && f < s.b) ?? this.shots[this.shots.length - 1]; }
  layersAt(f: number): { id: number; alpha: number }[] {
    for (const s of this.shots) {
      const x = s.xfade;
      if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
    }
    return [{ id: this.shotAt(f).id, alpha: 1 }];
  }
  /** the key in charge at frame f of shot id */
  keyAt(id: number, f: number) {
    const ks = this.shot(id).keys;
    let k = ks[0];
    for (const x of ks) if (f >= x.f) k = x;
    return k;
  }
  private run(keys: Key[], f: number) {
    let cur = full(keys[0].s(f));
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (f < k.f) break;
      cur = k.cut ? full(k.s(f)) : mixCam(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
    }
    return cur;
  }
  kickAt(t: number) {
    let a = 0;
    for (const [t0, g] of this.kicks) {
      const n = Math.floor((t - t0) * FPS + 1e-6);
      if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
    }
    return a;
  }
  camAt(id: number, f: number): Cam {
    const c = this.run(this.shot(id).keys, f), a = this.kickAt(f / FPS);
    if (!a) return c;
    const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
    const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
    const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
    return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
  }
  dofAt(f: number) {
    const D = this.dof;
    if (!D.length) return { cInf: 12, focus: undefined };
    let i = 0; while (i + 1 < D.length && f >= D[i + 1].f) i++;
    const d = D[i], p = D[Math.max(0, i - 1)];
    const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
    return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
  }
}
