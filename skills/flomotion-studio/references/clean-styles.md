# Clean styles: what "good" looks like in short motion pieces

Notes from three short motion pieces the person collected (each a brand film made with Claude and shown on a laptop screen on a phone feed). They set the bar for flomotion's output. **What I could check:** frames sampled every 2 s, and loudness. **What I could not:** the spoken words and the taste of the music. Treat the sound notes as measurements, not opinions.

## The three pieces

### A. A money-tracking app: a story told by a character (43 s)

- One hero character: a glossy orange blob that is "your money". Each beat takes a bite out of it (fees, ads, refunds, shipping) with a different small creature or object; the number shrinks with every bite.
- Pale, warm background; the blob and a second accent are the only strong colours.
- Text is tiny and sparse: 1-4 words, set in negative space ("Fees ate", "Ads burned", "And shipping?"), with one serif-italic accent word ("today.", "Paused.", "More sleep.") against a clean sans.
- Problem as a visual joke (a clock, "14 TABS" flying in), solution as relief ("melted into one number"), then a calm end card ("Fewer tabs. More sleep.").
- Meta reveal at the end: "Oh, and this whole video?" over a code editor, then "Made with AI." The reveal that the film itself was built from code is the hook for the next watch.

### B. A language app: a glowing thread through the scenes (19 s)

- Near-black background, one brand colour (neon green), all light comes from it.
- A thin glowing line draws through the scenes and connects them (phone, streak flame, leaderboard, mascot call, language orbs); the line is the motion design.
- Product UI shown as clean cards with real-looking data, never a screen recording.
- Ends on one three-word idea ("One path.") and the logo; a soft fade, no loud sting.

### C. A website builder: the build is the story (48 s)

- A prompt box is typed into ("Describe your idea"), then the site builds itself on screen: wireframe, layout, product photos, headlines, publish, "Your store is live", a growth chart.
- Dark cobalt interface around a bright product page; the contrast tells you where to look.
- Every beat is a state change of the same screen, so it reads as one continuous take.

## What they share (the rules)

1. **One idea per shot, 1-4 words.** If a shot needs a sentence, split it.
2. **One hero object that carries the film** (blob, line, prompt box, dot). It changes shape and mood with the story and is never replaced. flomotion's version: the mascot dot with eyes (`flo`).
3. **Two or three colours, used flat.** One brand colour, one neutral, one accent. No gradients to make it feel rich.
4. **Type contrast:** a heavy sans for the message, one serif-italic or hand-drawn accent word for the feeling. Max two families (see `typography.md`).
5. **Negative space is the style.** Text sits in the empty part of the frame, never over busy detail.
6. **Show the work, not the screenshot.** The product appears as a built, animated UI or as the process of building (typing, assembling), not a static capture. When a real capture is the honest choice (flomotion's own live view), animate it: scroll it, zoom it, float a card out of it.
7. **A metaphor that moves, not a diagram.** Money eaten by bites; a thread connecting steps; a vault door opening onto the product. Pick one metaphor per film.
8. **A reveal at the end that reframes the film** ("this whole video is one file"). It pays off the hook and invites a second watch.
9. **A single, cheap call to action.** Comment a word, run one command. No form, no price table.
10. **Sound is dense and level.** All three sit at about -14 LUFS with very little loudness change (loudness range 2 LU, 2 LU and 8 LU); the music is a constant bed and the hits are small. Do not spike the mix for drama: use level, tempo and cuts.

## How to apply it in flomotion

- Look: `bold-kinetic` for light/colour-block pieces (A), `dark-product` for glow pieces (B, C). Keep to the look's tokens.
- Blocks: the hook is a claim or a typed prompt (`Hook`, `TypedQuery`); the middle is a character or a metaphor (`MetaphorImage`, `OldWay`, the transitions in `transitions.md`); the product is built on screen (`ProductReveal` + `UIZoom`).
- Build the hero as a `Card` of circles (body, eyes, pupils) with keyframes: squash on beats, blink every few seconds, look toward the thing that matters. See the mascot in `examples/flomotion-ad/project.tsx`.
- End with the reveal line and the one-command CTA.

## Checklist before a draft

- [ ] Each shot has 1-4 words (headline 6 max).
- [ ] One hero object appears in at least 4 beats and reacts to the story.
- [ ] Two or three flat colours per scene, from the look.
- [ ] One metaphor, used once, clearly.
- [ ] The last 3 seconds reframe or pay off the first 3.
- [ ] One CTA, one action.
- [ ] Mix near -14 LUFS, true peak under -1 dBTP, `mix_preview` run.
