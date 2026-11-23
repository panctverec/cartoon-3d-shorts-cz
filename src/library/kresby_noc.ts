// 2D drawings for "The 3 AM Wake-Up" (toon.ts pen: plum ink, painted crescents). Every function draws on its own
// canvas size (noted per function) and is pure in its arguments, so the card pool can cache by key.
import { Pen, INK, shade, mix } from "../videos/bridge/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const LIGHT = rad(-120);
const thick = Math.atan2(-Math.sin(LIGHT) + 0.8, -Math.cos(LIGHT));

/** ellipse points (clockwise on screen) */
const ellPts = (cx: number, cy: number, rx: number, ry: number, n = 64): P2[] =>
  Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as P2; });
/** egg: narrower top */
const eggPts = (cx: number, cy: number, rx: number, ry: number, egg = 0.12, n = 72): P2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, s = Math.sin(a);
    return [cx + rx * Math.cos(a) * (1 + egg * s), cy + ry * s] as P2;
  });

// ---------------- CORTISOL: the body's wake-up hormone, a cheerful orange bean with an energy tuft ----------------
export type CortPose = "stand" | "press" | "tap" | "shrug" | "wave" | "peek" | "cup";
export type CortFace = "grin" | "smug" | "proud" | "shrug";
/** 400 x 500 canvas, feet at y = 480. k = pose phase 0..1 (wave / tap / press) */
export const cortisol = (p: Pen, pose: CortPose, face: CortFace, k = 0, blink = 0) => {
  const BODY = "#f5a23c", cx = 200, cy = 285, rx = 112, ry = 135;
  const limb = mix(BODY, INK, 0.6);
  // legs
  for (const s of [-1, 1]) {
    p.stroke([[cx + s * 38, cy + 110], [cx + s * 46, 470]], 15, limb);
    p.stroke([[cx + s * 46, 472], [cx + s * 74, 474]], 20, INK);
  }
  // arms (behind the body only for "peek")
  const sh = (s: number): P2 => [cx + s * 98, cy + 10];
  const arm = (a: P2, e: P2, h: P2) => { p.stroke([a, e, h], 13, limb); p.dot(h[0], h[1], 15, INK); };
  const arms: [P2, P2, P2][] = [];
  if (pose === "shrug") for (const s of [-1, 1]) arms.push([sh(s), [cx + s * 160, cy - 10], [cx + s * 150, cy - 85]]);
  else if (pose === "wave") { arms.push([sh(-1), [cx - 140, cy + 60], [cx - 136, cy + 120]]); arms.push([sh(1), [cx + 165, cy - 40 + 10 * Math.sin(k * 6.28)], [cx + 178 + 26 * Math.sin(k * 6.28), cy - 130]]); }
  else if (pose === "press") { arms.push([sh(-1), [cx - 140, cy + 60], [cx - 136, cy + 120]]); arms.push([sh(1), [cx + 160, cy - 10], [cx + 196 + 10 * k, cy + 10 + 22 * k]]); }
  else if (pose === "tap") {
    // left wrist (with a watch) held across the belly, right finger tapping it
    arms.push([sh(-1), [cx - 130, cy + 70], [cx - 20, cy + 80]]);
    arms.push([sh(1), [cx + 130, cy + 60], [cx - 2 + 6 * Math.sin(k * 6.28 * 2), cy + 52 - 14 * Math.abs(Math.sin(k * 6.28 * 2))]]);
  } else if (pose === "cup") { arms.push([sh(-1), [cx - 140, cy + 60], [cx - 136, cy + 120]]); arms.push([sh(1), [cx + 150, cy + 20], [cx + 120, cy - 40]]); }
  else if (pose !== "peek") for (const s of [-1, 1]) arms.push([sh(s), [cx + s * 140, cy + 60], [cx + s * 136, cy + 120]]);
  // energy tuft: three flame licks on the crown
  // energy tuft: ONE curly flame lick on the crown (three spikes read as cat ears)
  {
    const bx = cx + 4, by = cy - ry + 30;
    const pts: P2[] = [[bx - 40, by], [bx - 46, by - 40], [bx - 30, by - 78], [bx - 2, by - 104], [bx + 30, by - 118],
      [bx + 18, by - 92], [bx + 34, by - 64], [bx + 40, by - 30], [bx + 36, by]];
    p.poly(pts, "#ffd166", 9);
    p.arc(bx - 2, by - 50, 14, 16, 160, 340, 6, "#f08a2c");
  }
  // body
  const bp = eggPts(cx, cy, rx, ry, 0.1);
  p.shadedFill(bp, BODY, shade(BODY, 0.72), LIGHT, rx);
  p.inkRing(bp, 12, thick);
  // belly spot
  p.ell(cx + 8, cy + 55, 52, 42, mix(BODY, "#ffffff", 0.35), 0);
  // face
  const ey = cy - 30, shut = blink >= 1;
  for (const s of [-1, 1]) {
    const x = cx + s * 36;
    if (face === "grin" || face === "proud" || shut) p.arc(x, ey + 6, 15, 11, 200, 340, 8);
    else p.ell(x, ey, 10, 14, INK, 0);
    // brows
    const bi = face === "smug" ? 4 : face === "shrug" ? -10 : -4, bo = face === "smug" ? -6 : face === "shrug" ? 4 : -8;
    p.stroke([[x - s * 14, ey - 32 + bi], [x + s * 14, ey - 32 + bo]], 8);
  }
  const my = cy + 16;
  if (face === "grin") { p.ell(cx, my, 34, 24, "#5a1e28", 0, 0, 180); p.ell(cx, my, 34, 24, null, 7, 0, 180); }
  else if (face === "proud") p.arc(cx, my - 4, 30, 14, 20, 160, 8);
  else if (face === "smug") p.arc(cx + 8, my - 6, 26, 12, 10, 150, 8);
  else { p.stroke([[cx - 20, my + 4], [cx - 6, my], [cx + 6, my + 6], [cx + 20, my]], 7); }
  // front arms
  for (const a of arms) arm(...a);
  if (pose === "tap") { const [hx, hy] = [cx - 20, cy + 80]; p.ell(hx + 6, hy - 6, 20, 17, "#f4f1ea", 6); p.stroke([[hx + 6, hy - 6], [hx + 6, hy - 18]], 4); p.stroke([[hx + 6, hy - 6], [hx + 15, hy - 6]], 4); }
  if (pose === "cup") { // tiny espresso cup in the raised hand
    const [hx, hy] = [cx + 120, cy - 40];
    p.poly([[hx - 26, hy - 44], [hx + 26, hy - 44], [hx + 20, hy - 6], [hx - 20, hy - 6]], "#ffffff", 7);
    p.arc(hx + 28, hy - 28, 12, 12, -80, 80, 6);
    p.ell(hx, hy - 44, 26, 7, "#6b3a22", 5);
  }
};

