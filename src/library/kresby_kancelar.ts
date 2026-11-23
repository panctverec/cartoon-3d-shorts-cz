// Knihovna kreseb (viz KNIHOVNA.md): BRAIN, ESTROGEN, the door's face, props and info cards.
// Same toon.ts pen as the cast (plum ink, painted crescents). Canvas sizes are noted per function.
import { Pen, INK, shade, mix } from "../videos/bridge/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const LIGHT = rad(-120);
const THICK = Math.atan2(-Math.sin(LIGHT) + 0.8, -Math.cos(LIGHT));
const font = (g: CanvasRenderingContext2D, w: number, px: number) => { g.font = `${w} ${px}px 'Montserrat', 'Segoe UI', Arial, sans-serif`; };
const label = (g: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, col = INK, w = 900, align: CanvasTextAlign = "center") => {
  font(g, w, px); g.textAlign = align; g.textBaseline = "middle"; g.fillStyle = col; g.fillText(s, x, y);
};

// ---------------- BRAIN: pink, wavy outline, round glasses ----------------
export type BrainPose = "stand" | "shrug" | "lift" | "desk" | "point" | "ride";
export type BrainFace = "smile" | "worried" | "grin" | "shrug" | "dizzy" | "proud";
/** 500 x 500 canvas, feet at y = 485 (no legs for "desk"/"ride": the body sits lower). k = pose phase 0..1, grow = scale */
export const brain = (p: Pen, pose: BrainPose, face: BrainFace, k = 0, blink = 0) => {
  const PINK = "#f59cb4", cx = 250, cy = pose === "desk" || pose === "ride" ? 300 : 250, rx = 150, ry = 118;
  const limb = mix(PINK, INK, 0.6);
  if (pose !== "desk" && pose !== "ride") for (const s of [-1, 1]) {
    p.stroke([[cx + s * 45, cy + 100], [cx + s * 52, 470]], 15, limb);
    p.stroke([[cx + s * 52, 472], [cx + s * 80, 474]], 20, INK);
  }
  // lobed outline (cloud of bumps)
  const pts: P2[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2, bump = 1 + 0.07 * Math.abs(Math.sin(a * 5)) - (Math.sin(a) > 0.6 ? 0.06 : 0);
    pts.push([cx + rx * Math.cos(a) * bump, cy + ry * Math.sin(a) * bump]);
  }
  // arms
  const sh = (s: number): P2 => [cx + s * 128, cy + 30];
  const arms: [P2, P2, P2][] = [];
  if (pose === "shrug") for (const s of [-1, 1]) arms.push([sh(s), [cx + s * 205, cy + 10], [cx + s * 195, cy - 60]]);
  else if (pose === "lift") { const up = Math.sin(k * Math.PI * 2) * 0.5 + 0.5; for (const s of [-1, 1]) arms.push([sh(s), [cx + s * 200, cy + 20 - 40 * up], [cx + s * 175, cy - 70 - 60 * up]]); }
  else if (pose === "point") { arms.push([sh(-1), [cx - 190, cy + 70], [cx - 180, cy + 130]]); arms.push([sh(1), [cx + 200, cy - 10], [cx + 250, cy - 50]]); }
  else for (const s of [-1, 1]) arms.push([sh(s), [cx + s * 185, cy + 80], [cx + s * 178, cy + 135]]);
  p.shadedFill(pts, PINK, shade(PINK, 0.75), LIGHT, rx);
  p.inkRing(pts, 12, THICK);
  // folds
  for (const [a, b, c] of [[[150, 190], [200, 160], [240, 200]], [[280, 170], [330, 150], [360, 190]], [[130, 290], [170, 320], [150, 350]], [[360, 290], [330, 330], [370, 350]]] as [P2, P2, P2][])
    p.stroke([[a[0], a[1] + cy - 250], [b[0], b[1] + cy - 250], [c[0], c[1] + cy - 250]], 7, mix(PINK, INK, 0.45));
  // face: glasses + eyes
  const ey = cy + 10;
  for (const s of [-1, 1]) {
    const x = cx + s * 48;
    if (face === "dizzy") { const sp: P2[] = []; for (let t = 1; t < 14; t++) sp.push([x + Math.cos(t) * t * 1.3, ey + Math.sin(t) * t * 1.3]); p.stroke(sp, 5); }
    else if (blink >= 1 || face === "grin" || face === "proud") p.arc(x, ey + 4, 14, 10, 200, 340, 7);
    else p.ell(x, ey, 9, 13, INK, 0);
    p.ell(x, ey, 34, 30, null, 7);
    const bi = face === "worried" || face === "dizzy" ? -10 : face === "shrug" ? -12 : -2, bo = face === "worried" ? 6 : face === "shrug" ? 2 : -6;
    p.stroke([[x - s * 18, ey - 46 + bi], [x + s * 18, ey - 46 + bo]], 8);
  }
  p.stroke([[cx - 14, ey - 4], [cx + 14, ey - 4]], 6);
  const my = cy + 62;
  if (face === "grin") { p.ell(cx, my, 30, 20, "#5a1e28", 0, 0, 180); p.ell(cx, my, 30, 20, null, 7, 0, 180); }
  else if (face === "worried" || face === "dizzy") p.stroke([[cx - 22, my + 6], [cx - 8, my], [cx + 8, my + 6], [cx + 22, my]], 7);
  else if (face === "shrug") p.stroke([[cx - 20, my + 2], [cx + 20, my - 4]], 7);
  else p.arc(cx, my - 6, 26, 14, 20, 160, 7);
  for (const a of arms) { p.stroke(a, 13, limb); p.dot(a[2][0], a[2][1], 15, INK); }
  if (pose === "lift") { // dumbbell over the head
    const up = Math.sin(k * Math.PI * 2) * 0.5 + 0.5, y = cy - 80 - 60 * up;
    p.band([[cx - 190, y], [cx + 190, y]], "#8d949c", 10, 3);
    for (const s of [-1, 1]) p.poly([[cx + s * 160, y - 36], [cx + s * 205, y - 36], [cx + s * 205, y + 36], [cx + s * 160, y + 36]], "#3d414c", 6);
  }
};

