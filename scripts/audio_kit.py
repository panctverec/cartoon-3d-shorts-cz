"""Shared sound kit for the shorts (synthesized SFX + original score + mix; nothing downloaded).
A video's make_audio.py defines SECTIONS (music map) and events(words) (SFX list) and calls render(...).
Standard (SKILL.md): voice unchanged, music bed -10 LU under the voice and ducked -3 dB while she speaks,
SFX at the voice's momentary max -6 dB (+ per-event offset), master -15 LUFS, limiter; mux with volume=-1 dB.
"""
import os, sys, json
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts", "audio"))
from dsp import (SR, ns, tt, dbg, rng, lp, hp, bp, fades, pan, st, place, widen, make_ir, convolve_st, read_wav, write_wav,
                 integrated, momentary_max, true_peak, colored, smooth_noise, modal)
import instruments as I
import sfx_gen as G

FPS = 30
R = rng(7)
BPM = 96.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
CH = {
    "C": [48, 52, 55, 60], "Am": [45, 52, 57, 60], "F": [41, 53, 57, 60], "G": [43, 55, 59, 62],
    "E": [40, 52, 56, 59], "Dm": [50, 53, 57, 62], "Em": [40, 52, 55, 59], "D": [50, 54, 57, 62], "Bb": [46, 50, 53, 58],
}

def music(SECTIONS, N, DUR):
    out = np.zeros((2, N))
    rr = rng(11)
    for (a, b, name, chords, L) in SECTIONS:
        t = a
        bar = 0
        while t < b - 0.05:
            ch = CH[chords[bar % len(chords)]]
            bar_end = min(b, t + BAR)
            dur = bar_end - t
            if L.get("pad"):
                place(out, I.pad([I.m2f(m) for m in ch[1:]], dur, vel=L["pad"], r=rr, att=0.4, rel=0.6, warm=700), t, 0.5)
            if L.get("vibes"):
                for k, m in enumerate(ch[1:] + [ch[1] + 12, ch[2] + 12]):
                    place(out, pan(I.vibes(I.m2f(m + 12), L["vibes"], rr, 1.8), -0.3 + 0.15 * k), t + k * 0.11, 0.5)
            if L.get("bass"):
                steps = [0, 2] if not L.get("busy") else [0, 1, 2, 3]
                for s in steps:
                    ts = t + s * BEAT
                    if ts >= bar_end:
                        continue
                    m = ch[0] - 12 + (7 if s % 2 and L.get("busy") else 0)
                    place(out, pan(I.pluck(I.m2f(m), L["bass"], rr, 0.7, bright=0.3), -0.1), ts, 0.9)
            if L.get("sneak"):  # staccato tiptoe line on the off-beats
                for s, d in [(0.5, 0), (1.5, 2), (2.5, 1), (3.5, 3)]:
                    ts = t + s * BEAT
                    if ts < bar_end:
                        place(out, pan(I.pluck(I.m2f(ch[d % 4] + 12), 0.45, rr, 0.25, bright=0.7), 0.25), ts, 0.7)
            if L.get("ostinato"):  # tension: eighth-note pulse, rising, crescendo to the DING
                k8 = int(dur / (BEAT / 2))
                for i in range(k8):
                    ts = t + i * BEAT / 2
                    u = (ts - a) / (b - a)
                    m = ch[0] + 12 + (i % 2) * 7 + int(u * 5)
                    place(out, pan(I.pluck(I.m2f(m), 0.35 + 0.5 * u, rr, 0.3, bright=0.6), 0.15 * (-1) ** i), ts, 0.8)
            if L.get("brush"):
                for s in (1, 3):
                    ts = t + s * BEAT
                    if ts < bar_end:
                        place(out, pan(I.brush(L["brush"], rr, 0.3), 0.2), ts, 0.8)
            if L.get("box"):  # music-box arpeggio in eighths (slower in "night")
                step = BEAT if L.get("slow") else BEAT / 2
                pat = [1, 2, 3, 2, 1, 3, 2, 3] if not L.get("minor") else [1, 3, 2, 3, 1, 2, 3, 2]
                i = 0
                while t + i * step < bar_end - 0.02:
                    m = ch[pat[i % 8]] + 24
                    place(out, pan(I.musicbox(I.m2f(m), L["box"] * (0.8 + 0.2 * (i % 2 == 0)), rr, 1.4), 0.3 * np.sin(i)), t + i * step, 0.45)
                    i += 1
            if L.get("glock"):  # tip: bright rising motif once per bar
                for k, s in enumerate([0, 0.5, 1, 2]):
                    m = [ch[1], ch[2], ch[3], ch[3] + 2][k] + 24
                    place(out, pan(I.glock(I.m2f(m), L["glock"], rr, 1.5), 0.2), t + s * BEAT, 0.5)
            t += BAR
            bar += 1
        if L.get("final"):  # last chord rings out on "anything" (final = its time in s; True = 63.9 for #01)
            FT = 63.9 if L["final"] is True else float(L["final"])
            place(out, I.pad([I.m2f(m) for m in CH["C"][1:] + [64]], 1.6, vel=0.5, r=rr, att=0.05, rel=1.2), FT, 0.6)
            for k, m in enumerate([72, 76, 79, 84]):
                place(out, I.glock(I.m2f(m), 0.5, rr, 2.0), FT + 0.07 * k, 0.5)
    ir = make_ir(1.4, 3)
    out = 0.8 * out + 0.25 * convolve_st(out, ir)[:, :N]
    return out



