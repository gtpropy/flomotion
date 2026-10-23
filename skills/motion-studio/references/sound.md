# Sound

You cannot hear. You choose sounds from their tag, description, measured duration and measured peak, and then you ask the user to listen.

## Tags (what each is for)

| Tag | Job | Typical length |
| --- | --- | --- |
| `ui/pop` | A small element appears | 0.03 to 0.8 s |
| `ui/tap` | A tap or press | 0.02 to 0.6 s |
| `ui/tick` | A counter step, a tiny tick | 0.01 to 0.4 s |
| `move/whip` | A fast move or whip pan | 0.1 to 1.2 s |
| `move/whoosh-deep` | A big slow move | 0.4 to 2.5 s |
| `hit/land` | A heavy element lands | 0.1 to 1.5 s |
| `hit/punch` | A sharp hit | 0.05 to 1 s |
| `hit/boom` | A big boom for a reveal | 0.5 to 4 s |
| `tech/click` | A UI click | 0.01 to 0.5 s |
| `tech/data` | Data or numbers appear | 0.1 to 2 s |
| `tech/glass` | A bright glassy accent | 0.2 to 2.5 s |
| `tech/success` | A success moment | 0.3 to 2.5 s |
| `tech/glitch` | A glitch or error | 0.1 to 1.5 s |

`sound_search` with `tag` adds good search words and the length range. Add your own `query` words for flavour ("wooden", "soft").

## Workflow

1. `sound_auto` (dry run) lists impact effects with no sound on their frame.
2. Apply it, or `sound_search` and `sound_get` by hand. `sound_get` downloads, measures the loudest moment (`peak`), and writes the ledger. Pass `tag` so the peak gets the job's name (`hit/land` gives `peak="land"`).
3. Place with `<Sound id src="freesound:123" at="0.6s" peak="land" gain={-6} />`. `at` is where the peak must land; the clip starts early by the measured peak offset. Review check 10 allows 0.1 s.
4. `mix_preview`. Read `peakLandsAt` for each sound and the measured loudness.
5. Tell the user which sounds you picked (name, author, licence, description) and ask them to listen.

## Levels

- Voice is on top. Music is set 10 to 14 dB below the voice and ducks another 12 dB (`duckAmount`) while the voice speaks.
- SFX sit 3 to 9 dB below the voice, except the one main hit per scene.
- The master is normalised to -14 LUFS for social. Check 12 passes within 1.5 LU.
- Do not stack more than two loud sounds on one frame.

## Licensing

- Default allowed: CC0 and CC-BY. CC-BY needs credit: `render` writes `<name>.credits.txt`; tell the user to paste it into the post or description.
- NonCommercial and other licences are refused with `license_blocked`. Pick another sound.
- To restrict to CC0 only, set `"soundLicenses": ["CC0"]` in `codecut.json`.
- With only a Freesound API key the downloaded file is the HQ MP3 preview (original files need OAuth). The ledger entry says so.
- Without `FREESOUND_API_KEY`, list your own licensed files in `sounds/catalog.json` and `sound_search` uses them.
- Your own files (recordings, tracks you licensed) need no ledger entry, but the rights are yours to confirm.
