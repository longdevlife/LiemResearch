import { describe, expect, it } from "vitest";
import { SearchQuerySchema } from "../dto/search.schema.js";

describe("SearchQuerySchema language filters", () => {
  it("normalizes comma-separated language codes and removes duplicates", () => {
    const parsed = SearchQuerySchema.parse({
      q: "machine learning",
      languages: "EN,vi,en,ru",
    });

    expect(parsed.languages).toEqual(["en", "vi", "ru"]);
  });

  it("drops malformed language values without rejecting the search", () => {
    const parsed = SearchQuerySchema.parse({
      q: "machine learning",
      languages: "english,@@,und",
    });

    expect(parsed.languages).toEqual(["und"]);
  });
});
