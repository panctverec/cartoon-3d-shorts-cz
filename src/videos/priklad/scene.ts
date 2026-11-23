// PŘÍKLAD: celá 61s scéna na enginu (src/engine). Vzor pro každé nové video: zkopíruj tuhle složku a přepiš sekce
// SETS / SHOTS / STAGE. Moderátor = ctx.host(). Bez hlasu a titulků (audio "", words []), jen ukázka obrazu.
import * as THREE from "three";
import { Timeline, ShotDef, key, glideTo, cut, cardKey, at, smooth, clamp01, q, V3 } from "../../engine/camera";
import { MOOD_PRESETS } from "../../engine/light";
import { Ctx } from "../../engine/cast";
import {
  Batch, solid, tex, room, windowOn, panel, wallpaper, quiltTex, rugTex, skyTex, plankFloor, box, rugOn, bed, wardrobeLeft,
  mirrorRight, plant, sofa, dumbbell, picture, tableLamp, ctex,
} from "../../engine/rooms";
import { makeShort } from "../../engine/ShortComposition";
import { CaptionWord } from "../../common/Captions";
import {
  scaleChar, fatCell, muscle, dressChar, mirrorFace, fxJeans, fxScan, fxSuitcase, fxKilos, fxFlame, fxCalendar, fxToast, fxDumbbell, fxSpark, scaleDisplay,
} from "../../library/kresby_vaha";

// ======================= SETS =======================
const LX = 40; // living room x
const SCALE: V3 = [0.15, 0, 0.55];
const displayTex = (text: string) => ctex(`s3_disp_${text}`, 512, 256, (g) => scaleDisplay(g, text));
type Parts = { display: THREE.MeshBasicMaterial };
const build = (R: THREE.Object3D): Parts => {
  const shell = new Batch(), f = new Batch();
  const floor = plankFloor("s3_floor"), ceil = solid("s3_ceil", "#f4efe6"), wood = solid("s3_wood", "#a8724a"), woodD = solid("s3_woodD", "#6e472e");
  const leaf = solid("s3_leaf", "#5c9e5a"), pot = solid("s3_pot", "#c9736a"), sky = skyTex("s3_sky");
  // ---- BEDROOM (origin): bed, wardrobe left, mirror right, window, dresser + plant, rug, the scale ----
  room(shell, { x0: -2.6, x1: 2.6, z0: -2.6, z1: 2.8, h: 2.6 }, tex("s3_bwall", () => wallpaper("s3_bw", "#f3d9cf", "#e9bfb1"), 4, 2), floor, ceil);
  windowOn(R, f, -0.2, 1.1, -2.6, 1.4, 1.0, sky);
  bed(f, 0.4, 2.2, -2.6, -0.5, { wood, quilt: tex("s3_quiltM", () => quiltTex("s3_quilt"), 1.5, 1.5), head: solid("s3_head", "#e07a5f"), pillow: solid("s3_pillow", "#f6f1e8") });
  wardrobeLeft(f, -2.6, -1.6, 0.3, solid("s3_wardrobe", "#e9dfcf"), solid("s3_wardD", "#ded2bf"), solid("s3_brass", "#d9b25a"));
  mirrorRight(R, f, 2.6, -0.1, 0.75, woodD);
  box(f, -1.6, 0, -2.6, -0.9, 0.85, -2.15, wood); // dresser
  plant(f, -1.25, 0.85, -2.38, pot, leaf);
  rugOn(f, 0.1, 0.4, 2.6, 1.8, tex("s3_rugM", () => rugTex("s3_rug", "#9fc5b8", "#e9f1ec")));
  const [sx, , sz] = SCALE;
  box(f, sx - 0.17, 0, sz - 0.2, sx + 0.17, 0.05, sz + 0.2, solid("s3_scale", "#e9eef2"));
  const display = panel(R, 0.16, 0.08, [sx, 0.052, sz + 0.12], [-Math.PI / 2, 0, 0], { map: displayTex("64.0"), color: new THREE.Color(1.4, 1.4, 1.4) });
  // ---- LIVING ROOM (x = 40): sofa, rug, yoga mat + dumbbells, plant, lamp, picture ----
  room(shell, { x0: LX - 3, x1: LX + 3, z0: -2.8, z1: 2.8, h: 2.7 }, tex("s3_lwall", () => wallpaper("s3_lw", "#d8e6d2", "#c3d6bb"), 4, 2), floor, ceil);
  shell.build(R, false);
  windowOn(R, f, LX + 0.6, 1.0, -2.8, 1.6, 1.2, sky);
  sofa(f, LX - 1.9, LX - 0.2, -2.75, solid("s3_sofa", "#4f5f86"), solid("s3_cushion", "#e8b23c"));
  rugOn(f, LX, -0.6, 3.0, 2.0, tex("s3_lrugM", () => rugTex("s3_lrug", "#e9c9a6", "#c97f5f")));
  rugOn(f, LX + 0.2, 0.3, 0.7, 1.8, solid("s3_mat", "#6fa38c"), 0.012);
  for (const z of [0.95, 1.1]) dumbbell(f, LX + 0.5, z, solid("s3_bar", "#8d949c"), solid("s3_plate", "#3d414c"));
  plant(f, LX + 2.3, 0, -2.3, solid("s3_pot2", "#c9736a"), leaf, 0.2, 0.4, [[0, 0.4, 0, 0.32], [0.15, 0.65, 0.05, 0.22], [-0.15, 0.6, -0.1, 0.2]]);
  tableLamp(f, LX + 0.35, -2.5, wood, woodD, solid("s3_shade", "#f6e3c0"));
  picture(f, LX - 1.4, 1.5, LX - 0.6, 2.1, -2.79, woodD, solid("s3_art", "#f2b49a"));
  f.build(R, true);
  return { display };
};

