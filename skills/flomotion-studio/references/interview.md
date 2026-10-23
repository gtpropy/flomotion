# Interview protocol (Gate 0)

Do not start designing until the interview is complete. A video built on guesses is the main cause of bad output. You interview **extensively and adaptively**: many rounds, short batches, follow-ups on vague answers, a read-back at the end. The person should feel that you understood the product and the audience before a single frame exists.

## Rules
1. **Batches of 3-5 questions per message.** Never a wall of 20. Prefer multiple-choice (use the ask-user-question tool when available, with 2-4 options and a free-text escape) and open questions where you need their words.
2. **Adapt.** Each answer decides the next questions. Skip what is already known. Dig where answers are vague ("modern", "clean", "powerful" are not answers: ask "like what? show me one you like").
3. **Follow up on every vague or surprising answer** at least once. Ask for an example, a number, a source, or a screenshot.
4. **Quote their own words back** when you summarize. Their phrases become the copy raw material.
5. **Track state.** Maintain `interview.json` in the project: for every field a `value`, a `source` (`user`, `asset`, `assumption`), and a `status` (`confirmed`, `assumed`, `unknown`). Show the clarity score after each round.
6. **Never invent.** If they do not know a fact, record `unknown`, never fill it. Claims need sources.
7. **Offer a way out.** For any question the person can say "skip", "you decide", or "I don't know". Record `assumed` with your proposed default and ask them to confirm it at the read-back.
8. **Detect contradictions** (e.g. "calm and premium" + "fast cuts, loud") and ask which wins.
9. **Be respectful of time.** Show progress ("Round 3 of about 6, 82% clear"). Offer a pause point after each round.
10. **Language**: ask in the person's language and level. No jargon unless they use it.

## Clarity score
Count must-have fields (below) that are `confirmed` or `assumed-and-approved`. Score = confirmed / total must-haves. **Proceed to G1 only at >= 90% and after the read-back is approved.** Nice-to-have fields never block.

### Must-have fields (28)
Product name; one-sentence what it does; who uses it (primary audience); job-to-be-done / pain; the single desired action after watching; one-sentence promise (their words); top 1-3 features to show; primary proof (or explicit "no proof"); platform; format (9:16/16:9/1:1/4:5); length; tone (one primary); brand colors (or "free to choose"); fonts (or "free to choose"); logo available (y/n); screen assets available (y/n and what); footage available (y/n); music preference (or "free"); voice plan (own/generated/none); language; CTA text and URL/button; words/claims to avoid; legal lines required; competitors to avoid resembling; at least one liked reference (or explicit "none"); at least one disliked reference (or "none"); deadline/priority; who approves; revision tolerance.

## Rounds (adapt order; skip when known)

### Round 0: What is set up, and what they will supply (before anything else, one short message)
Call `setup_status`. Tell the person, in plain words, what this machine can do and what is missing (FFmpeg, Chrome, no Freesound key, no ElevenLabs key, no Whisper). Then ask how they want to supply four things; none needs a service key:
1. **Voiceover:** their own recording, a generated voice (ElevenLabs, paid, always quoted first), or none.
2. **Word timings:** a transcript or captions file they already have (SRT, VTT or JSON), or Whisper on this computer, or ElevenLabs returns them with the voice.
3. **Sound effects:** their own sound files (a folder or a few files), Freesound, or both.
4. **Graphics:** their logo and brand files, screenshots of their product (or a public URL we can capture, with their permission), their website for brand colours and fonts; icons and stock photos can be pulled from open sources.
If they want a service, tell them to run `flomotion setup` in a terminal (keys are saved on their computer and never pass through the chat). Never ask them to paste a key here. Record the answers in `interview.json`.

### Round 1: The product, in their words
Ask:
- What is it, in one sentence, as you'd explain it to a friend who has never heard of it?
- Who uses it, and what are they doing right before they open it?
- What painful thing does it replace or fix? What happens if people do nothing?
- What is the single most impressive thing it does?
- What do people usually get wrong or doubt about it?
Follow-ups: "Can you give a real example from a user?" "What number could we put on that?" "What did they use before?"

### Round 2: The audience and the moment
- Who is the buyer and who is the user (same person?)
- Where will they watch (feed, website, demo call, event)? On mute?
- What do they already believe about this category? What are they tired of?
- How aware are they: do they know they have the problem, or must we show it?
- What would make them stop scrolling, in their language?
Probe: a typical day, the trigger event that makes them look for a solution.

### Round 3: The goal and the action
- After the video, what exactly should happen (sign up, book, share, buy)? One action.
- Is there a metric or deadline attached (launch date, campaign)?
- Is this cold traffic or warm (existing leads)?
- What is the offer (free trial, demo, discount)? Any terms that must show?
- CTA text and destination (URL, code, button)?

### Round 4: Message, features and proof
- What is the one sentence you want viewers to remember?
- Pick up to 3 features to show. For each: what does the user see and do, and what is the result?
- Which feature is the "wow"? Which should be skipped even if it is great?
- Proof: numbers (with source and date), certifications, customer names and quotes (with permission), logos you may show, press, awards.
- Anything you are not allowed to claim?
Probe: "If a skeptic asked 'prove it', what would you show?"

