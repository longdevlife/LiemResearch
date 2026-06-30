import { describe, expect, it } from "vitest";
import {
  buildDirectionsPrompt,
  sanitizeDirections,
  DIRECTIONS_SYSTEM_PROMPT,
  type DirectionsRaw,
} from "../gaps-directions.js";

const GAP = {
  topic: "LLM evaluation",
  title: "No benchmark for multi-hop reasoning",
  description: "desc",
  rationale: "why",
};

describe("buildDirectionsPrompt", () => {
  it("includes the gap title and numbers the papers", () => {
    const prompt = buildDirectionsPrompt(GAP, [
      { id: "a", title: "First", abstractText: "abs1" },
      { id: "b", title: "Second", abstractText: "abs2" },
    ]);
    expect(prompt).toContain("No benchmark for multi-hop reasoning");
    // Paper ids MUST appear so the LLM can ground relatedPaperIds in real ids.
    expect(prompt).toContain('[1] id=a "First"');
    expect(prompt).toContain('[2] id=b "Second"');
  });

  it("renders (no abstract) for a paper without one", () => {
    expect(buildDirectionsPrompt(GAP, [{ id: "a", title: "T" }])).toContain("(no abstract)");
  });
});

describe("DIRECTIONS_SYSTEM_PROMPT", () => {
  it("asks for JSON directions and forbids inventing papers", () => {
    expect(DIRECTIONS_SYSTEM_PROMPT).toContain("directions");
    expect(DIRECTIONS_SYSTEM_PROMPT.toLowerCase()).toContain("json");
  });
});

describe("sanitizeDirections", () => {
  const allowed = ["aaaaaaaaaaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbbbbbbbbbb"];

  function raw(items: DirectionsRaw["directions"]): DirectionsRaw {
    return { directions: items };
  }

  it("strips relatedPaperIds not in the gap's supporting ids", () => {
    const out = sanitizeDirections(
      raw([{ title: "D1", relatedPaperIds: ["aaaaaaaaaaaaaaaaaaaaaaaa", "deadbeefdeadbeefdeadbeef"] }]),
      allowed,
    );
    expect(out[0]!.relatedPaperIds).toEqual(["aaaaaaaaaaaaaaaaaaaaaaaa"]);
  });

  it("clamps to at most 4 directions", () => {
    const out = sanitizeDirections(
      raw([1, 2, 3, 4, 5].map((n) => ({ title: `D${n}` }))),
      allowed,
    );
    expect(out).toHaveLength(4);
  });

  it("drops empty-title items and dedupes paper ids", () => {
    const out = sanitizeDirections(
      raw([
        { title: "   " },
        { title: "Keep", relatedPaperIds: ["aaaaaaaaaaaaaaaaaaaaaaaa", "aaaaaaaaaaaaaaaaaaaaaaaa"] },
      ]),
      allowed,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.title).toBe("Keep");
    expect(out[0]!.relatedPaperIds).toEqual(["aaaaaaaaaaaaaaaaaaaaaaaa"]);
  });

  it("returns [] for null/garbage input", () => {
    expect(sanitizeDirections(null, allowed)).toEqual([]);
    expect(sanitizeDirections({ directions: undefined }, allowed)).toEqual([]);
  });
});
