// Knihovna kreseb (viz KNIHOVNA.md): SCALE, FAT CELL, MUSCLE, the dress, the mirror's face,
// jeans, body-scan card, suitcase gag, kilo comparison, fat-burning flame, calendar, toast, dumbbell.
// toon.ts pen (plum ink, painted crescents). Canvas sizes are noted per function.
import { Pen, INK, shade, mix } from "../videos/bridge/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const LIGHT = rad(-120);
const THICK = Math.atan2(-Math.sin(LIGHT) + 0.8, -Math.cos(LIGHT));
const font = (g: CanvasRenderingContext2D, w: number, px: number) => { g.font = `${w} ${px}px 'Montserrat', 'Segoe UI', Arial, sans-serif`; };
const label = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col = INK, w = 900, align: CanvasTextAlign = "center") => {
  font(g, w, px); g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};
const rr = (x0: number, y0: number, x1: number, y1: number, r: number): P2[] => {
  const pts: P2[] = [], c: [number, number, number][] = [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= 6; i++) { const a = rad(a0 + (i * 90) / 6); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
};
const eyes = (p: Pen, cx: number, cy: number, gap: number, kind: "dot" | "happy" | "shut" | "side", r = 10) => {
  for (const s of [-1, 1]) {
    const x = cx + s * gap;
    if (kind === "happy" || kind === "shut") p.arc(x, cy + 4, r * 1.5, r, 200, 340, r * 0.75);
    else p.ell(x + (kind === "side" ? 5 : 0), cy, r, r * 1.4, INK, 0);
  }
};
const limbs = (p: Pen, col: string, arms: [P2, P2, P2][], w = 12) => { for (const a of arms) { p.stroke(a, w, col); p.dot(a[2][0], a[2][1], w * 1.15, INK); } };

// ---------------- SCALE: bathroom scale with the display as its face ----------------
/** 500 x 420 canvas, feet at y = 410. pose "stand" | "shrug" | "innocent" */
export const scaleChar = (p: Pen, pose: "stand" | "shrug" | "innocent", num = "64.0") => {
  const BODY = "#e9eef2";
  const body = rr(80, 140, 420, 390, 40);
  p.shadedFill(body, BODY, shade(BODY, 0.78), LIGHT, 170);
  p.inkRing(body, 11, THICK);
  p.poly(rr(150, 170, 350, 250, 16), "#1c2830", 7);
  label(p.g, num, 250, 212, 62, "#8fe3ff", 900);
  eyes(p, 250, 300, 50, pose === "innocent" ? "happy" : "dot", 10);
  if (pose === "innocent") p.arc(250, 338, 22, 10, 20, 160, 7); else p.stroke([[226, 342], [274, 338]], 7);
  const limb = mix(BODY, INK, 0.65);
  if (pose === "shrug") limbs(p, limb, [[[90, 260], [30, 230], [40, 160]], [[410, 260], [470, 230], [460, 160]]]);
  else limbs(p, limb, [[[90, 270], [50, 320], [55, 370]], [[410, 270], [450, 320], [445, 370]]]);
};

// ---------------- FAT CELL: soft yellow puff, sleepy-happy ----------------
/** 400 x 360 canvas, bottom at y = 350. squish 0..1 (settling down) */
export const fatCell = (p: Pen, squish: number, face: "cozy" | "smug") => {
  const Y = "#ffd77a", cx = 200, cy = 220 + 30 * squish, rx = 150 + 25 * squish, ry = 120 - 25 * squish;
  const pts: P2[] = Array.from({ length: 72 }, (_, i) => { const a = (i / 72) * Math.PI * 2, b = 1 + 0.05 * Math.sin(a * 6); return [cx + rx * Math.cos(a) * b, cy + ry * Math.sin(a) * b] as P2; });
  p.shadedFill(pts, Y, shade(Y, 0.78), LIGHT, rx);
  p.inkRing(pts, 11, THICK);
  for (const [x, y, r] of [[150, 190, 22], [250, 250, 16], [190, 270, 12]]) p.ell(x, y + 30 * squish, r, r, mix(Y, "#ffffff", 0.5), 0);
  eyes(p, cx, cy - 10, 40, face === "cozy" ? "shut" : "dot", 10);
  if (face === "cozy") p.arc(cx, cy + 22, 20, 10, 20, 160, 7); else p.arc(cx + 8, cy + 20, 22, 10, 10, 150, 7);
};

// ---------------- MUSCLE: red-pink bicep bean, flexing ----------------
/** 420 x 520 canvas, feet at y = 505. flex 0..1, face "grin" | "proud" */
export const muscle = (p: Pen, flex: number, face: "grin" | "proud" | "sad") => {
  const R = "#e8686e", cx = 210, cy = 280;
  const limb = mix(R, INK, 0.6);
  for (const s of [-1, 1]) { p.stroke([[cx + s * 40, cy + 120], [cx + s * 46, 490]], 15, limb); p.stroke([[cx + s * 46, 492], [cx + s * 74, 494]], 20, INK); }
  const pts: P2[] = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2, bulge = 1 + (0.18 + 0.18 * flex) * Math.max(0, -Math.sin(a)) * Math.max(0, Math.cos(a - 0.6));
    return [cx + 120 * Math.cos(a) * bulge, cy + 150 * Math.sin(a) * (Math.sin(a) < 0 ? bulge : 1)] as P2;
  });
  p.shadedFill(pts, R, shade(R, 0.72), LIGHT, 140);
  p.inkRing(pts, 11, THICK);
  p.stroke([[cx - 50, cy - 70], [cx + 10, cy - 100], [cx + 60, cy - 60]], 6, mix(R, "#ffffff", 0.45)); // fibre highlight
  eyes(p, cx, cy - 20, 36, face === "sad" ? "dot" : "happy", 11);
  if (face === "sad") p.arc(cx, cy + 40, 20, 10, 200, 340, 7);
  else { p.ell(cx, cy + 20, 30, 20, "#5a1e28", 0, 0, 180); p.ell(cx, cy + 20, 30, 20, null, 7, 0, 180); }
  const up = flex;
  limbs(p, limb, [
    [[cx - 110, cy + 10], [cx - 180, cy - 20 - 40 * up], [cx - 140, cy - 90 - 30 * up]],
    [[cx + 110, cy + 10], [cx + 180, cy - 20 - 40 * up], [cx + 140, cy - 90 - 30 * up]],
  ], 14);
};