// ---------------- sleep letters ----------------
/** one "Z" on a 200 x 200 canvas */
export const fxZ = (p: Pen) => {
  const g = p.g;
  g.font = "900 170px 'Arial Black', 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round"; g.lineWidth = 22; g.strokeStyle = INK; g.strokeText("Z", 100, 108);
  g.fillStyle = "#eaf2ff"; g.fillText("Z", 100, 108);
};

// ---------------- heat wave ----------------
/** rising heat lines on a 400 x 400 canvas; t = time phase 0..1 */
export const fxHeat = (p: Pen, t: number) => {
  const cols = ["#ff5a3c", "#ff8a3c", "#ffb03c"];
  for (let i = 0; i < 3; i++) {
    const x0 = 110 + i * 90, pts: P2[] = [];
    for (let k = 0; k <= 16; k++) { const y = 370 - k * 21; pts.push([x0 + 22 * Math.sin(k * 0.8 + t * 6.28 + i * 1.7), y]); }
    p.line(pts, cols[i], 18);
  }
};

// ---------------- thought bubble with bedtime maths ----------------
const SUMS = ["7:00 - 3:00", "= 4 hours", "...maybe 3?"];
/** 700 x 560 canvas; shown = how many lines are written (0..3, fractional writes the next line in);
 *  erased = how many lines are wiped (0..3, wipes from the top) */