# ====================================================================== sfx helpers

def S(*xs):
    """sum mono signals of different lengths (zero-padded)"""
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


def tone(f0, f1, dur, vel=1.0, kind="sine"):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) if kind == "sine" else np.sign(np.sin(ph)) * 0.4
    return fades(y * vel * np.exp(-t / (dur * 0.6)), 0.002, 0.02)


def beep(f=2400, dur=0.09, n=2, gap=0.12):
    y = np.zeros(ns(n * gap + dur))
    for k in range(n):
        b = lp(tone(f, f, dur, 0.6, "square"), 6000)
        y[ns(k * gap): ns(k * gap) + len(b)] += b
    return y


def click(r, bright=1.0):
    t = tt(0.04)
    return S(hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.003) * 0.6 * bright, tone(1800, 1200, 0.03, 0.3))


def pop(r):
    return S(tone(300, 900, 0.07, 0.8), 0.2 * click(r))


def noise_burst(r, lo, hi, dur, att=0.01, rel=None, am=0.0, am_rate=0.0):
    n = ns(dur)
    t = np.arange(n) / SR
    y = bp(r.standard_normal(n), lo, hi, 2)
    env = np.minimum(1, t / att) * np.exp(-t / (rel or dur * 0.4))
    if am:
        env *= 1 - am + am * (0.5 + 0.5 * np.sin(2 * np.pi * am_rate * t + r.uniform(0, 6)))
    return fades(y * env, 0.002, 0.02)


def boom(r):
    t = tt(1.2)
    return np.sin(2 * np.pi * (48 + 40 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.35) + 0.3 * lp(r.standard_normal(len(t)), 300) * np.exp(-t / 0.05)


def bell(r):
    y = modal(2.6, [(1568, 1.0, 1.6), (1568 * 2.76, 0.5, 0.6), (1568 * 5.4, 0.25, 0.25), (784, 0.35, 1.2)], r)
    return S(y, I.triangle(0.6, r, 1.6, 2350) * 0.6)


def snore(r, dur=1.1):
    n = ns(dur)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    buzz = lp(np.sign(np.sin(2 * np.pi * (62 + 6 * np.sin(2 * np.pi * 3 * t)) * t)) * 0.5 + 0.5 * r.standard_normal(n), 900)
    return buzz * env * 0.5


def harp_gliss(r, up=True):
    notes = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]
    if not up:
        notes = notes[::-1]
    y = np.zeros(ns(1.8))
    for k, m in enumerate(notes):
        p = I.pluck(I.m2f(m), 0.5, r, 1.0, bright=0.6)
        i = ns(k * 0.045)
        y[i:i + len(p)] += p[: len(y) - i]
    return y


