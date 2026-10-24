#!/usr/bin/env python3
"""Builds the ad's audio sources into ../audio-src (run from anywhere).

Everything is original and synthesized here (numpy), nothing is sampled, so the rights are the author's:
- sfx/*.wav        short effects, each with a clear peak (the Sound element lines the peak up with the picture)
- music.wav        100 bpm bed (beat = 0.6 s) so every scene cut lands on a beat
- voice.wav, voice.srt   a GUIDE voice from macOS `say`, one line per beat, fitted to its window
These are placeholders to audition: replace the voice with a recording or ElevenLabs and the
effects/music with licensed ones if they do not sound right to you.
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "audio-src")
os.makedirs(os.path.join(OUT, "sfx"), exist_ok=True)
rng = np.random.default_rng(7)  # fixed seed: same files every run


def t_(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def save(path, x, stereo=False):
    x = np.clip(x, -1, 1)
    if stereo and x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wavfile.write(path, SR, (x * 32767).astype(np.int16))


def noise(d):
    return rng.standard_normal(int(d * SR))


# ---------------------------------------------------------------- effects
def whoosh(d=0.8, peak_at=0.32):
    t = t_(d)
    env = np.exp(-((t - peak_at) / 0.17) ** 2)
    x = noise(d)
    sweep = bp(x, 400, 3500) * env
    sweep += 0.4 * lp(x, 900) * np.exp(-((t - peak_at) / 0.25) ** 2)
    return norm(sweep, 0.8)


def hit(d=0.9):
    t = t_(d)
    f = 48 + 90 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
    click = hp(noise(d), 1500) * np.exp(-t * 120) * 0.5
    air = bp(noise(d), 200, 1200) * np.exp(-t * 9) * 0.25
    return norm(body + click + air, 0.95)


def tick(d=0.12):
    t = t_(d)
    return norm(np.sin(2 * np.pi * 2100 * t) * np.exp(-t * 90) + hp(noise(d), 3000) * np.exp(-t * 140) * 0.4, 0.7)


def pop(d=0.25):
    t = t_(d)
    f = 320 + 380 * np.exp(-t * 40)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18), 0.8)


def typekey(d=0.1):
    t = t_(d)
    return norm(bp(noise(d), 1800, 5200) * np.exp(-t * 110) + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 130) * 0.3, 0.6)


def pluck(freq=660.0, d=1.1):
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (6 + 5 * k)) for k, a in ((1, 1), (2, 0.5), (3, 0.3), (4, 0.15)))
    return norm(lp(x, 6000), 0.8)


def riser(d=1.4):
    t = t_(d)
    sweep = np.sin(2 * np.pi * np.cumsum(180 + 1500 * (t / d) ** 2.2) / SR) * 0.35
    n = bp(noise(d), 600, 7000) * (t / d) ** 2.5
    env = (t / d) ** 1.6
    out = (sweep + n) * env
    out[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    return norm(out, 0.85)


def glitch(d=0.32):
    t = t_(d)
    x = np.round(noise(d) * 4) / 4 * np.exp(-t * 9)
    x *= (np.sin(2 * np.pi * 38 * t) > -0.2)
    return norm(hp(x, 600), 0.7)


def chime(d=1.4):
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dec) for f, a, dec in ((1318.5, 1, 3.2), (1975.5, 0.6, 3.8), (2637, 0.3, 5.0)))
    return norm(x, 0.65)


SFX = {
    "whoosh": (whoosh(), "move/whip"),
    "hit": (hit(), "hit/boom"),
    "tick": (tick(), "ui/tick"),
    "pop": (pop(), "ui/pop"),
    "type": (typekey(), "ui/type"),
    "pluck": (pluck(), "tech/pluck"),
    "riser": (riser(), "move/riser"),
    "glitch": (glitch(), "tech/glitch"),
    "chime": (chime(), "tech/success"),
}
for name, (x, _) in SFX.items():
    save(os.path.join(OUT, "sfx", f"{name}.wav"), x)

# ---------------------------------------------------------------- music (100 bpm, bar = 2.4 s, 30 s)
BEAT = 0.6
TOTAL = 30.0
mus = np.zeros(int(TOTAL * SR) + SR)


def put(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n] * gain


def note(freq, d, kind="pad"):
    t = t_(d)
    if kind == "bass":
        x = (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t)) * np.minimum(t / 0.01, 1) * np.exp(-t * 3.2)
    elif kind == "pad":
        det = 1.003
        x = sum(np.sin(2 * np.pi * freq * m * t) / m for m in (1, 2, 3)) + sum(np.sin(2 * np.pi * freq * det * m * t) / m for m in (1, 2))
        x = x * np.minimum(t / 0.5, 1) * np.minimum((d - t) / 0.6, 1)
        x = lp(x, 1800)
    else:  # arp pluck
        x = sum(a * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * (9 + 6 * k)) for k, a in ((1, 1), (2, 0.4), (3, 0.2)))
    return x


def kick():
    t = t_(0.3)
    f = 42 + 110 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def hat():
    t = t_(0.08)
    return hp(noise(0.08), 7000) * np.exp(-t * 60)


N = {"A": 55.0, "F": 43.65, "C": 65.41, "G": 49.0}
CHORDS = {  # root, third, fifth (Hz) one octave up for pads/arps
    "Am": (55.0, 65.41, 82.41),
    "F": (43.65, 55.0, 65.41),
    "C": (65.41, 82.41, 98.0),
    "G": (49.0, 61.74, 73.42),
}
BARS = ["Am", "Am", "Am", "F", "C", "G", "Am", "F", "C", "G", "Am", "F", "C"]  # 0..29.3 s
for b, ch in enumerate(BARS):
    t0 = b * 4 * BEAT
    root, third, fifth = CHORDS[ch]
    # pad all the way through
    for f in (root * 4, third * 4, fifth * 4):
        put(mus, note(f, 4 * BEAT + 0.4, "pad"), t0, 0.07)
    put(mus, note(root * 2, 4 * BEAT, "pad"), t0, 0.05)
    tension = t0 < 7.2  # the pain section: sparse
    if not tension and t0 >= 7.2:
        for k in range(4):
            tt = t0 + k * BEAT
            if tt < 7.8:
                continue
            put(mus, kick(), tt, 0.55)
            put(mus, note(root * 2, BEAT * 0.9, "bass"), tt, 0.5)
            for h in (0.5,):
                put(mus, hat(), tt + h * BEAT, 0.07)
        # eighth-note arp
        pat = [0, 1, 2, 1, 0, 2, 1, 2]
        for k in range(8):
            if t0 + k * BEAT / 2 < 7.8:
                continue
            f = (root, third, fifth)[pat[k] % 3] * 8
            put(mus, note(f, 0.35, "arp"), t0 + k * BEAT / 2, 0.09)
    else:
        # pain: low pulse on each beat, ticking 16ths getting busier
        for k in range(4):
            tt = t0 + k * BEAT
            put(mus, note(root * 2, BEAT * 0.8, "bass"), tt, 0.35)
            put(mus, hat(), tt, 0.05 + 0.02 * b)
            put(mus, hat(), tt + BEAT / 2, 0.04 + 0.02 * b)
# final tail: fade out over the last second, a soft hit at the CTA
put(mus, hit(), 27.0, 0.5)
mus = mus[: int(TOTAL * SR)]
fade = np.ones_like(mus)
fade[-int(1.0 * SR):] = np.linspace(1, 0, int(1.0 * SR))
fade[: int(0.4 * SR)] = np.linspace(0, 1, int(0.4 * SR))
mus *= fade
mus = norm(mus, 0.8)
# gentle stereo width
left = mus
right = np.concatenate([np.zeros(int(0.011 * SR)), mus[: -int(0.011 * SR)]])
save(os.path.join(OUT, "music.wav"), np.stack([left, right], axis=1))

# ---------------------------------------------------------------- guide voice
VOICE = "Daniel"
LINES = [
    # id, start (s), latest end (s), spoken text (phonetic where needed), caption text
    # one phrase per entry: a phrase is placed on the picture's beat, so its cue is its real start
    ("p01", 0.10, 1.30, "Describe the video.", "Describe the video."),
    ("p02", 1.35, 2.32, "Watch it build.", "Watch it build."),
    ("p03", 2.55, 3.65, "Timelines.", "Timelines."),
    ("p04", 3.75, 4.85, "Dragging.", "Dragging."),
    ("p05", 4.95, 6.05, "Exporting.", "Exporting."),
    ("p06", 6.15, 7.10, "Again.", "Again."),
    ("p07", 7.95, 9.10, "Meet flow motion.", "Meet flomotion."),
    ("p08", 9.20, 10.70, "One T S X file.", "One TSX file."),
    ("p09", 10.95, 13.25, "Claude edits it through typed tools.", "Claude edits it through typed tools."),
    ("p10", 13.35, 14.90, "You watch it happen.", "You watch it happen."),
    ("p11", 15.15, 18.40, "Every control is a typed prop.", "Every control is a typed prop."),
    ("p12", 18.75, 20.90, "Seventeen checks before you look.", "Seventeen checks before you look."),
    ("p13", 21.15, 23.90, "Every sound and font, licensed.", "Every sound and font, licensed."),
    ("p14", 24.15, 25.55, "Thirty nine tools.", "Thirty-nine tools."),
    ("p15", 25.45, 26.97, "Same video every time.", "Same video every time."),
    ("p16", 27.15, 29.60, "Start with N P X flow motion.", "Start with npx flomotion."),
]


def say_line(text, rate):
    with tempfile.TemporaryDirectory() as d:
        a = os.path.join(d, "a.aiff")
        w = os.path.join(d, "a.wav")
        subprocess.run(["say", "-v", VOICE, "-r", str(rate), "-o", a, text], check=True, stdin=subprocess.DEVNULL)
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", a, "-ar", str(SR), "-ac", "1", w], check=True)
        sr, x = wavfile.read(w)
    x = x.astype(np.float32) / 32768
    keep = np.where(np.abs(x) > 0.01)[0]
    return x[keep[0]: keep[-1] + 1]


voice = np.zeros(int(TOTAL * SR))
cues, report = [], []
for lid, start, end, spoken, shown in LINES:
    rate = 165
    x = say_line(spoken, rate)
    while len(x) / SR > end - start and rate < 260:
        rate += 8
        x = say_line(spoken, rate)
    dur = len(x) / SR
    put(voice, x, start)
    cues.append((start, start + dur, shown))
    report.append({"id": lid, "start": start, "end": round(start + dur, 3), "window_end": end, "rate": rate, "fits": start + dur <= end + 0.001})
voice = norm(voice, 0.9)
save(os.path.join(OUT, "voice.wav"), voice)


def stamp(s):
    h, m, sec = int(s // 3600), int(s % 3600 // 60), s % 60
    return f"{h:02d}:{m:02d}:{sec:06.3f}".replace(".", ",")


with open(os.path.join(OUT, "voice.srt"), "w") as f:
    for i, (a, b, text) in enumerate(cues, 1):
        f.write(f"{i}\n{stamp(a)} --> {stamp(b)}\n{text}\n\n")
with open(os.path.join(OUT, "voice.report.json"), "w") as f:
    json.dump({"voice": VOICE, "lines": report}, f, indent=2)
print(json.dumps(report, indent=1))
print("wrote", os.path.abspath(OUT))