// ======================= SHOTS + CAMERAS (onsets from voice/words.json in comments) =======================
const [SX, , SZ] = SCALE;
const HOST_ON_SCALE: V3 = [SX, 0.05, SZ], HOST_TOAST: V3 = [-0.7, 0, 0.1], HOST_LIVING: V3 = [LX + 0.1, 0, 0.3];
const DISPLAY: V3 = [SX, 0.05, SZ + 0.12], FACE: V3 = [SX, 1.18, SZ];
type Mood = "bedroom" | "living";
const SHOTS: ShotDef<Mood>[] = [
  { to: 153, mood: "bedroom", note: "hook: scale, jeans, not your willpower", keys: [
    key(0, at([SX, 0.78, SZ + 0.75], DISPLAY, 34, 0, 0.003), { dof: 13 }),                     // the scale (0.00)
    cardKey(42),                                                                                 // jeans (1.42)
    cut(79, at([0.4, 1.35, 2.4], [SX, 1.0, SZ], 42, 79, 0.0025, 0, 0.006), { dof: 8 }),        // "Science has an answer" (2.68)
  ] },
  { to: 321, mood: "bedroom", note: "Saturday: toast, same number, jeans won't button", keys: [
    key(153, at([0.0, 1.4, 2.3], [HOST_TOAST[0], 1.0, HOST_TOAST[2]], 42, 153, 0.002), { dof: 8 }), // toast (5.18)
    cut(218, at([SX, 0.78, SZ + 0.75], DISPLAY, 34, 218, 0.003), { dof: 13 }),                  // same number (7.32)
    cardKey(257, { roll: 0.03 }),                                                                // same jeans (8.62)
  ] },
  { to: 518, mood: "bedroom", note: "scale says nothing, waistband pops, dress, mirror", keys: [
    key(321, at([0.3, 1.3, 2.1], FACE, 38, 321, 0.0025), { dof: 11 }),                          // (10.72)
    cardKey(368),                                                                                // waistband (12.32)
    cut(406, at([-0.55, 1.35, -0.45], [-1.98, 1.25, -1.1], 40, 406, 0.003), { dof: 12 }),       // the dress (13.58)
    cut(461, at([0.55, 1.45, 1.5], [2.44, 1.2, 0.33], 44, 461, 0.003, 0.04), { dof: 12 }),      // the mirror (15.42)
  ] },
  { to: 777, mood: "bedroom", note: "the body-scan study", keys: [cardKey(517, { first: true })] }, // (17.28)
  { to: 916, mood: "bedroom", note: "Luckily / Unluckily: SCALE shrugs", keys: [
    key(777, at([0.25, 1.25, 1.9], FACE, 36, 777, 0.003), { dof: 12 }),                         // Luckily (25.92)
    cut(843, at([0.55, 0.75, 2.0], [0.55, 0.28, 0.7], 38, 843, 0.003, 0.04), { dof: 12 }),      // Unluckily (28.14)
  ] },
  { to: 1401, mood: "bedroom", note: "suitcase, kilo vs kilo, FAT CELL, flame", keys: [
    cardKey(916, { first: true }),                                                               // suitcase (30.56)
    cardKey(1108, { roll: -0.03 }),                                                              // kilo vs kilo (36.98)
    cut(1209, at([0.95, 1.25, 0.4], [1.3, 0.72, -1.4], 40, 1209, 0.0025), { dof: 10 }),         // FAT CELL (40.32)
    cardKey(1333),                                                                               // flame -1/3 (44.46)
  ] },
  { to: 1662, mood: "living", xfade: 8, note: "lift something: MUSCLE, calendar", keys: [
    key(1397, at([LX + 0.5, 1.3, 2.6], [LX + 0.35, 0.88, 0.4], 48, 1397, 0.002), { dof: 7 }),  // My trick? (46.70)
    glideTo(1556, at([LX + 0.5, 1.15, 2.3], [LX + 0.4, 0.8, 0.45], 44, 1556, 0.0025, 0.04), { dur: 26, dof: 10 }), // built muscle (51.94)
    cardKey(1587, { x: LX, rate: 0 }),                                                              // calendar (52.92)
  ] },
  { to: 1830, mood: "bedroom", xfade: 8, note: "callback: jeans button. sign-off.", keys: [
    key(1658, at([0.4, 1.35, 2.4], [SX, 1.0, SZ], 42, 1658, 0.002), { dof: 8 }),               // (55.40)
    cardKey(1713),                                                                               // jeans button (57.12)
    cut(1761, at([0.35, 1.35, 2.3], [SX, 1.08, SZ], 42, 1761, 0.002, 0.03), { dof: 9 }),       // sign-off (58.72)
  ] },
];
const timeline = new Timeline(SHOTS, 1830, [[12.86, 0.9], [22.0, 0.5], [36.5, 0.6], [57.6, 0.5]], 153);

