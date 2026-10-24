#!/usr/bin/env python3
"""Arranges the ad's music bed from three CC0 Freesound loops (all ~128 bpm), offline, into audio-src/music.wav.

Sources (CC0-1.0, in .flomotion/assets/freesound after `sound_get`):
  434103  "Loop 128 Bpm"            the bed (G major-ish, flat energy)
  429447  "Electro House drums"     drums
  560760  "Bright Piano 128bpm"     piano arp, in B: pitched down 4 semitones to sit in G with the bed

Arrangement on the 0.46875 s beat grid (30 s = 64 beats = 16 bars):
  beats  0-18   bed, low-passed and opening up (the pain: tense, muffled)
  beats  7-15   drum loop, high-passed to its hats (rising)
  beats 15-19   the turn: a breath (music ducks), then
  beat  19      THE DROP: full bed + full drums, kick-synced pumping
  beats 32-60   piano arp joins (the features)
  beats 62-64   fade out
Everything is measured, not heard: audition it.
"""
import os, subprocess, tempfile
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
BEAT = 60 / 128
BAR = BEAT * 4
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
FS = os.path.join(ROOT, ".flomotion", "assets", "freesound")
OUT = os.path.join(ROOT, "audio-src")
os.makedirs(OUT, exist_ok=True)


def decode(id, af=None):
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, "a.wav")
        cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", os.path.join(FS, f"{id}.mp3")]
        if af:
            cmd += ["-af", af]
        subprocess.run(cmd + ["-ar", str(SR), "-ac", "2", w], check=True, stdin=subprocess.DEVNULL)
        _, x = wavfile.read(w)
    return x.astype(np.float32) / 32768  # (n, 2)


def first_onset(x):
    m = np.abs(x).mean(axis=1)
    hop = 64
    env = np.array([np.sqrt((m[i:i + hop] ** 2).mean()) for i in range(0, len(m) - hop, hop)])
    return int(np.argmax(env > env.max() * 0.25) * hop)


def beat_period(x):
    """Beat period in seconds, from the autocorrelation of the onset envelope near 128 bpm."""
    m = np.abs(x).mean(axis=1)
    hop = 48
    env = np.array([np.sqrt((m[i:i + hop] ** 2).mean()) for i in range(0, len(m) - hop, hop)])
    on = np.maximum(np.diff(np.log(env + 1e-4)), 0)
    on -= on.mean()
    best, score = BEAT, -1
    for p in np.arange(BEAT * 0.94, BEAT * 1.06, 0.00025):
        k = p * SR / hop
        i = int(round(k))
        # sum over several beats for a stable estimate
        s = sum(np.dot(on[: len(on) - int(round(k * n))], on[int(round(k * n)):]) for n in (1, 2, 4, 8))
        if s > score:
            best, score = p, s
    return best


def snap(id, extra=None):
    """Decode a loop, trim to its first downbeat and stretch to exactly 128 bpm (ratio reported)."""
    x = decode(id, extra)
    x = x[first_onset(x):]
    p = beat_period(x)
    ratio = p / BEAT  # >1 means the loop is slower than 128: speed it up
    if abs(ratio - 1) > 0.008:
        # the estimate is off (these loops are labelled 128 and their lengths are whole bars): keep the tempo
        print(f"{id}: estimate {60 / p:.1f} bpm ignored, kept at 128")
        ratio = 1.0
    af = f"atempo={ratio:.5f}"
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "in.wav"), os.path.join(d, "out.wav")
        wavfile.write(a, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", a, "-af", af, b], check=True, stdin=subprocess.DEVNULL)
        _, y = wavfile.read(b)
    print(f"{id}: beat period {p:.4f}s -> 128 bpm, tempo ratio {ratio:.4f}")
    return y.astype(np.float32) / 32768


def sos(kind, f, order=4):
    return butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x, kind, f):
    return np.stack([sosfilt(sos(kind, f), x[:, c]) for c in range(2)], axis=1)


def tile(x, bars, total):
    n = int(bars * BAR * SR)
    seg = x[:n]
    reps = int(np.ceil(total / (bars * BAR))) + 1
    return np.tile(seg, (reps, 1))[: int(total * SR)]


TOTAL = 30.0
N = int(TOTAL * SR)
bed = snap("434103")
drums = snap("429447")
arp = snap("560760", "rubberband=pitch=" + str(2 ** (-4 / 12)))  # B -> G

bed16 = tile(bed, 16, TOTAL)
drums8 = tile(drums, 8, TOTAL)
arp8 = tile(arp, 8, TOTAL)


def seconds(beats):
    return beats * BEAT


def env_ramp(points):
    """Piecewise-linear gain over time: points = [(beat, gain)]."""
    t = np.arange(N) / SR
    bt = np.array([seconds(b) for b, _ in points])
    g = np.array([v for _, v in points])
    return np.interp(t, bt, g)[:, None]


# bed: muffled and opening during the pain, a breath at the turn, full from the drop
bed_lp = filt(bed16, "low", 1600)
bed_full = bed16
fade_full = env_ramp([(0, 0), (18.5, 0), (19, 1)])
bed_mix = bed_lp * (1 - fade_full) + bed_full * fade_full
bed_mix *= env_ramp([(0, 0.0), (0.2, 0.55), (15, 0.75), (15.5, 0.18), (18.6, 0.18), (19, 1.0), (62, 1.0), (64, 0.0)])

# kick-synced pumping after the drop (a sidechain feel)
pump = np.ones(N)
for b in range(19, 64):
    s = int(seconds(b) * SR)
    e = min(N, s + int(BEAT * SR))
    k = np.arange(e - s) / SR
    pump[s:e] = 1 - 0.38 * np.exp(-k / 0.11)
bed_mix *= pump[:, None]

# drums: hats only (high-passed) rising through the pain, cut for the breath, full from the drop
d_hp = filt(drums8, "high", 3500)
hats = env_ramp([(0, 0), (7, 0), (15, 1), (15.5, 0), (64, 0)])
full = env_ramp([(0, 0), (18.9, 0), (19, 1), (63, 1), (64, 0)])
d_mix = d_hp * hats + drums8 * full
music = bed_mix * 0.85 + d_mix * 0.9

# piano arp: joins at beat 32 (the features), stays to the end
a_gain = env_ramp([(0, 0), (31.9, 0), (32, 0.7), (62, 0.7), (64, 0)])
arp_start = int(seconds(32) * SR)
arp_track = np.zeros((N, 2), dtype=np.float32)
seg = arp8[: N - arp_start]
arp_track[arp_start: arp_start + len(seg)] = seg
music = music + arp_track * a_gain * 0.8

# loudness: leave headroom, the mix stage normalises the master
peak = np.abs(music).max()
music = music / peak * 0.8
wavfile.write(os.path.join(OUT, "music.wav"), SR, (np.clip(music, -1, 1) * 32767).astype(np.int16))
print("wrote", os.path.join(OUT, "music.wav"), "peak before scaling %.2f" % peak)