// ---------------- dress on a hanger, arms folded ("protest") ----------------
/** 360 x 520 canvas */
export const dressChar = (p: Pen) => {
  const C = "#7b5ac9";
  p.stroke([[180, 20], [180, 50]], 6); p.arc(180, 20, 16, 14, 180, 400, 6);
  p.stroke([[90, 80], [180, 50], [270, 80]], 9, "#a8724a");
  const pts: P2[] = [[120, 80], [240, 80], [262, 220], [330, 500], [30, 500], [98, 220]];
  p.shadedFill(pts, C, shade(C, 0.72), LIGHT, 200); p.poly(pts, null, 10);
  eyes(p, 180, 170, 34, "dot", 9);
  p.stroke([[146, 140], [170, 150]], 7); p.stroke([[214, 140], [190, 150]], 7); // cross brows
  p.arc(180, 215, 18, 8, 200, 340, 7);
  // folded arms
  p.line([[110, 260], [180, 290], [250, 260]], mix(C, INK, 0.4), 22);
  p.line([[250, 285], [180, 265], [110, 285]], mix(C, INK, 0.3), 22);
};

// ---------------- the mirror's face: hands over eyes / peeking smile ----------------
/** 400 x 400 canvas, mood "cover" | "peek" */
export const mirrorFace = (p: Pen, mood: "cover" | "peek") => {
  if (mood === "cover") {
    p.arc(200, 280, 40, 18, 200, 340, 9);
    for (const s of [-1, 1]) { p.ell(200 + s * 70, 170, 62, 50, "#ffe2c2", 9); for (let k = 0; k < 3; k++) p.stroke([[200 + s * (40 + k * 22), 140], [200 + s * (40 + k * 22), 190]], 5); }
  } else {
    eyes(p, 200, 170, 60, "happy", 14);
    p.ell(200, 260, 44, 30, "#5a1e28", 0, 0, 180); p.ell(200, 260, 44, 30, null, 9, 0, 180);
  }
};

// ---------------- jeans waist close-up ----------------
/** 700 x 560 canvas: gap 0 (buttoned) .. 1 (won't close); pop = button flying (0 none .. 1 gone) */
export const fxJeans = (p: Pen, gap: number, pop: number, strain: number) => {
  const D = "#3f6fb5", g = p.g, sh = 70 * gap;
  for (const s of [-1, 1]) {
    const x0 = 350 + s * (6 + sh), pts: P2[] = s < 0 ? [[x0, 60], [40, 60], [40, 540], [x0, 540]] : [[x0, 60], [660, 60], [660, 540], [x0, 540]];
    p.shadedFill(pts, D, shade(D, 0.75), LIGHT, 300); p.poly(pts, null, 10);
    p.band([[s < 0 ? 40 : x0, 120], [s < 0 ? x0 : 660, 120]], shade(D, 0.85), 10, 3);
    for (let k = 0; k < 12; k++) { const y = 70 + k * 40; g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(s < 0 ? 60 : x0 + 10, y, s < 0 ? x0 - 70 : 600 - x0 - 10, 3); }
  }
  if (gap > 0.05) p.poly([[350 - sh + 4, 160], [350 + sh - 4, 160], [350, 540]], "#ffe2c2", 0); // skin peeking in the V
  p.stroke([[350 - sh, 160], [350, 540], [350 + sh, 160]], 6, "#e8c45a");
  // buttonhole (left) + button (right)
  p.ell(350 - sh - 40, 110, 22, 9, "#1d2a4a", 5);
  if (pop < 1) {
    const bx = 350 + sh + 40 + 260 * pop, by = 110 - 300 * pop + 400 * pop * pop;
    p.ell(bx, by, 30, 30, "#c9a35a", 7); p.ell(bx, by, 14, 14, null, 5);
  }
  if (strain > 0) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
    const y = 80 + k * 30, x = 350 + s * (sh + 120 + k * 10);
    p.stroke([[x, y], [x + s * 40, y - 12]], 6);
  }
};

