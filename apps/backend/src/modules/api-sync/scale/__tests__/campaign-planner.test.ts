import { describe, expect, it } from "vitest";
import { allocateLargestRemainder, planDomainBaseline } from "../campaign-planner.js";

describe("campaign planner", () => {
  it("allocates a deterministic proportional target without exceeding population", () => {
    const first = allocateLargestRemainder(10, [
      { key: "zeta", population: 9 },
      { key: "alpha", population: 1 },
    ]);
    const second = allocateLargestRemainder(10, [
      { key: "zeta", population: 9 },
      { key: "alpha", population: 1 },
    ]);

    expect(first).toEqual(second);
    expect(first.reduce((sum, item) => sum + item.quota, 0)).toBe(10);
    expect(first.every((item) => item.quota <= item.population)).toBe(true);
  });

  it("uses a bounded domain floor before allocating the remaining baseline proportionally", () => {
    const plan = planDomainBaseline(100, [
      { key: "computer-science", population: 900 },
      { key: "health-sciences", population: 90 },
      { key: "small-domain", population: 2 },
    ]);

    expect(plan.reduce((sum, item) => sum + item.quota, 0)).toBe(100);
    expect(plan.find((item) => item.key === "small-domain")).toMatchObject({ floor: 2, quota: 2 });
    expect(plan.every((item) => item.quota <= item.population)).toBe(true);
  });
});
