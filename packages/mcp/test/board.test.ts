import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addIdea, parseIdeas, parseStoryboard, readBoard, toggleIdea } from "../src/board.js";

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "fm-board-"));
  dirs.push(d);
  return d;
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const STORYBOARD = `# Storyboard: demo

Hero: flo · Tempo: 128 bpm

## 1. Hook · 0-3.28 s
- Block: Hook
- Scene: hook
- Voice: "Stop editing videos."
- Why it works: contrast

## 2. Pain · 3.28-7.03 s
- Scene: pain-1, pain-2
- On screen: one word per block

## 3. Free-form beat
- Motion: no times on this one
`;

describe("storyboard.md", () => {
  it("parses beats, times, fields and scene ids", () => {
    const sb = parseStoryboard(STORYBOARD);
    expect(sb.title).toBe("Storyboard: demo");
    expect(sb.intro).toContain("128 bpm");
    expect(sb.beats.map((b) => [b.n, b.title, b.start, b.end])).toEqual([
      [1, "Hook", 0, 3.28],
      [2, "Pain", 3.28, 7.03],
      [3, "Free-form beat", undefined, undefined],
    ]);
    expect(sb.beats[0]!.fields).toMatchObject({
      block: "Hook",
      voice: '"Stop editing videos."',
      "why it works": "contrast",
    });
    expect(sb.beats[1]!.scenes).toEqual(["pain-1", "pain-2"]);
  });

  it("shows an older storyboard.json as beats instead of nothing", () => {
    const d = tmp();
    writeFileSync(
      join(d, "storyboard.json"),
      JSON.stringify({
        scenes: [{ id: "hook", block: "Hook", start: 0, duration: 2.4, sound: ["hit"] }],
      }),
    );
    const b = readBoard(d);
    expect(b.storyboardFile).toBe("storyboard.json");
    expect(b.beats[0]).toMatchObject({ title: "hook", start: 0, end: 2.4, scenes: ["hook"] });
  });

  it("prefers storyboard.md over the older json", () => {
    const d = tmp();
    writeFileSync(join(d, "storyboard.json"), JSON.stringify({ scenes: [{ id: "old" }] }));
    writeFileSync(join(d, "storyboard.md"), STORYBOARD);
    expect(readBoard(d).beats).toHaveLength(3);
    expect(readBoard(d).storyboardFile).toBe("storyboard.md");
  });
});

describe("ideas.md", () => {
  it("parses ideas with their author and state", () => {
    expect(
      parseIdeas("# Ideas\n\n- [ ] one (you)\n- [x] two (claude)\n- [ ] three\nnot an idea\n"),
    ).toEqual([
      { index: 0, text: "one", from: "you", done: false },
      { index: 1, text: "two", from: "claude", done: true },
      { index: 2, text: "three", from: "you", done: false },
    ]);
  });

  it("adds an idea (creating the file), ticks it, and keeps everything else in the file", () => {
    const d = tmp();
    expect(addIdea(d, "  open on the   prompt  ")).toEqual([
      { index: 0, text: "open on the prompt", from: "you", done: false },
    ]);
    addIdea(d, "a mascot dot", "claude");
    writeFileSync(
      join(d, "ideas.md"),
      readFileSync(join(d, "ideas.md"), "utf8") + "\nA free note line.\n",
    );
    const ticked = toggleIdea(d, 1);
    expect(ticked.map((i) => i.done)).toEqual([false, true]);
    const text = readFileSync(join(d, "ideas.md"), "utf8");
    expect(text).toContain("- [x] a mascot dot (claude)");
    expect(text).toContain("A free note line.");
    expect(toggleIdea(d, 1).map((i) => i.done)).toEqual([false, false]);
  });

  it("ignores an empty idea and caps a very long one", () => {
    const d = tmp();
    expect(addIdea(d, "   ")).toEqual([]);
    expect(addIdea(d, "x".repeat(900))[0]!.text).toHaveLength(400);
  });
});
