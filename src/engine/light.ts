// Engine: moods (per-set light + grade + background) and the key light. The sun is camera-relative and FROZEN per
// shot: az degrees around the shot's mean viewing direction, el above the horizon, so every shot is lit from
// behind-right whatever way the camera faces, and light never swims during a push-in.
import * as THREE from "three";
import { TONE, CHAR } from "../videos/bridge/shade";
import type { Timeline } from "./camera";

type C3 = [number, number, number];
export type MoodLight = { az: number; el: number; lit: C3; shade: C3; lift: C3; charTint: C3; sideTint: C3; sunCol: string; grade: "day" | "golden"; bg: string };

/** tested moods (#02, #03). Copy one and tweak lit/shade/bg for a new set. */
export const MOOD_PRESETS = {
  bedroom: { az: 140, el: 42, lit: [1.62, 1.46, 1.3], shade: [0.44, 0.37, 0.48], lift: [0.06, 0.05, 0.09], charTint: [1, 0.96, 0.92], sideTint: [0.94, 0.9, 0.96], sunCol: "#fff0dc", grade: "day", bg: "#f3d9cf" },
  living: { az: 130, el: 45, lit: [1.58, 1.5, 1.32], shade: [0.38, 0.4, 0.46], lift: [0.05, 0.06, 0.09], charTint: [1, 0.96, 0.93], sideTint: [0.92, 0.92, 0.97], sunCol: "#fff3e0", grade: "day", bg: "#d8e6d2" },
  morning: { az: 140, el: 42, lit: [1.6, 1.48, 1.28], shade: [0.42, 0.38, 0.5], lift: [0.06, 0.06, 0.1], charTint: [1, 0.96, 0.92], sideTint: [0.93, 0.9, 0.97], sunCol: "#fff1dc", grade: "day", bg: "#f4ead8" },
  office: { az: 130, el: 48, lit: [1.62, 1.38, 1.38], shade: [0.5, 0.36, 0.46], lift: [0.08, 0.05, 0.08], charTint: [1, 0.94, 0.94], sideTint: [0.96, 0.88, 0.94], sunCol: "#ffe6ec", grade: "day", bg: "#f4bccb" },
  park: { az: 120, el: 50, lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], charTint: [1, 0.94, 0.92], sideTint: [0.92, 0.9, 0.96], sunCol: "#fff3e0", grade: "day", bg: "#9cc3ea" },
} satisfies Record<string, MoodLight>;

export class KeyLight {
  sun = new THREE.DirectionalLight("#ffffff", 2.5);
  private cache = new Map<number, THREE.Vector3>();
  /** size = half-width of the shadow box in metres (5 for one room, 6 for bigger sets) */
  constructor(root: THREE.Object3D, size = 5) {
    const s = this.sun;
    s.castShadow = true; s.shadow.mapSize.set(4096, 4096);
    const sc = s.shadow.camera; sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 0.5; sc.far = 40; sc.updateProjectionMatrix();
    s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02;
    root.add(s, s.target);
  }
  dir<M extends string>(tl: Timeline<M>, id: number, M: MoodLight) {
    let v = this.cache.get(id);
    if (v) return v;
    const s = tl.shot(id);
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 4) { const c = tl.camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(M.az), el = THREE.MathUtils.degToRad(M.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.cache.set(id, v);
    return v;
  }
  aim(dir: THREE.Vector3, focus: THREE.Vector3, M: MoodLight) {
    this.sun.color.set(M.sunCol); this.sun.intensity = 2.5;
    this.sun.position.copy(focus).addScaledVector(dir, 15); this.sun.target.position.copy(focus); this.sun.target.updateMatrixWorld();
  }
}

/** world + character shading uniforms for a mood */
export const applyMood = (scene: THREE.Scene, M: MoodLight) => {
  scene.fog = null; scene.background = new THREE.Color(M.bg);
  TONE.uLitCol.value.set(...M.lit); TONE.uShadeCol.value.set(...M.shade); TONE.uShadeLift.value.set(...M.lift);
  TONE.uLambert.value = 0.35; TONE.uSideK.value = 0.86; TONE.uTerm.value = 0.2; TONE.uBounce.value.set(0, 0, 0); TONE.uSat.value = 1.06;
  CHAR.uCharTint.value.set(...M.charTint); CHAR.uCharShade.value = 0.87; CHAR.uGrad.value = 0.07; CHAR.uBodyGrad.value = 0.2; CHAR.uSideTint.value.set(...M.sideTint);
};
