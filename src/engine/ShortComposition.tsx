// Engine: turns a scene spec into a Remotion component. Per shot layer: one ThreeCanvas with the world posed for
// (shot id, frame), the bridge post chain (ink -> lens blur -> bloom -> neutral tone map -> grade); on top the
// optional white flash, word captions and the mix. Input props {"post":{...}} toggle passes / audio ("" = silent,
// needed for stills before mix.wav exists) / dpr.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, NOINK } from "../videos/bridge/ink";
import { LensBlur } from "../videos/bridge/lensblur";
import { GradeEffect, GRADES, gradeFor } from "../videos/bridge/grade";
import { Captions, CaptionWord } from "../common/Captions";
import { Timeline, V3 } from "./camera";
import { MoodLight, KeyLight, applyMood } from "./light";
import { Ctx } from "./cast";

export type ShortSpec<M extends string, P> = {
  timeline: Timeline<M>;
  moods: Record<M, MoodLight>;
  /** build the sets once; whatever it returns (moving parts) is ctx.parts */
  build: (root: THREE.Object3D) => P;
  /** per frame: props, host, characters, effects, info cards */
  stage: (ctx: Ctx<M, P>) => void;
  words: CaptionWord[];
  /** mix path inside public/, e.g. "sameweight/mix.wav" */
  audio: string;
  shadowSize?: number;
  /** page colour behind the canvases (default: first shot's mood bg) */
  bg?: string;
};

export class EngineWorld<M extends string, P> {
  root = new THREE.Group();
  private key: KeyLight; private ctx: Ctx<M, P>; private parts: P;
  constructor(private spec: ShortSpec<M, P>) {
    this.parts = spec.build(this.root);
    this.key = new KeyLight(this.root, spec.shadowSize ?? 5);
    this.ctx = new Ctx<M, P>(this.root);
  }
  /** poses camera, light and cast for (shot id, frame); returns the focus point */
  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const { timeline: tl, moods } = this.spec, s = tl.shot(id), M = moods[s.mood];
    const c = tl.camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 200; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    applyMood(scene, M);
    const dir = this.key.dir(tl, id, M), focus = new THREE.Vector3(...c.look);
    this.key.aim(dir, focus, M);
    this.ctx.begin(id, f, s, cam, dir, tl.keyAt(id, f).card, this.parts);
    this.spec.stage(this.ctx);
    this.ctx.end();
    return focus;
  }
}

type Toggles = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; captions: boolean; audio: string; dpr?: number };
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

export const makeShort = <M extends string, P>(spec: ShortSpec<M, P>) => {
  const tl = spec.timeline;
  const toggles = (): Toggles => ({ ink: true, lens: true, bloom: true, grade: true, captions: true, audio: spec.audio,
    ...((getInputProps() as { post?: Partial<Toggles> }).post ?? {}) });

  const Inner: React.FC<{ id: number }> = ({ id }) => {
    const f = useCurrentFrame();
    const { camera, scene } = useThree();
    const world = useMemo(() => new EngineWorld(spec), []);
    const on = useMemo(toggles, []);
    const fx = useMemo(() => ({
      ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
      lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(GRADES.day, 1),
    }), [camera, scene]);
    useEffect(() => () => { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); }, [fx]);
    const post = useMemo(() => (
      <EffectComposer multisampling={4}>
        {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
        {on.lens ? <primitive object={fx.lens.pre} dispose={null} /> : null}
        {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
        {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
        <primitive object={fx.tone} dispose={null} />
        {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      </EffectComposer>
    ), [fx, on]);
    const cam = camera as THREE.PerspectiveCamera;
    const target = world.update(id, f, cam, scene);
    noInkFallback(world.root);
    const d = tl.dofAt(f);
    cam.getWorldDirection(fwd);
    if (d.focus) fpt.set(...(d.focus(f) as V3)); else fpt.copy(target);
    fx.lens.focus = Math.max(0.2, fpt.sub(cam.position).dot(fwd));
    fx.lens.cInf = d.cInf;
    gradeFor(fx.grade, spec.moods[tl.shot(id).mood].grade);
    return (<><primitive object={world.root} dispose={null} />{post}</>);
  };

  const ShotView: React.FC<{ id: number; alpha: number; dpr?: number }> = ({ id, alpha, dpr }) => (
    <AbsoluteFill style={{ opacity: alpha }}>
      <ThreeCanvas width={1080} height={1920} {...(dpr ? { dpr } : {})} shadows
        gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 200 }}>
        <Inner id={id} />
      </ThreeCanvas>
    </AbsoluteFill>
  );

  const bg = spec.bg ?? spec.moods[tl.shots[0].mood].bg;
  const Short: React.FC = () => {
    const f = useCurrentFrame(), on = useMemo(toggles, []);
    const F = tl.flashAt;
    const flash = F >= 0 && f >= F && f < F + 4 ? [1, 0.75, 0.45, 0.2][f - F] : 0;
    return (
      <AbsoluteFill style={{ background: bg }}>
        {tl.layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} alpha={l.alpha} dpr={on.dpr} />)}
        {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
        {on.captions && <Captions words={spec.words} />}
        {on.audio && <Audio src={staticFile(on.audio)} />}
      </AbsoluteFill>
    );
  };
  return { Short, frames: tl.total };
};
