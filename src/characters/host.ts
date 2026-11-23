// MODERÁTOR (host): volitelná hlavní postava, která provází každé video (jako průvodce / vypravěč na obrazovce).
// Výchozí vzhled je obecný: krátké hnědé vlasy, tyrkysová mikina, tmavé kalhoty. Při setupu ho Claude upraví podle tebe
// (barvy, účes, oblečení, jméno). Kreslí se perem z toon.ts, takže má stejný obrys a stínování jako ostatní postavy.
// Videa bez moderátora: prostě ve scéně nevolej ctx.host(...).
import { Pen, bodyFront, Outfit, FrontOpts } from "../videos/bridge/toon";

/** jméno postavy (používá se jen v poznámkách a skriptu) */
export const HOST_NAME = "Moderátor";
/** tvar hlavy: po schválení postavy už neměnit, aby vypadala v každém videu stejně */
export const HOST_SEED = 7;
/** barvy a oblečení. hat: "hair" = vlasy (hair = barva), "cap" = kšiltovka (cap = barva), null = holá hlava */
export const HOST_OUTFIT: Outfit = {
  jacket: "#2f9e9a", pants: "#34384a", boots: "#5a3b2a", skin: "#ffe2c2", hat: "hair", hair: "#4a2f1f",
};

/** moderátor zepředu. walk = fáze chůze 0..1 (procházka), jinak stojí. */
export const drawHost = (p: Pen, opts: Omit<FrontOpts, "seed" | "facing" | "mode" | "phase"> & { walk?: number } = {}) => {
  const { walk, ...fo } = opts;
  const light = fo.light ?? (-120 * Math.PI) / 180;
  bodyFront(p, HOST_OUTFIT, { ...fo, mode: walk !== undefined ? "stroll" : "stand", phase: walk ?? 0, seed: HOST_SEED, facing: 0, light });
};
