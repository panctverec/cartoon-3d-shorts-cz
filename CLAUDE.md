# Animovaná 3D shorts s Claude Code

Tahle složka je celé studio na svislá animovaná shorts ve stylu „2D postavy v barevném 3D světě“: skill
(`.claude/skills/cartoon-3d-short/`), Remotion projekt (`src/`, `scripts/`, `public/`) a všechna videa (`projekty/`).
Pracuj jen uvnitř této složky. **S uživatelem vždy mluv česky**, jednoduše a bez zbytečného žargonu
(může jít o člověka, který programovat neumí).

## Na začátku KAŽDÉ session
1. Pokud **neexistuje `config/nastaveni.md`**, jde o první spuštění → proveď **Setup** níže. Nic jiného nedělej, dokud není hotový.
2. Jinak si přečti `config/nastaveni.md` a `config/stav.md` (co je hotové a rozdělané) a pokračuj.
3. Na výrobu videí použij skill `cartoon-3d-short` (`.claude/skills/cartoon-3d-short/SKILL.md`).

## Setup (první spuštění)
Nejdřív se krátce představ: co studio umí (animovaná shorts 55-70 s, všechno se kreslí a renderuje kódem na jeho počítači,
bez AI generátoru videa) a že teď projdete nastavení (asi 10-15 minut).

### Krok 1: Nástroje
Zeptej se (AskUserQuestion), jestli chce, abys nástroje zkontroloval sám, nebo jestli ví, co má nainstalované
(možnosti: „Zkontroluj to sám (doporučeno)“, „Vím, co mám“). V obou případech je **ověř sám** příkazy:
- `node --version` (potřeba Node.js 18+, doporučeno LTS) a `npm --version`
- Python 3.10+: `python --version`, `py --version` nebo `python3 --version` (na Windows může `python` otevřít Microsoft Store
  → zkus `py`). Balíčky: `python -c "import numpy, scipy, PIL, faster_whisper"`
- `ffmpeg -version` a `ffprobe -version`
- volné místo na disku (render potřebuje desítky GB v temp složce)

Vypiš přehled: ✅ máš / ❌ chybí. Pro to, co chybí, napiš **přesně co nainstaluješ a jak**, zeptej se na souhlas a pak to nainstaluj:
- Windows: `winget install OpenJS.NodeJS.LTS`, `winget install Python.Python.3.12`, `winget install Gyan.FFmpeg`
- macOS: `brew install node python ffmpeg` (bez Homebrew mu dej odkaz na brew.sh a postup)
- Linux: balíčkovací systém distribuce
- Python balíčky: `python -m pip install -r requirements.txt`
Po instalaci přes winget je někdy nutné zavřít a znovu otevřít terminál (a spustit `claude` znovu): řekni to uživateli.
Nakonec `npm ci` (nainstaluje Remotion a three.js, ~850 MB, pár minut).

### Krok 2: Otázky (AskUserQuestion, max. 4 najednou)
První kolo:
1. **Jazyk videí:** čeština / angličtina / jiný.
2. **Hlavní postava:** „S moderátorem“ (stálá postava, která provází každé video, jako průvodce) /
   „Bez moderátora“ (vypravěč jen hlasem, na obrazovce postavy příběhu, jako klasická story shorts).
3. **Hlas:** „ElevenLabs (AI hlas)“ / „Vlastní nahrávka“ / „Zatím nevím“.
4. **Titulky ve videu:** ano (slovo po slovu) / ne.

Druhé kolo:
5. **Ukázkové skripty:** „Mám vlastní ukázky“ (skripty shorts, které se mu líbí a podle kterých má psát) /
   „Použij výchozí“ (`moje-skripty/vychozi/`). Když má vlastní: ať je vloží do chatu nebo uloží jako `.txt` do `moje-skripty/`.
   Ty, co vloží do chatu, ulož do `moje-skripty/<krátký-název>.txt` (jeden skript = jeden soubor). Potvrď, kolik jich je uloženo.
6. **Téma kanálu:** o čem budou videa (historie, věda, zdraví, zajímavosti …) a pro koho.
7. **Kde je velký disk:** kam dát temp složku renderu (např. `D:/remotion-tmp`; na Macu/Linuxu výchozí `~/remotion-tmp`).

