// Shared word-by-word captions (user rules: captions always on; small, ONE line max, black shadow instead of an outline).
// Words come from the approved script, times from voice/words.json. Groups of up to 3 words / 14 letters, broken at
// sentence/comma ends and pauses; the spoken word is highlighted. Sits at ~70 % of the frame height, clear of the Shorts/Reels UI.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });
type W = { w: string; s: number; e: number };
export type CaptionWord = W;
const MAX_CHARS = 14;
const FONT = 64; // px at 1080 x 1920

/** groups of word indices; each must fit on one line */
const groupsOf = (words: W[]): number[][] => {
  const out: number[][] = []; let cur: number[] = [];
  const len = (g: number[]) => g.reduce((a, i) => a + words[i].w.length, 0) + Math.max(0, g.length - 1);
  words.forEach((w, i) => {
    if (cur.length && len([...cur, i]) > MAX_CHARS) { out.push(cur); cur = []; }
    cur.push(i);
    const next = words[i + 1];
    const end = /[.,?!:]$/.test(w.w) || cur.length >= 3 || !next || next.s - w.e > 0.35;
    if (end) { out.push(cur); cur = []; }
  });
  return out;
};

// tight dark halo + drop shadow: readable on light walls too, still no hard outline stroke
const SHADOW = (u: number) =>
  `0 0 ${5 * u}px rgba(0,0,0,0.95), 0 0 ${10 * u}px rgba(0,0,0,0.85), 0 ${6 * u}px ${6 * u}px rgba(0,0,0,0.9), 0 ${4 * u}px ${22 * u}px rgba(0,0,0,0.74)`; // user: a touch bigger after #02 and again after #03

/** shared by every short: pass the caption words (script words + times from words.json) */
export const Captions: React.FC<{ words: W[] }> = ({ words }) => {
  const GROUPS = React.useMemo(() => groupsOf(words), [words]);
  const f = useCurrentFrame(), { fps, height } = useVideoConfig();
  const t = f / fps, u = height / 1920;
  let g = -1;
  for (let i = 0; i < GROUPS.length; i++) if (t >= words[GROUPS[i][0]].s - 0.05) g = i;
  if (g < 0) return null;
  const grp = GROUPS[g], last = words[grp[grp.length - 1]];
  if (t > last.e + 0.6 && (g === GROUPS.length - 1 || t < words[GROUPS[g + 1][0]].s - 0.05)) return null;
  const g0 = words[grp[0]].s, appear = Math.min(1, (t - g0 + 0.05) / 0.1);
  // safety: shrink if a single long group would still exceed ~900 px
  const chars = grp.reduce((a, i) => a + words[i].w.length, 0) + grp.length - 1;
  const size = Math.min(FONT, 900 / (chars * 0.78)) * u;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", top: 1330 * u }}>
      <div style={{ display: "flex", flexWrap: "nowrap", whiteSpace: "nowrap", justifyContent: "center", gap: `0 ${size * 0.28}px`,
        transform: `scale(${0.9 + 0.1 * appear})`, opacity: appear }}>
        {grp.map((i) => {
          const w = words[i], active = t >= w.s - 0.03 && t < (words[i + 1]?.s ?? w.e + 1) - 0.03;
          return (
            <span key={i} style={{
              fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.1, textTransform: "uppercase",
              color: active ? "#ffd166" : "#ffffff", textShadow: SHADOW(u), display: "inline-block",
            }}>{w.w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
