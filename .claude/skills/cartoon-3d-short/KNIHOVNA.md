# Knihovna objektů (co už existuje → nekresli znovu)

Než začneš kreslit nový objekt, místnost nebo efekt, **podívej se sem**. Co už je hotové, jen naimportuj.
Každý nový objekt, který v nějakém videu vytvoříš, **přidej do knihovny a zapiš sem** (soubor + jedna řádka popisu).
Knihovna tak s každým videem roste a další videa jsou rychlejší a levnější (méně tokenů, méně ladění).

## 3D místnosti a nábytek: `src/engine/rooms.ts`
Všechno se staví z kódu (žádné stažené modely). Materiály: `solid(key, barva)`, `tex(key, textura, rx, ry)`.
Každý klíč materiálu/textury dej s prefixem videa (např. `v4_`), ať se videa nepletou.

| Funkce | Co to je |
|---|---|
| `room(shell, box, stěna, podlaha, strop)` | místnost (krabice zevnitř) |
| `windowOn(R, f, x, y, z, w, h, sky)` | okno s oblohou |
| `panel(R, w, h, pos, rot, mat)` | plochý panel: displej, obrazovka, sklo (vrací materiál, dá se měnit každý snímek) |
| `bed`, `wardrobeLeft`, `mirrorRight`, `sofa`, `tableLamp`, `plant`, `picture`, `dumbbell`, `rugOn`, `box` | nábytek a doplňky |
| `wallpaper`, `quiltTex`, `rugTex`, `skyTex`, `plankFloor` | malované textury (tapeta, deka, koberec, obloha, prkna) |

Venkovní svět (město, domy, most, řeka, tráva, dlažba, kámen): `src/videos/bridge/build.ts` + `paint.ts`
(`facadeHD`, `roofHD`, `stoneHD`, `cobbleHD`, `grassHD`, `planksHD`, `waterNear` …).

## Světlo a nálady: `src/engine/light.ts`
`MOOD_PRESETS`: `bedroom`, `living`, `morning`, `office`, `park`. Nová scéna = zkopíruj jednu a změň `bg/lit/shade`.

## Kamera: `src/engine/camera.ts`
`key`, `cut`, `glideTo`, `at(pos, look, fov, f0, rate, roll, punch)`, `cardKey` (celoobrazovková info karta), `q()`.

## Postavy
| Soubor | Co |
|---|---|
| `src/characters/host.ts` | **moderátor** (volitelný průvodce videem), `drawHost()`, model sheet = kompozice `HostSheet` |
| `src/videos/bridge/toon.ts` | základ všech postav: `Pen`, `bodyFront` / `bodySide` (stojí, chodí, sedí, padá, mává), 14+ výrazů (`Expr`), oblečení (`Outfit`: vlasy, kšiltovka, klobouk, čepec, šaty, knír), hotové typy `RIFLEMAN`, `OFFICER`, `KID`, `PARENT`, `townsfolk()` |

## 2D kresby (postavičky, rekvizity, info karty, efekty)
| Soubor | Co v něm je |
|---|---|
| `src/videos/bridge/toon.ts` | efekty: `fxNote` (noty), `fxBurst` (záblesk), `fxSplash`, `fxPuff` (obláček prachu), `fxStars`, `fxCreak`, `fxRing`, `fxSign` (cedule), `fxCloud`, `fxShadow`, `fxContact`, `fxPlank`, `fxDrum`, `fxBlob`, `swingKid` (dítě na houpačce) |
| `src/library/kresby_noc.ts` | `cortisol` (oranžový hormon s obličejem, 7 póz), `fxZ` (spánek), `fxHeat`, `fxBubble` (bublina s textem), `fxSleepChart` (graf), `fxAroma`, `fxBreeze`, `fxSteam` (pára), `fxDing`, textury `clockFace` (budík), `machineFace`, `phoneFace` |
| `src/library/kresby_kancelar.ts` | `brain` (mozek s obličejem, 6 póz), `estrogen`, `doorFace` (dveře s obličejem), `fxQuestion`, `fxSticky` (lísteček), `fxMug`, `fxPhone`, `fxKeys`, `fxThought` (myšlenková bublina s řádky), `fxBars` (sloupcový graf), `fxLearning`, `fxBook`, `fxFog` (mlha), textura `laptopFace` |
| `src/library/kresby_vaha.ts` | `scaleChar` (váha s obličejem), `fatCell`, `muscle` (sval), `dressChar` (šaty), `mirrorFace`, `fxJeans`, `fxScan` (info karta s grafem), `fxSuitcase` (kufr), `fxKilos` (porovnání), `fxFlame`, `fxCalendar`, `fxToast`, `fxDumbbell`, `fxSpark`, textura `scaleDisplay` (číslo na displeji) |

## Zvuk: `scripts/audio_kit.py` + `scripts/audio/`
Vše syntetizované (žádná stažená hudba): `beep`, `click`, `pop`, `boom`, `bell`, `harp_gliss`, `sparkle`, `noise_burst`,
`tone`, `G.whoosh`, `G.clink` …, hudba z akordů (`SECTIONS`). Vzor celého zvuku videa: `scripts/audio/make_audio_vzor.py`.

## Hotové scény (vzory)
| Kompozice | Soubor | Co ukazuje |
|---|---|---|
| `Priklad` | `src/videos/priklad/scene.ts` | 61 s, dvě místnosti, moderátor, postavičky, info karty, efekty: **vzor pro každé nové video** |
| (most) | `src/videos/bridge/` | původní krátký film: venkovní svět, dav vojáků, řeka, zlatá hodinka (starší styl bez enginu, jen jako zdroj kódu) |
