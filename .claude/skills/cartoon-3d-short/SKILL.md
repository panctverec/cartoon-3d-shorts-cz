---
name: cartoon-3d-short
description: Vyrobí ~55-70s svislé animované story shorts ve stylu „2D postavy v barevném 3D světě“ (ploché kreslené postavy s obrysem, malovaný 3D svět s černými linkami, rozmazané pozadí, plynulá kamera, hlas, syntetizované zvuky a hudba), renderované přes three.js v Remotionu. Použij, když uživatel chce nové animované short video, skript k němu, novou postavu, úpravu videa nebo render.
---

# Animovaná 3D shorts (three.js + Remotion)

S uživatelem mluv **česky**. Nastavení uživatele je v `config/nastaveni.md` (vzniká při prvním spuštění, viz CLAUDE.md).
Vždy ho dodržuj: jazyk videí, moderátor ano/ne, hlas, titulky, ukázkové skripty.

## Soubory
- `src/engine/` motor: kamera, světlo, místnosti, postavy, post-processing. **Nové video = jeden `scene.ts` (+ případně `drawings.ts`).**
- `src/videos/priklad/scene.ts` vzor celé scény (kompozice `Priklad`). Každé nové video začni kopií této složky.
- `KNIHOVNA.md` katalog všeho, co už je nakreslené a postavené. **Čti před kreslením čehokoli nového.**
- `src/characters/host.ts` moderátor (když ho uživatel chce).
- `moje-skripty/` ukázkové skripty: podle nich se píše styl skriptu (uživatelovy, nebo výchozí `moje-skripty/vychozi/`).
- `reference/vzorec-stylu.md` vzorec skriptu a obrazu (změřený), `reference/reporty/` čísla ke vzhledu,
  `reference/vzhled-a-pasti.md` hodnoty vzhledu, look-match postup a známé chyby.
- `moje-reference/` uživatelova referenční videa. Na „rozeber reference“ / „chci větší shodu se stylem“ postupuj podle
  `moje-reference/README.md` (snímek po snímku, měření, porovnání vedle sebe, úprava enginu).
- `projekty/<NN>_<slug>/` všechno k jednomu videu (kromě kódu, ten je v `src/videos/<slug>/`).

## Postup (vždy v tomhle pořadí, po každém kroku ulož)
1. **Téma a fakta.** Jeden překvapivý pravdivý příběh nebo fakt s viditelnou příčinou a následkem + jednoduché přirovnání ze života.
   Fakta se zdroji nahoru do `projekty/<NN>_<slug>/SCRIPT.txt` (vždy `.txt`, uživatel ho snadno otevře).
2. **Skript** (55-70 s; angličtina ~3,7 slova/s, čeština ~3,2 slova/s). Nejdřív si přečti `moje-skripty/` (uživatelovy ukázky
   mají přednost před výchozími) a `reference/vzorec-stylu.md`. Beaty:
   - **Hook (0-3 s):** absurdní/překvapivý fakt jednou větou, bez úvodu.
   - **Prostředí:** kdy, kde, kdo (1-2 věty, konkrétní detaily).
   - **Stupňování:** 3-4 beaty, každý o kousek větší/vtipnější.
   - **Zlom:** moment, kdy se to rozbije / odhalí.
   - **Suchá dvojice:** „Naštěstí … / Bohužel …“ (stejná věta s jiným smyslem funguje nejlíp).
   - **Vysvětlení:** jedna myšlenka přes přirovnání ze života („Houpal jsi někdy dítě na houpačce?“).
   - **Důsledek / tip:** co z toho plyne.
   - **Pointa:** vrátí se k obrazu z hooku, video končí posledním slovem.
   Nikdy nepopisuj slovy, co divák zrovna vidí. Vtipy stojí na skutečných faktech. Skript ukaž uživateli a počkej na schválení.
3. **Hlas** (až po schválení skriptu; generování stojí kredity). Text do `projekty/<NN>_<slug>/voice/voice_script.txt`, pak
   `python scripts/make_voice.py projekty/<NN>_<slug>` → `voice.wav` + `words.json` (časy slov).
   Vlastní nahrávka: ulož jako `voice/voice_raw.wav` a spusť s `--no-tts`.
   **Zkontroluj words.json proti skriptu ručně** (Whisper občas slovo rozdělí nebo si ho vymyslí, hlavně na začátku a u čísel).
   Bez hlasu (test, nebo hlas ještě není): `python scripts/fake_words.py projekty/<NN>_<slug>` udělá umělé časy slov
   z `voice_script.txt` → titulky i klíče kamery fungují stejně. Zvuk pak bez voice.wav: hudba je hlavní vrstva, efekty vůči ní.
4. **Scéna:** zkopíruj `src/videos/priklad/` do `src/videos/<slug>/`, přejmenuj export, zaregistruj v `src/Root.tsx`
   (1080x1920, 30 fps). Do `scene.ts`:
   - `SETS` / `build()`: místnosti a svět z `engine/rooms.ts` (viz KNIHOVNA.md). Kamera musí být vždy **uvnitř** místnosti.
   - `SHOTS`: záběry s klíči kamery; čas každého klíče = začátek slova z words.json (komentář se slovem a časem).
     Reakce v obraze přijde 0-3 snímky **před** slovem.
   - `stage(ctx)`: kdo a co je na obrazovce. `ctx.host()` moderátor (jen když ho uživatel chce), `ctx.lit()` postavičky,
     `ctx.fx()` efekty, `ctx.card()` info karty, `ctx.L(čas)` = od slova dál.
   - Každý parametr, který mění kresbu, patří do klíče (`q()`), jinak se kresba nepřekreslí.
   - Nový objekt/kresba → do `src/library/` a řádka do `KNIHOVNA.md`.
   `npx tsc --noEmit -p .` musí projít bez chyb.