// ---------------- ESTROGEN: a purple spring with a round head, bouncing ----------------
/** 400 x 640 canvas, base at y = 620. squash 0 (stretched up) .. 1 (squashed down) */
export const estrogen = (p: Pen, squash: number, face: "grin" | "whee", blink = 0) => {
  const PUR = "#a77be0", cx = 200, base = 620, h = 300 - 170 * squash, top = base - h;
  // spring coils
  const coils = 6;
  for (let i = 0; i < coils; i++) {
    const y = base - (i + 0.5) * (h / coils);
    p.ell(cx, y, 70 + 10 * squash, 14 + 6 * (1 - squash), null, 0);
    p.arc(cx, y, 70 + 10 * squash, 16, 0, 180, 16, INK);
    p.arc(cx, y, 70 + 10 * squash, 16, 0, 180, 9, mix(PUR, "#ffffff", 0.2));
  }
  // head
  const hy = top - 110, R = 110;
  const pts: P2[] = Array.from({ length: 64 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return [cx + R * Math.cos(a), hy + R * 0.95 * Math.sin(a)] as P2; });
  p.shadedFill(pts, PUR, shade(PUR, 0.72), LIGHT, R);
  p.inkRing(pts, 11, THICK);
  // little curl on top (hormone squiggle)
  p.line([[cx - 10, hy - R + 6], [cx - 30, hy - R - 30], [cx + 5, hy - R - 52], [cx + 30, hy - R - 30]], "#d9b8ff", 12);
  for (const s of [-1, 1]) {
    const x = cx + s * 36, ey = hy - 8;
    if (blink >= 1 || face === "whee") p.arc(x, ey + 4, 15, 11, 200, 340, 8); else p.ell(x, ey, 10, 14, INK, 0);
    p.stroke([[x - s * 15, ey - 34], [x + s * 15, ey - 40]], 8);
  }
  if (face === "whee") p.ell(cx, hy + 42, 22, 26, "#5a1e28", 7);
  else { p.ell(cx, hy + 38, 32, 22, "#5a1e28", 0, 0, 180); p.ell(cx, hy + 38, 32, 22, null, 7, 0, 180); }
  // arms up (wheee)
  const limb = mix(PUR, INK, 0.6);
  for (const s of [-1, 1]) { p.stroke([[cx + s * 95, hy + 30], [cx + s * 150, hy - 10 - 30 * (1 - squash)], [cx + s * 165, hy - 70 - 40 * (1 - squash)]], 13, limb); p.dot(cx + s * 165, hy - 70 - 40 * (1 - squash), 14, INK); }
};