// ======================= STAGE =======================
/** the scale's display rolls for 1.2 s at the start of shots 1 and 8, then lands on the same number */
const displayAt = (id: number, t: number) => {
  const roll = (t0: number) => (t >= t0 && t < t0 + 1.2 ? (60 + Math.floor((t * 23) % 9) + "." + Math.floor((t * 37) % 10)) : "64.0");
  return id === 1 ? roll(0) : id === 8 ? roll(55.4) : "64.0";
};
const jeans = (c: Ctx, g: number, pop: number, strain: number) => c.card(`jeans|${g}|${pop}|${strain}`, 700, 560, (p) => fxJeans(p, g, pop, strain), 0.7, 0.56);

const stage = (c: Ctx<Mood, Parts>) => {
  const { id, f, t, L } = c;
  c.parts.display.map = displayTex(displayAt(id, t)); c.parts.display.needsUpdate = true;
  // ---- host (hidden automatically on card keys) ----
  const wave7 = q(0.35 + 0.55 * (0.5 + 0.5 * Math.sin((t - 47.2) * 3.2)), 20);
  if (id === 1) c.host({ pos: HOST_ON_SCALE, expr: L(2.68) ? "smile" : L(1.42) ? "nervous" : "neutral" });
  if (id === 2) { c.host({ pos: HOST_TOAST, expr: "smile_closed" }); if (!c.cardShot) c.fx("toast", 200, 200, fxToast, c.hand(416, 630), 0.13, 0.13); }
  if (id === 3) c.host({ pos: HOST_ON_SCALE, expr: "neutral", lid: Math.max(0.3, c.blink()) });
  if (id === 5) c.host({ pos: HOST_ON_SCALE, expr: "neutral", lid: Math.max(0.5, c.blink()), look: L(28.14) ? 1 : 0 });
  if (id === 7) { c.host({ pos: HOST_LIVING, expr: L(51.94) ? "grin" : "smile", wave: wave7 }); if (!c.cardShot) c.fx("dumbbell", 300, 140, fxDumbbell, c.hand(443 + 28 * wave7, 300), 0.3, 0.14); }
  if (id === 8) c.host({ pos: HOST_ON_SCALE, expr: L(58.72) ? "grin" : "smile_closed", wave: L(58.72) ? q(Math.sin(t * 9), 20) : undefined });
  // ---- lit characters ----
  if (id === 5 && f >= 843) { const pose = t >= 28.3 ? "shrug" : "innocent"; c.lit(`scale|${pose}`, 500, 420, (p) => scaleChar(p, pose), [0.62, 0, 0.78], 0.46, 0.39); }
  if (id === 3) c.lit("dress", 360, 520, dressChar, [-1.955, 0.62, -1.1], 0.6, 0.87, { yaw: Math.PI / 2 });
  if (id === 6 && f >= 1209 && f < 1333) { const sq = q(smooth((t - 42.6) / 1.2), 24); c.lit(`fat|${sq}`, 400, 360, (p) => fatCell(p, sq, "cozy"), [1.3, 0.6, -1.3], 0.5, 0.45); }
  if (id === 7) {
    const fl = q(0.3 + 0.7 * smooth((t - 51.94) / 0.4) * (0.75 + 0.25 * Math.sin(t * 6)), 24), grow = 1 + 0.3 * smooth((t - 51.94) / 0.5), face = t >= 51.94 ? "proud" : "grin";
    c.lit(`muscle|${fl}|${face}`, 420, 520, (p) => muscle(p, fl, face), [LX + 0.62, 0, 0.75], 0.44 * grow, 0.55 * grow);
    c.blob([LX + 0.62, 0.012, 0.75], 0.34 * grow, 0.22 * grow);
  }
  // ---- info cards (only draw on card keys) + effects ----
  if (id === 1) jeans(c, 1, 0, 1);
  if (id === 2) jeans(c, q(0.65 + 0.35 * Math.abs(Math.sin(t * 7)), 20), 0, 1);
  if (id === 3) jeans(c, 1, q(smooth((t - 12.86) / 0.5), 30), 1);
  if (id === 8 && c.cardShot) {
    const g = q(1 - smooth((t - 57.3) / 0.4), 30);
    jeans(c, g, 0, g > 0.5 ? 1 : 0);
    if (t >= 57.7) { const u = q(clamp01((t - 57.7) / 0.6), 20); c.card(`spark|${u}`, 200, 200, (p) => fxSpark(p, u), 0.16, 0.16, { dx: 0.05, dy: 0.12, dz: 0.05 }); }
  }
  if (id === 3 && f >= 461) c.fx("mirror|cover", 400, 400, (p) => mirrorFace(p, "cover"), [2.4, 1.3, 0.33], 0.34, 0.34);
  if (id === 4) {
    const fa = q(smooth((t - 20.16) / 1.4), 30), mu = q(smooth((t - 22.76) / 0.9), 30), sc = t >= 24.3;
    c.card(`scan|${fa}|${mu}|${sc}`, 960, 820, (p) => fxScan(p, fa, mu, sc), 0.76, 0.65);
  }
  if (id === 6 && f < 1108) {
    const o = q(smooth((t - 31.48) / 0.9), 30), inn = q(clamp01((t - 33.3) / 1.2), 30), zp = q(clamp01((t - 36.04) / 0.6), 20);
    c.card(`suit|${o}|${inn}|${zp}`, 900, 700, (p) => fxSuitcase(p, o, inn, zp), 0.76, 0.59, { rot: zp > 0 ? 0.03 * Math.sin(t * 30) : 0 });
  }
  if (id === 6 && f >= 1108 && f < 1209) { const k = q(smooth((t - 38.0) / 0.6), 30); c.card(`kilos|${k}`, 900, 600, (p) => fxKilos(p, k), 0.76, 0.51); }
  if (id === 6 && f >= 1333) { const sz = q(1 - 0.32 * smooth((t - 45.0) / 0.8), 30); c.card(`flame|${sz}`, 500, 640, (p) => fxFlame(p, sz), 0.5, 0.64); }
  if (id === 7) { const tk = q(clamp01((t - 53.8) / 0.3) + clamp01((t - 54.3) / 0.3), 20); c.card(`cal|${tk}`, 700, 560, (p) => fxCalendar(p, tk), 0.7, 0.56); }
};

// words = words.json hlasu (titulky), audio = mix v public/ (např. "<slug>/mix.wav"); tady prázdné = tichá ukázka
const WORDS: CaptionWord[] = [];
export const { Short: PrikladShort, frames: PRIKLAD_FRAMES } = makeShort({
  timeline, moods: MOOD_PRESETS, build, stage, words: WORDS, audio: "",
});