// ---------------- body-scan card ----------------
const person = (p: Pen, cx: number, base: number, wide: number, col: string) => {
  p.ell(cx, base - 330, 48, 52, col, 8);
  p.poly([[cx - 60 - wide, base - 270], [cx + 60 + wide, base - 270], [cx + 70 + wide * 1.4, base - 90], [cx - 70 - wide * 1.4, base - 90]], col, 8);
  for (const s of [-1, 1]) p.stroke([[cx + s * 30, base - 90], [cx + s * 34, base]], 22, col);
};
/** 960 x 820 canvas: fat (0..1 doubles the fat bar), mus (0..1 shrinks the muscle bar), showScale */
export const fxScan = (p: Pen, fat: number, mus: number, showScale: boolean) => {
  const g = p.g;
  p.poly([[20, 20], [940, 20], [940, 800], [20, 800]], "#fbf6ea", 12);
  label(g, "body scan", 480, 80, 46, INK, 900);
  person(p, 250, 690, 10 + 25 * fat, "#bcd2ef");
  // bars
  const bar = (x: number, h: number, col: string, txt: string) => {
    p.poly([[x - 60, 640], [x + 60, 640], [x + 60, 640 - h], [x - 60, 640 - h]], col, 9);
    label(g, txt, x, 690, 38, INK, 800);
  };
  bar(560, 160 + 160 * fat, "#ffd77a", "fat");
  bar(760, 300 - 90 * mus, "#e8686e", "muscle");
  label(g, fat > 0.5 ? "x2 faster" : "", 560, 640 - (160 + 160 * fat) - 40, 40, "#c0453a", 900);
  if (showScale) { p.poly(rr(140, 715, 360, 785, 14), "#1c2830", 7); label(g, "64.0 kg", 250, 751, 42, "#8fe3ff", 900); }
};

// ---------------- suitcase gag ----------------
/** 900 x 700 canvas: out = dumbbells taken out 0..1, inn = pillows packed 0..1, zip = zip attempt 0..1 */
export const fxSuitcase = (p: Pen, out: number, inn: number, zip: number) => {
  const g = p.g;
  // case
  p.poly(rr(120, 300, 780, 640, 30), "#4f8fbf", 11);
  p.poly(rr(150, 330, 750, 610, 20), "#2f5f85", 0);
  // dumbbells in the case, lifted out
  for (let k = 0; k < 3; k++) {
    const y = 470 - 360 * out + k * 40, x = 250 + k * 200;
    if (out < 0.98) { p.band([[x - 70, y], [x + 70, y]], "#8d949c", 14, 4); for (const s of [-1, 1]) p.poly(rr(x + s * 70 - 25, y - 38, x + s * 70 + 25, y + 38, 8), "#3d414c", 6); }
  }
  // pillows dropping in (puffy, overflowing)
  for (let k = 0; k < 3; k++) {
    const t = Math.max(0, Math.min(1, inn * 3 - k)), y = 80 + 340 * t, x = 270 + k * 180;
    if (t > 0) { p.ell(x, y, 130, 90, "#f6f1e8", 9); p.stroke([[x - 60, y], [x + 60, y]], 5, "#d8cfc0"); }
  }
  // lid + zipper trying to close
  if (zip > 0) {
    const a = rad(-80 + 50 * Math.min(1, zip * 1.4));
    const hx = 780, hy = 300, L = 660;
    p.poly([[hx, hy], [hx - L * Math.cos(a), hy + L * Math.sin(a)], [hx - L * Math.cos(a), hy + L * Math.sin(a) - 30], [hx, hy - 30]], "#5c9fd0", 10);
  }
  // the scale under it: same number
  p.poly(rr(330, 655, 570, 695, 10), "#1c2830", 6); label(g, "64.0 kg", 450, 676, 30, "#8fe3ff", 900);
};

