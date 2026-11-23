"""Video bez hlasu: umělé časy slov (words.json) z textu skriptu, jako by mluvil vypravěč.
Délka slova ~ počet slabik, pauzy za čárkou/tečkou. Titulky a klíče kamery pak jedou na tyhle časy.
usage: python scripts/fake_words.py projekty/<NN>_<slug> [slova_za_sekundu]
  čte  projekty/<NN>_<slug>/voice/voice_script.txt
  píše projekty/<NN>_<slug>/voice/words.json (stejný formát jako make_voice.py)
Výchozí tempo: angličtina 3.7 slova/s, čeština 3.2 (podle config/hlas.json → language).
"""
import json, os, re, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
proj = sys.argv[1]
lang = "en"
try:
    lang = json.load(open("config/hlas.json", encoding="utf-8")).get("language", "en")
except Exception:
    pass
target = float(sys.argv[2]) if len(sys.argv) > 2 else (3.2 if lang == "cs" else 3.7)

txt = open(os.path.join(proj, "voice", "voice_script.txt"), encoding="utf-8").read()
words = txt.split()
VOW = r"[aeiouyáéěíóúůý]+"


def syl(w):
    w = re.sub(r"[^a-záčďéěíňóřšťúůýž]", "", w.lower())
    n = len(re.findall(VOW, w))
    if lang == "en" and w.endswith("e") and not w.endswith("le") and len(w) > 3:
        n -= 1
    return max(1, n)


PAUSE = {",": 0.10, ":": 0.14, ";": 0.14, ".": 0.22, "?": 0.24, "!": 0.22}
BASE = 0.045
# PER_SYL dopočítat tak, aby celkové tempo sedělo na target slov/s
pauses = sum(PAUSE.get(w[-1], 0.0) for w in words)
total = len(words) / target
per_syl = max(0.05, (total - pauses - BASE * len(words)) / sum(syl(w) for w in words))

t, out = 0.10, []
for w in words:
    d = BASE + per_syl * syl(w)
    out.append({"w": w, "s": round(t, 3), "e": round(t + d, 3)})
    t += d + PAUSE.get(w[-1], 0.0)
json.dump(out, open(os.path.join(proj, "voice", "words.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(len(out), "slov, konec", out[-1]["e"], "s")
start = True
for i, x in enumerate(out):  # začátky vět → klíče kamery
    if start:
        print(f'{x["s"]:6.2f} f{round(x["s"]*30):5d}  ' + " ".join(y["w"] for y in out[i:i+6]))
    start = x["w"][-1] in ".?!:"