export const fxBubble = (p: Pen, shown: number, erased: number) => {
  const g = p.g;
  // trailing puffs (toward the lower left = toward her head)
  p.ell(70, 520, 22, 18, "#ffffff", 7); p.ell(125, 470, 34, 28, "#ffffff", 8);
  const lobes: [number, number, number][] = [[230, 200, 140], [380, 150, 150], [520, 200, 140], [560, 330, 110], [400, 380, 150], [240, 360, 120]];
  for (const [x, y, r] of lobes) p.ell(x, y, r, r * 0.82, "#ffffff", 0);
  // outline: draw lobes with ink first underneath would double; instead outline the union by stroking each lobe then refilling
  for (const [x, y, r] of lobes) p.ell(x, y, r + 5, r * 0.82 + 5, null, 10);
  for (const [x, y, r] of lobes) p.ell(x, y, r - 1, r * 0.82 - 1, "#ffffff", 0);
  g.font = "700 64px 'Comic Sans MS', 'Segoe Print', 'Segoe UI', sans-serif"; g.textAlign = "left"; g.textBaseline = "middle";
  SUMS.forEach((s, i) => {
    const a = Math.max(0, Math.min(1, shown - i)), e = Math.max(0, Math.min(1, erased - i));
    if (a <= 0) return;
    const y = 190 + i * 92, x = 175;
    const full = g.measureText(s).width;
    g.save(); g.beginPath(); g.rect(x - 10, y - 50, (full + 20) * a, 100); g.clip();
    g.fillStyle = i === 2 ? "#c0453a" : INK; g.fillText(s, x, y);
    g.restore();
    if (e > 0) { // eraser swipe: white band from the left
      g.fillStyle = "#ffffff"; g.fillRect(x - 12, y - 46, (full + 24) * e, 92);
    }
  });
};

// ---------------- sleep depth chart (hypnogram), floats in front of the wall ----------------
/** 900 x 600 canvas; u = 0..1 how far through the night the dot has travelled */
export const fxSleepChart = (p: Pen, u: number) => {
  const g = p.g;
  p.poly([[20, 20], [880, 20], [880, 580], [20, 580]], "#fbf6ea", 12);
  g.font = "800 46px 'Segoe UI', Arial, sans-serif"; g.fillStyle = INK; g.textBaseline = "middle";
  g.textAlign = "left"; g.fillText("light", 60, 120); g.fillText("deep", 60, 470);
  g.textAlign = "center"; g.font = "700 38px 'Segoe UI', Arial, sans-serif";
  for (const [x, s] of [[230, "11pm"], [470, "1am"], [710, "3am"]] as const) g.fillText(s, x, 545);
  // depth curve: deep dives early, shallow waves later (x 200..840 = 11 pm .. 5 am)
  const depth = (v: number) => { // 0 light .. 1 deep
    const dive = Math.max(0, 1 - v * 1.7);
    return Math.max(0, Math.min(1, (0.15 + 0.85 * dive) * (0.55 + 0.45 * Math.sin(v * Math.PI * 4.5 - 1.2) ** 2)));
  };
  const X = (v: number) => 200 + 640 * v, Y = (d: number) => 140 + 320 * d;
  const pts: P2[] = [];
  for (let i = 0; i <= 80 * u; i++) { const v = i / 80; pts.push([X(v), Y(depth(v))]); }
  if (pts.length > 1) p.line(pts, "#5b7fd1", 14);
  const v = u, dx = X(v), dy = Y(depth(v));
  p.ell(dx, dy, 22, 22, "#f5a23c", 8);
};

// ---------------- coffee aroma ----------------
/** wavy aroma ribbon with two beans on a 600 x 300 canvas (drawn left -> right), t = drift phase */
export const fxAroma = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const pts: P2[] = [];
    for (let k = 0; k <= 20; k++) { const x = 30 + k * 27; pts.push([x, 100 + i * 55 + 18 * Math.sin(k * 0.6 + t * 6.28 + i)]); }
    p.line(pts, ["#c79a6b", "#e0bf95", "#b07d4f"][i], 14);
  }
  for (const [x, y, r] of [[140, 60, 0.4], [430, 250, -0.6]] as const) {
    p.ell(x, y, 26, 18, "#6b3a22", 6, 0, 360, (r * 180) / Math.PI);
    p.arc(x, y, 14, 8, 200, 340, 4, "#3a1f12");
  }
};