// ---------------- door face (overlay on the door) ----------------
/** 400 x 260 canvas: eyes + mouth; mood "smirk" | "shrug" */
export const doorFace = (p: Pen, mood: "smirk" | "shrug" | "wink") => {
  for (const s of [-1, 1]) {
    const x = 200 + s * 70, y = 100;
    if (mood === "wink" && s > 0) p.arc(x, y + 6, 20, 12, 200, 340, 10); else p.ell(x, y, 16, 22, INK, 0);
    p.stroke([[x - s * 26, y - 48 + (mood === "shrug" ? -10 : 0)], [x + s * 26, y - 56 + (mood === "smirk" && s > 0 ? -12 : 0)]], 11);
  }
  if (mood === "shrug") p.stroke([[150, 200], [250, 192]], 11);
  else p.arc(214, 178, 52, 24, 15, 150, 11);
};

// ---------------- small props ----------------
/** "?" pop on a 200 x 260 canvas */
export const fxQuestion = (p: Pen) => {
  const g = p.g; font(g, 900, 230); g.textAlign = "center"; g.textBaseline = "middle";
  g.lineJoin = "round"; g.lineWidth = 26; g.strokeStyle = INK; g.strokeText("?", 100, 140); g.fillStyle = "#ffd166"; g.fillText("?", 100, 140);
};
/** sticky note on a 260 x 260 canvas */
export const fxSticky = (p: Pen, text = "!!!") => {
  p.poly([[20, 30], [240, 18], [246, 236], [26, 244]], "#ffe066", 9);
  p.poly([[20, 30], [240, 18], [241, 60], [21, 70]], "#ffd43b", 0);
  label(p.g, text, 133, 140, 92, "#c0453a");
};
/** coffee mug on a 200 x 200 canvas */
export const fxMug = (p: Pen) => {
  p.poly([[40, 50], [150, 50], [142, 180], [48, 180]], "#4f8fbf", 9);
  p.arc(152, 112, 30, 34, -80, 80, 12);
  p.ell(95, 50, 55, 12, "#6b3a22", 7);
};
/** phone in hand on a 120 x 200 canvas */
export const fxPhone = (p: Pen) => { p.poly([[14, 10], [106, 10], [106, 190], [14, 190]], "#2a2328", 8); p.poly([[24, 24], [96, 24], [96, 170], [24, 170]], "#7fb3e6", 0); };
/** keys on a 260 x 200 canvas */
export const fxKeys = (p: Pen) => {
  p.ell(80, 70, 50, 50, null, 14, 0, 360); p.ell(80, 70, 50, 50, null, 0);
  p.arc(80, 70, 50, 50, 0, 360, 8, "#e8c45a");
  for (const [x, y, r] of [[150, 110, 0.5], [130, 140, 1.1]] as const) {
    const g = p.g; g.save(); g.translate(x, y); g.rotate(r);
    p.poly([[0, -14], [90, -10], [90, 10], [0, 14]], "#e8c45a", 6);
    p.ell(-10, 0, 26, 26, "#e8c45a", 6); p.poly([[60, 10], [70, 26], [80, 10]], "#e8c45a", 5);
    g.restore();
  }
};
/** thought bubble with up to 3 lines; shown 0..n (fractional = writing in). 700 x 560 canvas */
export const fxThought = (p: Pen, lines: string[], shown: number, col = INK) => {
  const g = p.g;
  p.ell(70, 520, 22, 18, "#ffffff", 7); p.ell(125, 470, 34, 28, "#ffffff", 8);
  const lobes: [number, number, number][] = [[230, 200, 140], [380, 150, 150], [520, 200, 140], [560, 330, 110], [400, 380, 150], [240, 360, 120]];
  for (const [x, y, r] of lobes) p.ell(x, y, r + 5, r * 0.82 + 5, null, 10);
  for (const [x, y, r] of lobes) p.ell(x, y, r - 1, r * 0.82 - 1, "#ffffff", 0);
  font(g, 800, 62); g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((s, i) => {
    const a = Math.max(0, Math.min(1, shown - i)); if (a <= 0) return;
    const y = 270 - ((lines.length - 1) * 46) + i * 92, w = g.measureText(s).width;
    g.save(); g.beginPath(); g.rect(380 - w / 2 - 10, y - 50, (w + 20) * a, 100); g.clip(); g.fillStyle = col; g.fillText(s, 380, y); g.restore();
  });
};

