#!/usr/bin/env python3
"""Tidies .flomotion/ledger.json after the imports (there is no tool for these edits):
- the assembled voice is ElevenLabs output, not "owned by the person"; say so, with the plan caveat and an author
- drop ledger rows of sounds and fonts the video no longer uses"""
import json, os, shutil
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".flomotion", "ledger.json")
l = json.load(open(p))
used_local = {"hit", "type", "tick", "pop", "chime", "music"}
keep = []
for e in l["entries"]:
    if e.get("kind") == "font" and e.get("family") in ("Sora", "Inter"):
        continue
    if e.get("source") == "local" and str(e.get("id")) not in used_local:
        continue
    if e.get("source") == "freesound" and str(e.get("id")) == "533732":
        continue
    if e.get("kind") == "voice" and e.get("id") == "voice":
        e.update({
            "source": "elevenlabs",
            "author": "ElevenLabs (voice: Jessica)",
            "url": "https://elevenlabs.io",
            "license": "ElevenLabs generated (voice Jessica, free plan: terms of your plan), assembled from p01-p14 by scripts/build-voice.py",
            "commercialOk": False,
            "attributionRequired": True,
            "note": "free ElevenLabs plans require attribution and are not licensed for commercial use as I understand it: check the current terms before publishing",
        })
    keep.append(e)
l["entries"] = keep
json.dump(l, open(p, "w"), indent=2)
print(len(keep), "ledger entries")
