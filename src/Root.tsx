import React from "react";
import { Composition } from "remotion";
import { HostSheet } from "./concepts/HostSheet";
import { PrikladShort, PRIKLAD_FRAMES } from "./videos/priklad/scene";
// Každé nové video sem přidej jako další <Composition> (1080x1920, 30 fps).

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Priklad" component={PrikladShort} durationInFrames={PRIKLAD_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="HostSheet" component={HostSheet} durationInFrames={1} fps={30} width={2400} height={1120} />
  </>
);