Podle odpovědí:
- **S moderátorem:** zeptej se na jméno a vzhled (vlasy, barva oblečení, kšiltovka …). Uprav `src/characters/host.ts`
  (`HOST_NAME`, `HOST_OUTFIT`, `HOST_SEED`), vyrenderuj model sheet
  `npx remotion still src/index.ts HostSheet projekty/_postava/host_sheet.png` a ukaž mu ho (Read na PNG). Upravuj, dokud
  není spokojený. Pak už `HOST_SEED` neměň.
- **ElevenLabs:** ať si klíč vytvoří na elevenlabs.io (Profile → API Keys). Klíč **nesmí do chatu ani do této složky**.
  Ať ho sám uloží do souboru `~/.config/cartoon-3d-shorts/elevenlabs.key` (na Windows `C:\Users\<jméno>\.config\cartoon-3d-shorts\elevenlabs.key`)
  nebo nastaví proměnnou `ELEVENLABS_API_KEY`. Vytvoř mu prázdnou složku a řekni přesnou cestu. Když ti klíč přesto pošle do chatu,
  ulož ho tam za něj, nikdy ho nevypisuj zpátky a doporuč mu ho po setupu v ElevenLabs vyměnit.
  Pak s ním vyber hlas (voice_id z knihovny hlasů ElevenLabs; pro češtinu doporuč hlas, který umí česky, nebo klon jeho hlasu)
  a zapiš `config/hlas.json` podle `config/hlas.example.json` (`language`: `cs` / `en` …).
  Ověř klíč levně: `GET https://api.elevenlabs.io/v1/user` (hlavička `xi-api-key`), vypiš jen „klíč funguje“ a zbývající kredity.
- **Vlastní nahrávka:** vysvětli, že nahrávku uloží jako `projekty/<video>/voice/voice_raw.wav` a časy slov se udělají samy.
  Vyplň `config/hlas.json` jen s `language`.

### Krok 3: Test
Vyrenderuj 2 kontrolní snímky ukázkové scény (první render stáhne prohlížeč pro Remotion, ~130 MB):
`REMOTION_TMP=<temp složka> node scripts/stills.mjs projekty/_test/s_ 100,1500 0.4` (na Windows v PowerShellu
`$env:REMOTION_TMP="D:/remotion-tmp"; node scripts/stills.mjs projekty/_test/s_ 100,1500 0.4`). Prohlédni je a ukaž uživateli.
Když něco selže, oprav to (chybějící balíček, Chrome, GPU/WebGL) a zkus znovu.

### Krok 4: Ulož nastavení
Zapiš `config/nastaveni.md` (jazyk, moderátor ano/ne + jméno, hlas, titulky, téma a publikum, ukázkové skripty: vlastní/výchozí,
temp složka, verze nástrojů, datum) a `config/stav.md` („Setup hotový <datum>“). Pak uživateli shrň v 5 řádcích, co je nastavené,
a navrhni **3 témata na první video** podle jeho tématu kanálu.

## Trvalá pravidla
- Postup výroby a všechna pravidla videí: `SKILL.md`. Co už je nakreslené: `KNIHOVNA.md` (čti před kreslením čehokoli nového).
- Nejdřív skript (schválit) → hlas → kontrolní snímky (ukázat) → teprve celé video.
- Starší verze videí nikdy nepřepisuj. Nic nemaž bez dotazu (výjimka: úklid po schválení videa, viz SKILL.md).
- Velká videa (`*.mp4`) nikdy nenačítej do kontextu, jen přes ffmpeg/ffprobe a jednotlivé snímky.
- Cesty s mezerami a diakritikou vždy v uvozovkách.
- Po každém dokončeném kroku zapiš do `config/stav.md`, co je hotové a co zbývá.
- Co se naučíš (uživatel chce něco jinak, něco se pokazilo), zapiš do SKILL.md → „Naučená pravidla“.
- **Bezpečnost:** API klíče a hesla nikdy do této složky, do chatu ani do commitů. `.gitignore` hlídá `config/`, `projekty/`
  a soubory s klíči; když uživatel chce něco nahrát na GitHub, nejdřív zkontroluj `git status`, že tam nic z toho není.
