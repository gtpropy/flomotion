# Signature transitions

Every cut gets its own transition, placed on a dedicated `wipes` track above the scenes. Times on that track are absolute. The incoming scene's background colour is the wipe colour, so when the wipe has covered the frame the scene underneath changes unseen and the wipe simply ends.

All snippets are from `examples/flomotion-ad/project.tsx` (1080 x 1920, 128 bpm: beat = 0.46875 s).

## Slab wipe (from a side)

```tsx
<Rect id="w1" start="3.03s" duration="0.3s" width={1080} height={1920} fill="$brand.block3"
  position={[[3.03, [-1080, 0]], [3.28125, [0, 0], "power4.out"]]} />
```

Vary the direction per cut (left, bottom, right, top).

## Iris (a circle grows from the centre)

```tsx
<Circle id="w3" start="4.92s" duration="0.3s" at={[340, 760]} width={400} fill="$brand.block5"
  scale={[[4.92, 0], [5.15625, 7, "power3.in"]]} />
```

## Venetian stripes

Five `Rect`s, 220 px wide, each `scale` from `[1, 0]` to `[1, 1]` with its start 0.04 s later than the previous, anchored at the top (`anchor={[50, 0]}`).

## Halves (two panels meet)

Two `Rect`s of 540 px, one sliding in from the left, one from the right, both ending at `[0, 0]` on the cut.

## Diagonal slab

A 3200 px square `Rect` with `rotation={18}` sliding in on `position`; it is bigger than the frame so any rotation covers it.

## Flash

A white `Rect` with `opacity` `[[t-0.06, 0], [t, 1], [t+0.15, 0, "power2.out"]]`.

## The two-dots turn (converge, merge, split, grow)

Two big dots (pink and yellow) slide to the centre while shrinking to one small ringed dot, which then splits into two small pink dots that move apart and grow until they fill the frame in the next scene's colour. Scene-relative times (the scene is 1.875 s = 4 beats):

```tsx
<Circle id="turn-a" at={[-170, 650]} width={620} fill="$brand.accent"
  position={[[0, [0, 0]], [0.8, [400, 0], "power3.inOut"]]}
  scale={[[0, 1], [0.8, 0.16, "power3.inOut"], [0.86, 0]]} />
{/* turn-b mirrors it from the right; turn-core is the dark ringed dot that appears at 0.78 s */}
<Circle id="turn-c" at={[490, 910]} width={100} fill="$brand.accent"
  position={[[1.0, [0, 0]], [1.3, [-170, 0], "back.out(1.8)"]]}
  scale={[[1.0, 0], [1.06, 1], [1.3, 1], [1.875, 28, "power3.in"]]} />
{/* turn-d is the same with +170 */}
```

Silence the music for the breath, hit on the merge (0.8 s), pop on the split (1.0 s), and land the drop on the last frame.

## The vault door (a match cut on the circle)

A `Card` (absolute layout) that holds a body circle, a ring, a plate, eight bolt dots and a four-spoke wheel (a nested `Card` whose `rotation` is animated). It lands after the dots' growth, spins, then shrinks and turns away to reveal a yellow disc and the product name. Scale/rotation of the outer `Card` do the open and close; the same door, smaller, closes over a ledger to say "locked". The geometry is all circles and rounded rectangles, so it stays crisp and deterministic. (The generator that wrote the door's shapes is a 30-line script; the result is plain TSX.)

## The mascot (the hero dot)

A `Card` on its own track: a dark circle with a white ring, two white eye circles that blink with `scale` `[1, 0.1]` keyframes, two pupils whose `position` shifts to look at the product. Spin it (`rotation` to 720) on the sting, scale it to 0 during the turn and pop it back on the drop; a `Pulse` child gives the beat-synced bounce after the drop.
