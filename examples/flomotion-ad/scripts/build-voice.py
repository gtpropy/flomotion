#!/usr/bin/env python3
"""Places the ElevenLabs phrase clips (assets/voice/p01..p14.mp3) on the 128 bpm beat grid.

Writes audio-src/voice.wav (30 s, mono, 48 kHz) and audio-src/voice.words.json (word timings in video time,
with display spellings: "flow-motion." -> "flomotion.", "T S X" -> "TSX", "N P X" -> "npx").
A phrase that would overrun its window is sped up a little (at most 1.2x on top of the 1.1 speed it was made at).
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from scipy.io import wavfile

SR = 48000
BEAT = 60 / 128
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
OUT = os.path.join(ROOT, "audio-src")
os.makedirs(OUT, exist_ok=True)

# id, start (s, on the beat unless noted), window end (s)
PLACE = [
    ("p01", 0.10, 7 * BEAT),
    ("p02", 7 * BEAT, 9 * BEAT),
    ("p03", 9 * BEAT, 11 * BEAT),
    ("p04", 11 * BEAT, 13 * BEAT),
    ("p05", 13 * BEAT, 15 * BEAT + 0.3),
    ("p06", 19 * BEAT, 25 * BEAT),
    ("p07", 25 * BEAT, 28 * BEAT),
    ("p08", 28 * BEAT, 32 * BEAT),
    ("p09", 32 * BEAT, 39 * BEAT),
    ("p10", 39 * BEAT, 45 * BEAT),
    ("p11", 45 * BEAT, 52 * BEAT + 0.02),
    ("p12", 52 * BEAT, 25.55),
    ("p13", 25.55, 27.19),
    ("p14", 58 * BEAT, 64 * BEAT),
]
DISPLAY = {"flow-motion.": "flomotion.", "flow-motion": "flomotion"}


def load(id, tempo):
    mp3 = os.path.join(ROOT, "assets", "voice", f"{id}.mp3")
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, "a.wav")
        af = [] if abs(tempo - 1) < 1e-3 else ["-af", f"atempo={tempo:.4f}"]
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", mp3, *af, "-ar", str(SR), "-ac", "1", w], check=True, stdin=subprocess.DEVNULL)
        sr, x = wavfile.read(w)
    return x.astype(np.float32) / 32768


out = np.zeros(int(30 * SR))
words_out = []
report = []
for id, start, window_end in PLACE:
    words = json.load(open(os.path.join(ROOT, "assets", "voice", f"{id}.words.json")))
    speech_end = words[-1]["end"]
    tempo = 1.0
    room = window_end - start
    if speech_end > room:
        tempo = min(1.2, speech_end / room + 0.01)
    x = load(id, tempo)
    # lead-in: the first audible sample, so the speech starts exactly on the beat
    idx = np.nonzero(np.abs(x) > 0.02)[0]
    lead = (idx[0] / SR) if len(idx) else 0.0
    lead = max(0.0, lead - 0.015)
    seg = x[int(lead * SR):]
    i = int(start * SR)
    n = min(len(seg), len(out) - i)
    out[i:i + n] += seg[:n]
    for k, w in enumerate(words):
        ws = start + (w["start"] / tempo - lead)
        if k == 0:
            ws = max(ws, start)  # the alignment starts a phrase at 0 s; the audible onset is on the beat
        words_out.append({"w": w["w"], "start": ws, "end": start + (w["end"] / tempo - lead)})
    end_t = start + (speech_end / tempo - lead)
    report.append((id, round(start, 3), round(end_t, 3), round(window_end, 3), round(tempo, 3), round(lead, 3), end_t <= window_end + 0.02))

# display spellings and merged spoken letters
merged = []
i = 0
while i < len(words_out):
    w = words_out[i]
    letters = [x["w"] for x in words_out[i:i + 3]]
    if [l.strip(".!?,") for l in letters] == ["T", "S", "X"]:
        tail = words_out[i + 2]["w"][len("X"):]
        merged.append({"w": "TSX" + tail, "start": w["start"], "end": words_out[i + 2]["end"]})
        i += 3
    elif [l.strip(".!?,") for l in letters] == ["N", "P", "X"]:
        merged.append({"w": "npx", "start": w["start"], "end": words_out[i + 2]["end"]})
        i += 3
    else:
        merged.append({"w": DISPLAY.get(w["w"], w["w"]), "start": w["start"], "end": w["end"]})
        i += 1
for m in merged:
    m["start"] = round(max(0.0, m["start"]), 3)
    m["end"] = round(m["end"], 3)

peak = np.abs(out).max()
out = out / peak * 0.92
wavfile.write(os.path.join(OUT, "voice.wav"), SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
json.dump(merged, open(os.path.join(OUT, "voice.words.json"), "w"), indent=1)
for r in report:
    print("%s start %.3f end %.3f window %.3f tempo %.3f lead %.3f %s" % (*r[:6], "ok" if r[6] else "OVERRUN"))
print(" ".join(f"{m['w']}@{m['start']}" for m in merged))