def sparkle(r):
    y = np.zeros(ns(1.6))
    for k, m in enumerate([84, 88, 91, 96]):
        g = I.glock(I.m2f(m), 0.5, r, 1.2)
        i = ns(k * 0.06)
        y[i:i + len(g)] += g[: len(y) - i]
    return y



# ====================================================================== mix

def speech_spans(words, merge=0.3):
    spans = []
    for w in words:
        if spans and w["s"] - spans[-1][1] < merge:
            spans[-1][1] = w["e"]
        else:
            spans.append([w["s"], w["e"]])
    return spans


def duck(spans, N, DUR, depth_db=-3.0, att=0.07, rel=0.45):
    g = np.zeros(N)
    for a, b in spans:
        g[ns(max(0, a - 0.08)): ns(min(DUR, b + 0.12))] = 1
    k = ns(0.01)
    sm = np.convolve(g, np.ones(max(1, ns(att))) / max(1, ns(att)), "same")
    sm = np.maximum(sm, np.convolve(g, np.ones(ns(rel)) / ns(rel), "same") * 0.9)
    return dbg(depth_db * np.clip(sm, 0, 1))


def limiter(x, ceil_db=-1.2, look=0.003, rel=0.08):
    ceil = dbg(ceil_db)
    peak = np.max(np.abs(x), axis=0)
    L = ns(look)
    pk = np.maximum.accumulate(np.pad(peak, (0, L))[L:]) if False else np.array([0])
    # sliding max over the look-ahead window
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(peak, size=2 * L + 1)
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    # release smoothing (one-pole up, instant down)
    a = np.exp(-1 / (rel * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    return x * out[None, :]


def render(proj, SECTIONS, events, total_frames, remusic=False):
    """proj = projects/<video> folder. Writes proj/audio/mix.wav (+ stems) and returns the mix path."""
    HERE = os.path.join(proj, "audio"); os.makedirs(HERE, exist_ok=True)
    DUR = total_frames / FPS; N = ns(DUR)
    words = json.load(open(os.path.join(proj, "voice", "words.json"), encoding="utf8"))
    v, sr = read_wav(os.path.join(proj, "voice", "voice.wav"))
    assert sr == SR, sr
    voice = np.zeros((2, N)); vs = st(v[0])[:, :N]; voice[:, : vs.shape[1]] = vs
    v_lufs = integrated(voice)
    print("voice integrated", round(v_lufs, 2), "LUFS")
    cache = os.path.join(HERE, "_music_cache.npy")
    if os.path.exists(cache) and not remusic and os.environ.get("REMUSIC") != "1":
        m = np.load(cache)
    else:
        m = music(SECTIONS, N, DUR); np.save(cache, m)
    m = m * dbg((v_lufs - 10.0) - integrated(m))
    m = m * duck(speech_spans(words), N, DUR)[None, :]
    v_mom = momentary_max(voice)
    s = np.zeros((2, N))
    for (t, x, db, p) in events(words):
        y = st(x) if np.ndim(x) == 2 else pan(np.asarray(x, float), p)
        mm = momentary_max(y if y.shape[1] > ns(0.45) else np.pad(y, ((0, 0), (0, ns(0.45) - y.shape[1]))))
        if not np.isfinite(mm):
            continue
        place(s, y * dbg((v_mom - 6.0 + db) - mm), t)
    mix = voice + m + s
    mix *= dbg(-15.0 - integrated(mix))
    mix = limiter(mix)
    write_wav(os.path.join(HERE, "mix.wav"), mix)
    for name, x in (("stem_voice", voice), ("stem_music", m), ("stem_sfx", s)):
        write_wav(os.path.join(HERE, name + ".wav"), x)
    print("mix", round(integrated(mix), 2), "LUFS, true peak", round(true_peak(mix), 2), "dBTP, length", round(mix.shape[1] / SR, 3), "s")
    return os.path.join(HERE, "mix.wav")
