"""VZOR zvuku jednoho videa (ukázková 61s scéna Priklad): mapa hudby (SECTIONS) + zvukové efekty (events) nad scripts/audio_kit.py.
Pro nové video: zkopíruj do projekty/<NN>_<slug>/audio/make_audio.py, přepiš TOTAL, SECTIONS a events podle words.json.
usage: python projekty/<NN>_<slug>/audio/make_audio.py      (REMUSIC=1 = znovu vygenerovat hudbu z cache)
"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
ROOT = os.path.dirname(os.path.dirname(PROJ))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from audio_kit import (render, R, I, G, S, tone, beep, click, pop, noise_burst, boom, bell, harp_gliss, sparkle, ns, tt, fades, lp, hp, bp)

TOTAL = 1830
SECTIONS = [
    (0.00, 5.05, "hook", ["C", "F", "C", "G"], {"box": 0.5, "bass": 0.55, "sneak": True}),
    (5.10, 10.70, "morning", ["C", "G", "Am", "F"], {"box": 0.5, "pad": 0.3, "bass": 0.55, "brush": 0.3}),
    (10.70, 17.20, "oops", ["Am", "Dm", "E", "Am"], {"box": 0.4, "bass": 0.65, "sneak": True}),
    (17.20, 25.80, "tension", ["Am", "Am", "F", "E"], {"pad": 0.4, "bass": 0.75, "ostinato": True}),
    (30.50, 46.60, "bouncy", ["F", "G", "C", "Am"], {"box": 0.5, "pad": 0.25, "bass": 0.7, "brush": 0.4, "busy": True}),
    (46.60, 55.35, "lift", ["C", "G", "Am", "F"], {"glock": 0.5, "pad": 0.3, "bass": 0.65, "brush": 0.45}),
    (55.35, TOTAL / 30, "end", ["C", "F", "G", "C"], {"box": 0.5, "pad": 0.4, "bass": 0.5, "final": 59.62}),
]


def thud(r):
    return S(lp(noise_burst(r, 60, 500, 0.18, 0.003, 0.06), 600), tone(70, 50, 0.15, 0.8))


def stretch(r, dur=0.5):
    return noise_burst(r, 300, 2500, dur, 0.05, dur * 0.6, 0.7, 18)


def zipper(r, dur=0.45, up=True):
    y = noise_burst(r, 1500, 7000, dur, 0.01, dur, 0.9, 55)
    return y * np.linspace(0.5, 1.0, len(y)) if up else y


def fwump(r):
    return lp(noise_burst(r, 80, 900, 0.35, 0.02, 0.15), 900)


def power_up(r):
    y = np.zeros(ns(1.2))
    for k, m in enumerate([60, 64, 67, 72, 76, 79]):
        g = I.glock(I.m2f(m), 0.5, r, 1.0)
        i = ns(k * 0.07)
        y[i:i + len(g)] += g[: len(y) - i]
    return S(y, 0.4 * tone(300, 1200, 0.5, 0.5))


def roll_beeps(r, t0, dur=1.2):
    out = []
    t = t0
    while t < t0 + dur:
        out.append((t, beep(1800, 0.025, 1), -22, 0.0))
        t += 0.08
    out.append((t0 + dur, beep(2400, 0.06, 2, 0.1), -12, 0.0))
    return out


def events(words):
    r = R
    ev = []
    E = lambda t, x, db=0.0, p=0.0: ev.append((t, x, db, p))
    # hook
    E(0.0, thud(r), -8)
    ev += roll_beeps(r, 0.05)
    E(1.42, stretch(r, 0.6), -12)
    E(2.64, G.whoosh(0.3, r, 0.12), -14)
    E(4.90, G.whoosh(0.5, r, 0.3, 500, 4000), -8)                     # flash
    # morning
    E(5.2, noise_burst(r, 2000, 8000, 0.12, 0.003, 0.05, 0.8, 40), -12, -0.3)   # toast crunch
    E(5.6, noise_burst(r, 2000, 8000, 0.1, 0.003, 0.05, 0.8, 40), -14, -0.3)
    E(7.30, beep(2400, 0.06, 2, 0.1), -10)
    for k in range(3):
        E(8.7 + 0.5 * k, stretch(r, 0.4), -12, 0.2 * (-1) ** k)
    E(10.28, tone(300, 180, 0.35, 0.6), -12)                          # "nope"
    # oops
    E(10.70, beep(2400, 0.06, 2, 0.1), -12)
    E(12.30, stretch(r, 0.55), -10)
    E(12.84, pop(r), -4); E(12.9, G.clink(r, 3200, 0.1), -10, 0.4); E(13.15, G.clink(r, 2700, 0.1), -14, 0.6)  # button pings off
    E(13.56, tone(400, 260, 0.3, 0.5), -12, -0.3)                     # dress: hmph
    E(15.40, I.triangle(0.6, r, 1.2, 2600), -12, 0.4)                 # mirror ting
    E(16.0, tone(900, 1300, 0.12, 0.4), -16, 0.4)                     # eek
    # scan
    E(17.26, pop(r), -8)
    E(20.16, tone(300, 800, 1.3, 0.45), -14)
    E(22.76, tone(700, 300, 0.9, 0.45), -14)
    E(24.30, beep(2400, 0.06, 2, 0.1), -12)
    # deadpan
    E(25.95, G.crickets(1.6, r), -16)
    E(28.30, tone(420, 200, 0.4, 0.5), -10, 0.3)                      # scale shrugs
    # suitcase
    E(30.52, G.whoosh(0.4, r, 0.2), -12)
    for k in range(3):
        E(31.5 + 0.28 * k, S(G.clink(r, 900 + 200 * k, 0.2), thud(r) * 0.5), -10)  # dumbbells out
    for k in range(3):
        E(33.35 + 0.4 * k, fwump(r), -8)                              # pillows in
    E(35.00, beep(2400, 0.06, 2, 0.1), -12)
    E(36.04, zipper(r, 0.5), -8); E(36.5, tone(500, 200, 0.4, 0.6), -10)   # zipper fails
    E(37.95, pop(r), -8)
    E(38.0, tone(500, 300, 0.4, 0.4), -16)
    E(40.30, G.whoosh(0.5, r, 0.25), -12)
    E(42.6, lp(noise_burst(r, 80, 600, 1.2, 0.3, 0.8), 700), -12)    # cozy settle
    E(44.44, pop(r), -8)
    E(45.0, G.whoosh(0.8, r, 0.1, 2500, 400), -12)                   # flame shrinks
    # lift
    E(46.62, G.whoosh(0.5, r, 0.25), -12)
    t = 47.4
    while t < 52.8:
        E(t, G.whoosh(0.3, r, 0.12, 400, 1600), -18, 0.2)             # each press
        t += 1.96
    E(51.90, power_up(r), -4, 0.3)
    E(52.90, pop(r), -8)
    E(53.8, noise_burst(r, 2500, 7000, 0.12, 0.005, 0.06), -14); E(54.3, noise_burst(r, 2500, 7000, 0.12, 0.005, 0.06), -14)  # pen ticks
    # callback
    E(55.38, thud(r), -10)
    ev += roll_beeps(r, 55.45)
    E(57.30, zipper(r, 0.35), -10); E(57.7, sparkle(r), -8)          # buttons in one go
    E(58.70, sparkle(r), -12)
    return ev


if __name__ == "__main__":
    render(PROJ, SECTIONS, events, TOTAL)
