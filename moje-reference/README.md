# Moje reference (videa, podle kterých ladíš styl)

Sem nakopíruj shorts, jejichž vzhled chceš co nejvěrněji trefit (`.mp4`, `.webm`, `.mov` …), a k nim případně přepis (`.txt`).
Tahle složka se **nenahrává na GitHub** (cizí videa nesmí do repozitáře). Na GitHubu je jen tenhle README.

```
moje-reference/
  video1.mp4
  video1.txt        ← přepis (volitelné; když chybí, Claude ho udělá přes Whisper)
  video2.mp4
  analyza/          ← sem Claude ukládá snímky, kontaktní listy a měření (vytvoří se samo)
```

**Víc videí = přesnější výsledek.** Jedno video ukáže jeden styl záběru. 5–10 videí ukáže, co je u toho stylu pravidlo
a co jen náhoda (tempo střihu, světlo, typické záběry, jak se postavy hýbou).

## Pokyny pro Clauda (rozbor referencí)
Když uživatel řekne „rozeber reference“ (nebo podobně), postupuj takhle. Výsledky piš jako **čísla a vzorce, ne dojmy**.

1. **Inventura:** `ffprobe` u každého videa (délka, rozlišení, fps). Chybí-li přepis, udělej ho přes faster-whisper s časy slov.
2. **Střihy:** detekce scén (`ffmpeg -i v.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null -`) → délky záběrů
   (průměr, medián, nejkratší, nejdelší), kolik záběrů na video, kde padají střihy vůči slovům.
3. **Snímek po snímku:** ke každému záběru vytáhni 3 snímky (začátek, střed, konec) do `analyza/<video>/`;
   u rychlých pohybů kamery a efektů i **každý snímek** daného úseku (`-vf "select=between(n\,A\,B)" -vsync 0`).
   Ze snímků udělej kontaktní listy (mřížka 4×4) a prohlédni je (Read na JPG/PNG).
4. **Změř a zapiš** (do `analyza/ROZBOR.md`) u každého videa:
   - **kamera:** typy pohybu (push-in, švenk, oblet, cut), rychlost, ohnisko (široký/teleobjektiv), výška kamery;
   - **světlo a barvy:** barva pozadí, světel a stínů (hex z pixelů), kontrast, saturace, vinětace;
   - **obrysy:** tloušťka čar v px při 1080 šířky, barva, na čem obrysy jsou a na čem ne;
   - **hloubka:** jak moc je rozmazané pozadí, kde je ostrost;
   - **postavy:** proporce (hlava : tělo), oči, pusa, kolik výrazů, jak chodí a gestikulují (snímek po snímku);
   - **textury a svět:** materiály, detail, co je 3D a co 2D;
   - **info karty, text, titulky:** velikost, font, pozice, jak dlouho visí;
   - **skript:** slova za sekundu, délka hooku, beaty, kde je pointa;
   - **zvuk:** hudba vs. hlas (LUFS), kde jsou efekty.
5. **Porovnej s naším výstupem:** vyrenderuj stejné typy záběrů z našeho videa a postav je vedle sebe
   (`python scripts/sbs_sheet.py porovnani.jpg --ours a.jpg b.jpg --ref r1.jpg r2.jpg`). Vypiš konkrétní rozdíly
   („naše obrysy 3 px, reference 2 px“, „pozadí u nás o 20 % světlejší“).
6. **Zapiš to do skillu:** nové hodnoty do `.claude/skills/cartoon-3d-short/reference/reporty/` a `vzhled-a-pasti.md`,
   vzorec skriptu do `vzorec-stylu.md`, uprav výchozí hodnoty v `src/engine/` (světlo, obrysy, rozmazání, kamera).
   Ověř stills (před/po) a ukaž uživateli porovnání.

**Pravidlo originality:** z referencí se berou jen čísla, tempo a řemeslo. Nikdy se nekopírují postavy, příběhy, věty,
loga ani konkrétní záběry. Snímky referencí zůstávají jen v `moje-reference/` na tvém počítači.
