# Finished example: 30 s 9:16 SaaS promo

`project.tsx` is the full six-beat promo (hook, problem, reveal, features, proof, CTA) in the Kinetic Look: captions, voiceover, music bed, impact effects with sounds, grade, vignette and grain. Read it to see how the pieces fit: how scenes are timed, how effects hang off layers, how sounds are placed with a named peak, how captions bind to a voice.

The sounds and the voice in the repo copy are synthetic stand-ins made by `make-assets.sh` (FFmpeg tones and the macOS `say` voice, with estimated word timings). They show the structure; a real project uses `sound_get`, a recording or `voice_generate`.

Run it from the repo: `pnpm codecut render examples/saas-promo`.
