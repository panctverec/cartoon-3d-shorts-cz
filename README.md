# Animovaná 3D shorts s Claude Code 🎬

Zdarma studio pro **Claude Code**, které vyrábí svislá animovaná shorts (55-70 s) ve stylu
**„2D postavy v barevném 3D světě“**: kreslené postavičky s obrysem, malovaný 3D svět s černými linkami,
rozmazané pozadí, plynulá kamera, hlas, zvukové efekty a hudba.

Žádný AI generátor videa. Každý snímek postaví Claude kódem (three.js + Remotion) a vyrenderuje se na tvém počítači.

## Co umí
- **Celý postup od tématu po hotové video:** fakta → skript → hlas → záběry → kontrolní snímky → zvuk → render 2K → popis.
- **Engine:** nové video = jeden soubor se scénou. Kamera, světlo, obrysy, rozmazání, titulky a mix jsou hotové.
- **Knihovna objektů:** místnosti, nábytek, postavičky, info karty a efekty z předchozích videí. Co už jednou vzniklo,
  se jen použije, takže každé další video je rychlejší. Nové objekty se do knihovny přidávají samy.
- **Moderátor (volitelný):** stálá postava, která provází tvoje videa. Nebo videa bez ní, jen s postavami příběhu.
- **Titulky slovo po slovu**, hlas přes ElevenLabs nebo tvoje vlastní nahrávka.
- **Zvuk a hudba se generují kódem**, nic se nestahuje z hudebních knihoven.
- **Mluví česky.** Videa můžou být česky, anglicky nebo v jiném jazyce.

## Jak začít
1. Nainstaluj si [Claude Code](https://claude.com/claude-code) (potřebuješ předplatné Claude).
2. Stáhni tenhle repozitář (zelené tlačítko **Code → Download ZIP**) a rozbal ho, nebo `git clone`.
3. Otevři terminál ve složce a spusť `claude`.
4. Napiš třeba **„ahoj, nastav mi to“**. Claude se tě česky zeptá na pár věcí (jazyk videí, moderátor, hlas, titulky,
   ukázkové skripty), zkontroluje a případně nainstaluje, co chybí (Node.js, Python, FFmpeg), a udělá testovací render.
5. Pak už stačí: **„udělej mi video o …“**.

## Jak dostat ještě větší shodu s původním stylem
Studio už obsahuje změřené hodnoty stylu (obrysy, světlo, barvy, hloubka, pohyb kamery). Když chceš vzhled doladit
ještě přesněji, nebo podle **svého** oblíbeného kanálu:

1. **Nakopíruj referenční videa** do složky `moje-reference/`. Ideálně 5–10 shorts ve stylu, který chceš trefit,
   klidně i s přepisem (`.txt`). Čím víc videí, tím líp Claude pozná, co je pravidlo a co náhoda.
   Složka se na GitHub nenahrává.
2. **Řekni Claudovi, ať je rozebere do detailu**, například:
   > „Rozeber videa v moje-reference snímek po snímku. Změř střihy, pohyb kamery, světlo, barvy, tloušťku obrysů,
   > rozmazání pozadí, proporce a pohyb postav a tempo skriptu. Porovnej to s naším videem vedle sebe a uprav podle toho engine.“
3. Claude vytáhne snímky ze všech záběrů (u rychlých pohybů **každý snímek**), udělá kontaktní listy,
   změří hodnoty a uloží je do `moje-reference/analyza/ROZBOR.md`. Pak udělá **porovnání vedle sebe** (naše vs. reference)
   a upraví výchozí hodnoty enginu a skillu. Přesný postup má v `moje-reference/README.md`.
4. **Iteruj:** podívej se na porovnání, řekni, co ještě nesedí („obrysy jsou moc tlusté“, „kamera je moc pomalá“),
   a nech ho to opravit. Každé video pak vychází z vylepšených hodnot.

Tipy:
- Vybírej videa s **různými typy záběrů** (interiér, exteriér, detail, dav), ať se změří všechno.
- Rozbor snímek po snímku spotřebuje hodně tokenů. Začni 2–3 videi a přidávej postupně.
- Z referencí se berou jen čísla a postupy. Postavy, příběhy a věty ve tvých videích musí být vždycky tvoje.

## Co budeš potřebovat
| Co | Proč | Cena |
|---|---|---|
| Claude Code | dělá celou práci | předplatné Claude |
| Node.js, Python, FFmpeg | render, zvuk, časy slov | zdarma (Claude ti je nainstaluje) |
| ElevenLabs (volitelné) | AI hlas | placené plány; nebo nahraj hlas sám |
| Grafická karta, místo na disku | 3D render (2K video ~10 min), temp soubory desítky GB | – |

Remotion je pro jednotlivce a firmy do 3 lidí zdarma; větší firmy potřebují [licenci Remotionu](https://www.remotion.dev/license).

## Co je uvnitř
| Cesta | Co to je |
|---|---|
| `CLAUDE.md` | instrukce pro Clauda: první nastavení a pravidla |
| `.claude/skills/cartoon-3d-short/` | skill: postup výroby, `KNIHOVNA.md` (katalog objektů), vzorec stylu a změřené hodnoty vzhledu |
| `src/engine/` | motor: kamera, světlo, místnosti, postavy, post-processing |
| `src/library/`, `src/characters/` | knihovna kreseb a moderátor |
| `src/videos/priklad/` | ukázková 61s scéna, vzor pro každé nové video |
| `scripts/` | hlas, kontrolní snímky, zvuk a hudba, kontrola hotového videa |
| `moje-skripty/` | ukázkové skripty, podle kterých Claude píše (tvoje nebo výchozí) |
| `moje-reference/` | tvoje referenční videa pro doladění stylu (do Gitu se nenahrávají) |
| `projekty/` | tvoje videa (do Gitu se nenahrávají) |

## Bezpečnost
API klíč od ElevenLabs se ukládá **mimo tuhle složku** (`~/.config/cartoon-3d-shorts/elevenlabs.key`) nebo do proměnné
prostředí `ELEVENLABS_API_KEY`, takže se nikdy nedostane na GitHub. Tvoje nastavení, videa a nahrávky jsou v `.gitignore`.

## Licence
Kód a dokumentace: MIT (viz `LICENSE`). Příběh, postavy a hlas ve tvých videích by měly být vždy tvoje vlastní.
Ze stylových referencí se v tomhle repozitáři berou jen změřená čísla a vzorce, žádné cizí snímky, skripty ani postavy.