// ---------------- info cards ----------------
/** bar chart, 900 x 760: forgetfulness before vs during perimenopause. grow 0..1 (second bar), pop of the first */
export const fxBars = (p: Pen, a: number, b: number) => {
  const g = p.g;
  p.poly([[20, 20], [880, 20], [880, 740], [20, 740]], "#fbf6ea", 12);
  label(g, "women who report forgetfulness", 450, 82, 40, INK, 800);
  const base = 610, H = 400;
  const bar = (x: number, v: number, k: number, col: string, top: string, bottom: string) => {
    const h = H * v * k;
    if (h > 2) p.poly([[x - 110, base], [x + 110, base], [x + 110, base - h], [x - 110, base - h]], col, 10);
    if (k > 0.05) label(g, top, x, base - h - 50, 76, INK, 900);
    label(g, bottom, x, base + 62, 40, INK, 800);
  };
  bar(270, 0.31 / 0.44, a, "#8fb3e6", `${Math.round(31 * a)}%`, "before");
  bar(630, 1, b, "#e07a5f", `${Math.round(44 * b)}%`, "during");
  p.stroke([[110, base], [790, base]], 10);
};
/** learning-score line through the menopause stages, 900 x 700. u = how much of the line is drawn */
export const fxLearning = (p: Pen, u: number) => {
  const g = p.g;
  p.poly([[20, 20], [880, 20], [880, 680], [20, 680]], "#fbf6ea", 12);
  label(g, "learning & memory", 450, 80, 46, INK, 800);
  const X = (v: number) => 120 + 660 * v, Y = (v: number) => 270 + 170 * Math.exp(-(((v - 0.5) / 0.17) ** 2));
  for (const [v, s] of [[0.12, "before"], [0.5, "peri"], [0.88, "after"]] as const) label(g, s, X(v), 610, 40, INK, 800);
  p.stroke([[100, 550], [800, 550]], 8);
  const pts: P2[] = [];
  for (let i = 0; i <= 90 * u; i++) { const v = i / 90; pts.push([X(v), Y(v)]); }
  if (pts.length > 1) p.line(pts, "#5b7fd1", 16);
  const [dx, dy] = pts[pts.length - 1] ?? [X(0), Y(0)];
  p.ell(dx, dy, 24, 24, "#f5a23c", 8);
  if (u > 0.95) { label(g, "back!", X(0.92), Y(0.92) - 70, 56, "#2f8a4f", 900); }
};
/** book: a chapter closing and a new one opening. 600 x 400, k 0..1 (page flip) */
export const fxBook = (p: Pen, k: number) => {
  const g = p.g;
  p.poly([[40, 330], [300, 360], [560, 330], [560, 70], [300, 100], [40, 70]], "#7b5ac9", 10);
  p.poly([[60, 320], [300, 345], [300, 95], [60, 70]], "#fbf6ea", 7);
  p.poly([[300, 345], [540, 320], [540, 70], [300, 95]], "#fbf6ea", 7);
  label(g, "ch. 1", 180, 200, 44, INK, 800); label(g, "ch. 2", 420, 200, 44, INK, 800);
  // turning page
  const a = Math.PI * k, w = 240 * Math.cos(a);
  p.poly([[300, 345], [300 + w, 330 - 20 * Math.sin(a)], [300 + w, 80 - 20 * Math.sin(a)], [300, 95]], k < 0.5 ? "#fbf6ea" : "#efe6d6", 7);
};
/** fog: soft grey puffs, 700 x 500, density 0..1 */
export const fxFog = (p: Pen, d: number, t: number) => {
  for (let i = 0; i < 9; i++) {
    const x = 100 + ((i * 83 + t * 40) % 520), y = 140 + (i % 3) * 120, r = 90 + (i % 4) * 25;
    p.ell(x, y, r, r * 0.7, `rgba(205,210,225,${(0.75 * d).toFixed(3)})`, 0);
  }
};
/** laptop screen: browser with an empty new tab and a cursor (cursor on/off), 512 x 320 */
export const laptopFace = (g: CanvasRenderingContext2D, cursor: boolean) => {
  g.fillStyle = "#f5f6f8"; g.fillRect(0, 0, 512, 320);
  g.fillStyle = "#dfe3ea"; g.fillRect(0, 0, 512, 46);
  g.fillStyle = "#ffffff"; g.fillRect(14, 10, 150, 36);
  font(g, 700, 18); g.fillStyle = "#555"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("New Tab", 28, 28);
  g.fillStyle = "#ffffff"; g.strokeStyle = "#c9ced8"; g.lineWidth = 3; g.beginPath(); g.roundRect(96, 150, 320, 46, 23); g.fill(); g.stroke();
  if (cursor) { g.fillStyle = "#333"; g.fillRect(120, 160, 4, 26); }
};