5. **Kontrolní snímky (stills) dřív než video:** jeden snímek na každý klíč kamery:
   `COMP=<Id> PROPS='{"post":{"audio":""}}' node scripts/stills.mjs projekty/<NN>_<slug>/stills/s_ <snímky> 0.3`
   Prohlédni je (obrys, světlo, nic nezakrývá obličej, info karty se vejdou, kamera není za zdí, text se nepřekrývá s titulky).
   Ukaž je uživateli, než pustíš celý render.
6. **Zvuk:** zkopíruj `scripts/audio/make_audio_vzor.py` do `projekty/<NN>_<slug>/audio/make_audio.py`, přepiš `TOTAL`,
   `SECTIONS` (hudba po částech) a `events` (efekty na časy slov) → `mix.wav`. Zkopíruj ho do `public/<slug>/mix.wav`
   a v `scene.ts` nastav `audio: "<slug>/mix.wav"` a `words` = words.json (titulky). Mix: hlas beze změny,
   hudba ~10 LU pod hlasem a ztlumená, když se mluví, efekty jemně; celkem kolem −15 LUFS.
   Časy v obraze zamkni dřív, než děláš zvuk (každá pozdější změna = znovu zvuk).
7. **Finální render** (2K na výšku):
   `npx remotion render src/index.ts <Id> projekty/<NN>_<slug>/final/video_noaudio.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 --props '{"post":{"audio":""}}'`
   pak `ffmpeg -i video_noaudio.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -af volume=-1.0dB <slug>_2k.mp4`
   a kontrola `python scripts/short_qa.py <slug>_2k.mp4 projekty/<NN>_<slug>/qa` (černé/bílé/zamrzlé snímky, skoky, hlasitost).
   Najdeš-li chybu, oprav a vyrenderuj znovu. Starší verze nikdy nepřepisuj (`v1`, `v2` …).
8. **Popis:** `projekty/<NN>_<slug>/final/description.txt`: titulek, popis (hook v prvních 125 znacích), hashtagy, připnutý komentář.

## Pravidla
- Příběh, postavy, skript a hlas jsou vždy **vlastní**. Ze stylových referencí se berou jen čísla a vzorce, nikdy věty, postavy nebo záběry.
- Titulky: podle `config/nastaveni.md`. Když ano: malé, max. 1 řádek (≤ 3 slova), mluvené slovo zvýrazněné (`src/common/Captions.tsx`).
- Žádné stažené 3D modely ani hudba, pokud o to uživatel výslovně nepožádá. Všechno se staví a generuje kódem.
- API klíče nikdy nevypisuj, neukládej do složky projektu ani neposílej jinam než na API, kterému patří.
- Každý záběr musí pořád trochu jet (pomalý push-in); stojící záběr ≥ 12 snímků vypadá jako zamrzlý.
- Info karty max. ~0,4 × vzdálenost kamery na šířku (formát 9:16 je úzký). Zóna titulků je y 1330-1430 z 1920, nic důležitého tam.
- Při info kartě se moderátor schová automaticky. Kamera vždy uvnitř místnosti (jinak prázdné snímky).

## Disk a temp (důležité na Windows)
Každý Remotion bundle kopíruje `public/` do temp složky a sám ho nemaže. Nastav `REMOTION_TMP` na složku na velkém disku
(např. `D:/remotion-tmp`) a po dokončeném videu (když nic nerenderuje) smaž v ní složky `remotion-webpack-bundle-*`
(zeptej se uživatele). V JS řetězcích piš `/`, ne `\` (`\r` = konec řádku).

## Úklid po schválení videa
Až uživatel řekne, že je video hotové/schválené, smaž: `stills/`, `qa/`, `final/video_noaudio.mp4`, `audio/_music_cache.npy`,
`audio/stem_*.wav`, `voice/voice_raw.*`. Nech: `SCRIPT.txt`, `description.txt`, `voice/voice.wav`, `words.json`,
`audio/make_audio.py`, `mix.wav`, finální mp4 a kód v `src/videos/<slug>/` (aby šlo video kdykoli znovu vyrenderovat).

## Naučená pravidla
(Sem zapisuj, co se při výrobě videí naučíš: co uživatel chce jinak, co se pokazilo a jak to opravit.)
- **Formát 9:16 je úzký:** při fov 44-54 je viditelná šířka jen ~0,23-0,29 × vzdálenost. Davy a postavy v pozadí stav do
  „chodbičky“ podél směru kamery (pozice = kamera + d·směr + malý boční posun), jinak jsou mimo záběr.
- **Kamera nesmí mít v ose pohledu sloup, stěžeň ani trám** (zakryje půl obrazu). Zkontroluj ve stills.
- **Měkké efekty (`soft: true`) nepíšou hloubku → inkoustové obrysy za nimi prosvítají** (kouř přes předměty vypadá jako oči).
  Neprůhledný kouř/oblaka kresli bez obrysu a bez `soft`; mizení řeš zmenšováním, ne průhledností.
- **Venkovní scéna jde i bez místnosti:** obloha = kopule s `MeshBasicMaterial` (BackSide, bez obrysu), voda = velká rovina.