// ---------------- 1 kg muscle vs 1 kg fat ----------------
/** 900 x 600 canvas: k 0..1 reveal of the second block */
export const fxKilos = (p: Pen, k: number) => {
  const g = p.g;
  p.poly([[20, 20], [880, 20], [880, 580], [20, 580]], "#fbf6ea", 12);
  p.poly(rr(130, 300, 330, 440, 18), "#e8686e", 9); label(g, "1 kg", 230, 370, 52, "#ffffff", 900); label(g, "muscle", 230, 490, 40, INK, 800);
  if (k > 0) {
    const s = 0.6 + 0.4 * k, w = 270 * s, h = 230 * s, cx = 640, cy = 370;
    p.ell(cx, cy, w / 2 * 1.05, h / 2, "#ffd77a", 9); label(g, "1 kg", cx, cy, 52, INK, 900);
    label(g, "fat", cx, 520, 40, INK, 800);
  }
  label(g, "same weight, different space", 450, 90, 40, INK, 800);
};

// ---------------- fat-burning flame (shrinks by a third) ----------------
/** 500 x 640 canvas: size 1 .. 0.68 */
export const fxFlame = (p: Pen, size: number) => {
  const g = p.g, cx = 250, base = 520, h = 400 * size, w = 170 * size;
  const outer: P2[] = [[cx - w, base], [cx - w * 1.05, base - h * 0.45], [cx - w * 0.4, base - h * 0.75], [cx - w * 0.15, base - h], [cx + w * 0.3, base - h * 0.7], [cx + w * 0.7, base - h * 0.85], [cx + w * 1.05, base - h * 0.4], [cx + w, base]];
  p.poly(outer, "#ff8a3c", 10);
  p.poly(outer.map(([x, y]) => [cx + (x - cx) * 0.55, base + (y - base) * 0.6] as P2), "#ffd166", 0);
  label(g, "fat burned", 250, 590, 40, INK, 900);
  if (size < 0.9) label(g, "-1/3", 410, 160, 52, "#c0453a", 900);
};

// ---------------- calendar: two days ticked ----------------
/** 700 x 560 canvas: ticks 0..2 */
export const fxCalendar = (p: Pen, ticks: number) => {
  const g = p.g, days = ["M", "T", "W", "T", "F", "S", "S"];
  p.poly(rr(30, 40, 670, 520, 24), "#ffffff", 11);
  p.poly(rr(30, 40, 670, 140, 24).map(([x, y]) => [x, Math.min(y, 140)] as P2), "#e07a5f", 0);
  label(g, "this week", 350, 92, 44, "#ffffff", 900);
  days.forEach((d, i) => {
    const x = 85 + i * 88, y = 320;
    p.poly(rr(x - 36, y - 60, x + 36, y + 60, 12), "#f4efe6", 6);
    label(g, d, x, y - 30, 34, INK, 800);
    const k = i === 1 ? Math.min(1, ticks) : i === 3 ? Math.max(0, Math.min(1, ticks - 1)) : 0;
    if (k > 0) p.stroke([[x - 20, y + 20], [x - 4, y + 38], [x - 4 + 30 * k, y + 38 - 46 * k]], 10, "#2f8a4f");
  });
  label(g, "strength x2", 350, 460, 40, INK, 800);
};

// ---------------- small props ----------------
/** toast slice on a 200 x 200 canvas */
export const fxToast = (p: Pen) => { p.poly(rr(30, 40, 170, 180, 30), "#e9b46e", 9); p.poly(rr(50, 62, 150, 162, 20), "#f6dcae", 0); };
/** dumbbell on a 300 x 140 canvas */
export const fxDumbbell = (p: Pen) => {
  p.band([[60, 70], [240, 70]], "#8d949c", 14, 4);
  for (const x of [50, 250]) p.poly(rr(x - 24, 22, x + 24, 118, 8), "#3d414c", 6);
};
/** thumbs-up sparkle on a 200 x 200 canvas */
export const fxSpark = (p: Pen, t: number) => {
  const s = 0.6 + 0.4 * Math.sin(t * Math.PI), g = p.g;
  g.save(); g.translate(100, 100); g.scale(s, s); g.fillStyle = "#ffd166"; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, r = i % 2 ? 26 : 80; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath(); g.stroke(); g.fill(); g.restore();
};
/** scale display texture 512 x 256 */
export const scaleDisplay = (g: CanvasRenderingContext2D, text: string) => {
  g.fillStyle = "#1c2830"; g.fillRect(0, 0, 512, 256);
  font(g, 900, 150); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#8fe3ff"; g.fillText(text, 256, 132);
};