// ---------------- breeze ----------------
/** cool curly breeze lines on a 600 x 300 canvas, t = drift phase */
export const fxBreeze = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const y = 70 + i * 80, x0 = 40 + ((t * 300 + i * 120) % 260), pts: P2[] = [];
    for (let k = 0; k <= 14; k++) pts.push([x0 + k * 20, y + 10 * Math.sin(k * 0.7 + i)]);
    const [ex, ey] = pts[pts.length - 1];
    for (let k = 1; k <= 10; k++) { const a = rad(-90 + k * 33); pts.push([ex + 24 * Math.cos(a) - 6, ey - 24 + 24 * Math.sin(a) + 24]); }
    p.line(pts, "#cfe9ff", 12);
  }
};

// ---------------- steam ----------------
/** soft steam puff on a 300 x 300 canvas, t 0..1 life */
export const fxSteam = (p: Pen, t: number) => {
  const a = Math.sin(Math.min(1, t) * Math.PI) * 0.85;
  for (let i = 0; i < 4; i++) {
    const r = (40 + 14 * i) * (0.6 + 0.6 * t);
    p.ell(150 + 30 * Math.sin(i * 2.1 + t * 4), 170 - i * 22 - 40 * t, r, r * 0.8, `rgba(255,255,255,${a.toFixed(3)})`, 0);
  }
};

// ---------------- ding ----------------
/** "DING!" stamp on a 500 x 300 canvas, t 0..1 */
export const fxDing = (p: Pen, t: number) => {
  const g = p.g, s = 0.7 + 0.5 * Math.min(1, t * 4) - 0.15 * Math.max(0, t - 0.25);
  g.save(); g.translate(250, 150); g.rotate(-0.12); g.scale(s, s);
  g.font = "900 150px 'Arial Black', 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round"; g.lineWidth = 26; g.strokeStyle = INK; g.strokeText("DING!", 0, 0);
  g.fillStyle = "#ffd84a"; g.fillText("DING!", 0, 0);
  g.restore();
};

// ---------------- clock face textures ----------------
/** digital alarm clock display, 512 x 256 */
export const clockFace = (g: CanvasRenderingContext2D, text: string, col = "#ff5a3c") => {
  g.fillStyle = "#1a1418"; g.fillRect(0, 0, 512, 256);
  g.font = "900 190px 'Consolas', 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = mix(col, "#1a1418", 0.82); g.fillText("8:88", 256, 136);
  g.shadowColor = col; g.shadowBlur = 28; g.fillStyle = col; g.fillText(text, 256, 136);
  g.shadowBlur = 0;
};
/** coffee machine display: "BREW" + time, 256 x 128 */
export const machineFace = (g: CanvasRenderingContext2D, text: string, on: boolean) => {
  g.fillStyle = "#16202a"; g.fillRect(0, 0, 256, 128);
  g.font = "800 30px 'Segoe UI', Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = on ? "#7dff9b" : "#2c4a36"; g.fillText("BREW", 128, 30);
  g.font = "900 70px 'Consolas', 'Courier New', monospace"; g.fillStyle = "#8fd8ff"; g.fillText(text, 128, 84);
};
/** phone screen: charging battery, 256 x 512 */
export const phoneFace = (g: CanvasRenderingContext2D) => {
  g.fillStyle = "#0e1622"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#1f2b3c"; g.fillRect(70, 170, 116, 200); g.fillRect(105, 155, 46, 18);
  g.fillStyle = "#59e07a"; g.fillRect(80, 260, 96, 100);
  g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(140, 200); g.lineTo(108, 285); g.lineTo(130, 285); g.lineTo(116, 345); g.lineTo(152, 255); g.lineTo(130, 255); g.closePath(); g.fill();
};