### Round 5: Assets
- Logo (vector?), brand guide, colors, fonts, existing videos, screenshots, screen recordings, footage, product photos, voice recordings, music you own.
- Their website or app URL: may we read its brand (`brand_extract`) and take screenshots of it (`asset_capture`)? Only with their yes. Pages behind a login: they take the screenshots and we import them (`asset_import`).
- Their own files can be anywhere on their computer: ask for the path and import (`asset_import`, `voice_import`, `sound_import`); the tools state what rights they assert, so ask "are these yours, or licensed to you?".
- Customer or partner logos ("works with Slack"): brand logos are trademarks. Ask whether they have permission or the brand's guidelines allow it; otherwise use a plain wordmark in text.
- Anything the viewer should never see (private data, real customers)?
- Can we show real UI or must it be mocked? Is the UI recent?
- Language(s) and any non-Latin text? Accessibility needs (captions required)?
Ask for the files; list what arrived and what is missing.

### Round 6: Taste (the "looks and feels" round)
- Three adjectives for how it should feel; three for how it must not feel.
- Show me 1-3 videos or sites you like and tell me what you like about each (specific moments, not "it's nice"). Same for 1-2 you dislike.
- Light or dark? Quiet or loud? Fast or slow? Minimal or rich?
- **Style probe**: describe the style families (from `styles.md`) in plain words and show a one-line example of each; ask them to pick top 2 and rank. Use previews where the tool supports them.
- **Look probe**: offer 3 palette+type directions from `looks/` as short descriptions (or preview frames if rendered); ask for a pick and what to change.
- Motion taste: smooth and calm, snappy and punchy, playful and bouncy?
- Typography taste: big and bold, light and elegant, technical and mono?
Probe on vague words: "modern" -> which brand, which feature of it?

### Round 7: Voice, sound and music
- Voiceover or text-only? Whose voice (own, generated)? Accent and gender preference, pace. If it is their own recording: where is the file, and do they have a transcript or captions for it (any format)? A line-level caption file is enough for captions; word-level (Whisper, ElevenLabs, a caption tool) is needed to start things exactly on a word.
- Music mood (examples of artists/tracks for *mood only*), instrumental only?
- Sound design appetite: subtle clicks, punchy impacts, none?
- Pronunciation of the brand name and key terms.
Reminder: say that sounds are chosen from licensed sources and you will ask them to audition.

### Round 8: Constraints, risks, process
- Words/phrases to avoid; compliance or legal lines; competitor names allowed or not?
- Required elements (logo placement, disclaimer, URL, hashtag).
- Platform rules to respect (no flashing, caption requirements, length limits).
- Who approves and how fast? How many revision rounds are expected?
- Deadline, delivery format (mp4, webm, social cutdowns), versions needed (extra formats, languages)?
- Budget notes: paid voice allowed? Stock footage allowed?

### Round 9: Gaps and sanity (adaptive)
Ask only what the state shows missing or contradictory:
- Resolve contradictions (calm vs loud, premium vs playful).
- Fill any must-have still `unknown`.
- Ask for the **one thing you would regret if the video missed it**.
- Ask what would make them say "this is exactly it".

## Read-back (mandatory)
Write a one-page summary in their words and show it:
1. Product, audience, pain (their phrases quoted)
2. Goal and CTA
3. Message and top features
4. Proof available (with sources) and proof missing
5. Format, length, platform
6. Taste: adjectives, do/don't, chosen style family and look direction, references liked/disliked
7. Voice, sound, language, and how each is supplied (their recording and transcript, their sound files, generated, Freesound)
8. Constraints and risks
9. **Assumptions I am making** (each with a default you can accept or change)
10. **Open items** (what I still do not know and how I will handle it)

Ask: "Is anything wrong, missing, or something you would never say?" Fix and re-confirm. Save as `brief.json` (schema: `dataset/brief.schema.json`) and `interview.md` (full log).

## Question quality bank (use these probes when an answer is thin)
- "Can you give me a concrete example?"
- "What would a skeptical customer say?"
- "What is the number behind that, and where does it come from?"
- "What does the screen show at that moment? Can I see it?"
- "Who would hate this version, and why?"
- "If we could only keep one sentence, which one?"
- "What did the last video you made get wrong?"
- "What does the competitor do that you do not want to resemble?"
- "How would your best customer describe this in one line?"

## Do not
- Ask more than 5 questions at once; ask things you can read from supplied files; ask the same thing twice; lead the person to a style they have not chosen; accept "whatever" for must-haves without recording an explicit assumption and getting it approved at the read-back.

## Unattended or no-answer mode
If nobody can answer: fill `assumed` values from the decision tables, label every one in the brief, produce a **short** concept (not the full build), and stop at G1 with the list of questions you would ask. Do not run paid steps.

## Interview log format (`interview.md`)
```
Round 3 — Goal and action  (clarity 71% -> 79%)
Q: After the video, what should happen? | A: "Book a demo" | status: confirmed
Q: Terms of the offer? | A: unknown (they will check) | status: unknown
Follow-up: ...
```
