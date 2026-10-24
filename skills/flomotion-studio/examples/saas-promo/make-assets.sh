#!/usr/bin/env bash
# Generates the example's placeholder audio with FFmpeg and macOS `say` (a local TTS provider).
# These are synthetic stand-ins: real projects use Freesound sounds (ledgered) and a recorded voice.
set -euo pipefail
cd "$(dirname "$0")/../assets"
F="ffmpeg -y -hide_banner -loglevel error -bitexact"
# land: low thump with a fast decay, peak at 0.02s
$F -f lavfi -i "sine=f=70:d=0.6" -af "afade=t=out:st=0.05:d=0.5,volume=2.2,aecho=0.6:0.5:40:0.3" sfx/land.wav
# whoosh: filtered noise swell, peak near 0.28s
$F -f lavfi -i "anoisesrc=d=0.7:c=pink:a=0.6" -af "highpass=f=300,lowpass=f=4000,afade=t=in:d=0.28,afade=t=out:st=0.3:d=0.4" sfx/whoosh.wav
# pop: short sine blip
$F -f lavfi -i "sine=f=520:d=0.18" -af "afade=t=out:st=0.02:d=0.16,volume=1.4" sfx/pop.wav
# click: very short tick
$F -f lavfi -i "sine=f=1800:d=0.05" -af "afade=t=out:d=0.05,volume=1.2" sfx/click.wav
# success chime
$F -f lavfi -i "sine=f=880:d=0.5" -af "afade=t=out:st=0.05:d=0.45,volume=1.2" sfx/chime.wav
# glitch: bitcrushed noise burst
$F -f lavfi -i "anoisesrc=d=0.35:c=white:a=0.5" -af "acrusher=bits=4:mix=1,afade=t=out:d=0.35" sfx/glitch.wav
# music bed: soft pad, 31s
$F -f lavfi -i "sine=f=110:d=31" -f lavfi -i "sine=f=164.81:d=31" -f lavfi -i "sine=f=220:d=31" -filter_complex "amix=inputs=3:normalize=0,volume=0.35,tremolo=f=0.3:d=0.2,afade=t=in:d=2,afade=t=out:st=28:d=3" music.wav
# voiceover (local TTS test double) and estimated word timings
SCRIPT="Ship videos as code. Editing takes forever. Hours of clicking, exporting, and waiting for every single change. Meet flomotion. Every control is a prop. Describe a scene, and it renders the same way every time. Write it, preview it, render it. Claude can edit the same file you do, with real sound and captions built in. Over twelve thousand videos shipped, and ninety eight percent rendered on the first try. Start free today."
say -v Samantha -r 175 -o voice.aiff "$SCRIPT"
$F -i voice.aiff -ar 48000 -ac 1 voice.wav
rm voice.aiff
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 voice.wav)
node -e '
const words = process.argv[1].split(/\s+/); const dur = parseFloat(process.argv[2]);
const weights = words.map(w => w.replace(/[^\w]/g,"").length + 1 + (/[.,]$/.test(w) ? 3 : 0));
const total = weights.reduce((a,b)=>a+b,0); let t = 0.15; const usable = dur - 0.3;
const out = words.map((w,i) => { const d = usable * weights[i] / total; const o = {w, start: +t.toFixed(3), end: +(t + d * 0.92).toFixed(3)}; t += d; return o; });
require("fs").writeFileSync("voice.words.json", JSON.stringify(out, null, 2));
console.log("voice", dur.toFixed(2), "s,", out.length, "words (estimated timings: test double, run transcribe for real ones)");
' "$SCRIPT" "$DUR"

# measured peaks (seconds from the start of each sound) for Sound `peak="…"`
echo '{"land":0.02}' > sfx/land.wav.peak.json
echo '{"whip":0.28}' > sfx/whoosh.wav.peak.json
echo '{"pop":0.01}' > sfx/pop.wav.peak.json
echo '{"tap":0.005}' > sfx/click.wav.peak.json
echo '{"ding":0.02}' > sfx/chime.wav.peak.json
echo '{"glitch":0.01}' > sfx/glitch.wav.peak.json
