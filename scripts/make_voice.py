"""Hlas: ElevenLabs TTS -> zkrácení pauz -> zrychlení -> hlasitost -> časy slov (words.json).

usage:  python scripts/make_voice.py projekty/<NN>_<slug>  [--speed 1.13] [--max-pause 0.08] [--no-tts]
        python scripts/make_voice.py projekty/<NN>_<slug> --no-tts   (vlastní nahrávka: ulož ji jako voice/voice_raw.mp3 nebo .wav)

nastavení: config/hlas.json  {"voice_id": "...", "model": "eleven_multilingual_v2", "language": "cs", "whisper_model": "medium"}
klíč:      proměnná prostředí ELEVENLABS_API_KEY, nebo soubor ~/.config/cartoon-3d-shorts/elevenlabs.key
           (MIMO tuhle složku, aby se nikdy nedostal na GitHub). Klíč se nikdy nevypisuje.

reads   <project>/voice/voice_script.txt   (přesně slova, která zazní; odstavec na beat je OK)
writes  <project>/voice/voice_raw.mp3      (straight from ElevenLabs; kept so edits can be redone without paying again)
        <project>/voice/voice.wav          (edited: pauses trimmed, pauses capped at max-pause, tempo x speed with pitch kept, -16 LUFS, 48 kHz mono)
        <project>/voice/words.json         ([{"w": word, "s": start_s, "e": end_s}, ...] measured on voice.wav)
--no-tts re-uses voice_raw.mp3 (to change speed/pauses without a new generation).
"""
import argparse, json, os, re, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_cfg_path = os.path.join(ROOT, "config", "hlas.json")
CFG = json.load(open(_cfg_path, encoding="utf-8")) if os.path.exists(_cfg_path) else {}
VOICE_ID = CFG.get("voice_id", "")
MODEL = CFG.get("model", "eleven_multilingual_v2")
LANG = CFG.get("language", "cs")
WHISPER = CFG.get("whisper_model", "small.en" if LANG == "en" else "medium")
SETTINGS = {"stability": 0.6, "similarity_boost": 0.8, "style": 0.0, "use_speaker_boost": True}  # one steady tone


def api_key() -> str:
    raw = os.environ.get("ELEVENLABS_API_KEY", "")
    if not raw:
        kf = os.path.join(os.path.expanduser("~"), ".config", "cartoon-3d-shorts", "elevenlabs.key")
        if os.path.exists(kf):
            raw = open(kf, encoding="utf-8-sig").read()
    m = re.search(r"sk_[A-Za-z0-9]+", raw)
    if not m:
        sys.exit("Chybí ElevenLabs klíč: nastav ELEVENLABS_API_KEY nebo ulož klíč do ~/.config/cartoon-3d-shorts/elevenlabs.key")
    return m.group()


def tts(text: str, out_mp3: str):
    if not VOICE_ID:
        sys.exit("Chybí voice_id v config/hlas.json")
    body = json.dumps({"text": text, "model_id": MODEL, "voice_settings": SETTINGS}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_192",
        data=body, headers={"xi-api-key": api_key(), "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r, open(out_mp3, "wb") as f:
            f.write(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs HTTP {e.code}: {e.read().decode()[:400]}")


SR = 48000


def tighten(a, max_pause: float, thr_db: float = -42.0, min_gap: float = 0.06, xf: float = 0.012):
    """Shorten every quiet run (10 ms RMS below thr_db re peak, longer than min_gap) to max_pause seconds,
    joining the two sides with an equal-power crossfade; head and tail trimmed to 40 ms."""
    import numpy as np
    hop = SR // 100
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1))
    db = 20 * np.log10(rms / (np.abs(a).max() + 1e-9) + 1e-9)
    quiet = db < thr_db
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            runs.append((i, j)); i = j
        else: i += 1
    keep_pad = int(0.04 * SR)
    out, pos = [], 0
    for (i, j) in runs:
        s, e = i * hop, j * hop
        if i == 0: pos = max(0, e - keep_pad); continue                 # lead-in silence
        if j >= n: out.append(a[pos: min(len(a), s + keep_pad)]); pos = len(a); break  # tail silence
        if (e - s) / SR < max(min_gap, max_pause): continue
        half = int(max_pause * SR / 2)
        out.append(a[pos: s + half]); pos = e - half                    # keep half the pause on each side
    out.append(a[pos:])
    # crossfade the joins
    L = int(xf * SR)
    res = out[0].copy()
    for seg in out[1:]:
        if len(res) > L and len(seg) > L:
            t = np.linspace(0, np.pi / 2, L, dtype=np.float32)
            res[-L:] = res[-L:] * np.cos(t) + seg[:L] * np.sin(t)
            res = np.concatenate([res, seg[L:]])
        else: res = np.concatenate([res, seg])
    return res


def edit(raw_mp3: str, out_wav: str, speed: float, max_pause: float):
    # pauses capped at max_pause (measured BEFORE the speed-up, so the final pause is max_pause / speed),
    # tempo-stretch with pitch kept, then EBU R128 loudness to -16 LUFS / -1.5 dBTP
    import numpy as np
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", raw_mp3, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    a = tighten(np.frombuffer(pcm, dtype=np.float32).copy(), max_pause)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-af", f"atempo={speed},loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "1", out_wav],
                   input=a.astype(np.float32).tobytes(), check=True)


def words(wav: str, out_json: str, script: str):
    import numpy as np
    from faster_whisper import WhisperModel
    # decode with ffmpeg (16 kHz mono float) instead of faster-whisper's PyAV loader, which breaks with av>=15
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", wav, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    model = WhisperModel(WHISPER, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, word_timestamps=True, language=LANG)  # NO initial_prompt: it made whisper hallucinate words (#02, #03)
    out = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
    json.dump(out, open(out_json, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    return out


def dur(path: str) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--speed", type=float, default=1.13)
    ap.add_argument("--max-pause", type=float, default=0.08)
    ap.add_argument("--no-tts", action="store_true")
    a = ap.parse_args()
    vdir = os.path.join(a.project, "voice")
    os.makedirs(vdir, exist_ok=True)
    script = open(os.path.join(vdir, "voice_script.txt"), encoding="utf-8").read().strip()
    raw, wav, wj = (os.path.join(vdir, n) for n in ("voice_raw.mp3", "voice.wav", "words.json"))
    if a.no_tts and not os.path.exists(raw) and os.path.exists(os.path.join(vdir, "voice_raw.wav")):
        raw = os.path.join(vdir, "voice_raw.wav")  # vlastní nahrávka
    if not a.no_tts:
        print(f"TTS: {len(script)} characters ...")
        tts(script, raw)
    edit(raw, wav, a.speed, a.max_pause)
    w = words(wav, wj, script)
    n_script = len(script.split())
    print(f"raw {dur(raw):.2f} s -> edited {dur(wav):.2f} s | {len(w)} words timed (script has {n_script}) | {len(w) / dur(wav):.2f} words/s")


if __name__ == "__main__":
    main()
