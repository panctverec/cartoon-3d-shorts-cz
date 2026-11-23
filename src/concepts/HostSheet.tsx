// Model sheet moderátora: 4 výrazy vedle sebe. Render: npx remotion still src/index.ts HostSheet projekty/_postava/host_sheet.png
import React, { useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen, INK, Expr } from "../videos/bridge/toon";
import { drawHost, HOST_NAME } from "../characters/host";

const POSES: { expr: Expr; wave?: number; label: string }[] = [
  { expr: "neutral", label: "neutral" },
  { expr: "smile", label: "smile" },
  { expr: "shock", label: "shock" },
  { expr: "grin", wave: 0.8, label: "grin + wave" },
];

export const HostSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("host"));
  useEffect(() => {
    const c = ref.current!, g = c.getContext("2d")!;
    const bg = g.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, "#cfe3f2"); bg.addColorStop(1, "#f7efe2");
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    POSES.forEach((m, i) => {
      g.save(); g.translate(i * 600, 30);
      g.fillStyle = "rgba(36,23,38,0.18)"; g.beginPath(); g.ellipse(300, 975, 120, 22, 0, 0, Math.PI * 2); g.fill();
      const p = new Pen(g); p.ol = 10;
      drawHost(p, { expr: m.expr, wave: m.wave });
      g.restore();
      g.fillStyle = INK; g.font = "bold 40px Segoe UI, Arial, sans-serif"; g.textAlign = "center";
      g.fillText(`${HOST_NAME}: ${m.label}`, i * 600 + 300, 1080);
    });
    continueRender(h);
  }, [h]);
  return <AbsoluteFill><canvas ref={ref} width={2400} height={1120} /></AbsoluteFill>;
};
