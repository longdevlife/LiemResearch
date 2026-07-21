export interface PopulationBucket {
  key: string;
  population: number;
}

export interface Allocation {
  key: string;
  population: number;
  quota: number;
}

export interface DomainAllocation extends Allocation {
  floor: number;
}

/**
 * Allocate a bounded target proportionally without allowing a bucket to receive
 * more records than its known provider population. Ties are broken by key so a
 * manifest can be reproduced from the same planning snapshot.
 */
export function allocateLargestRemainder(
  target: number,
  buckets: readonly PopulationBucket[],
): Allocation[] {
  const normalized = buckets
    .filter((bucket) => Number.isInteger(bucket.population) && bucket.population > 0)
    .map((bucket) => ({ ...bucket, quota: 0 }));
  let remaining = Math.min(Math.max(0, Math.floor(target)), normalized.reduce((sum, item) => sum + item.population, 0));

  while (remaining > 0) {
    const eligible = normalized.filter((item) => item.quota < item.population);
    if (eligible.length === 0) break;

    const weight = eligible.reduce((sum, item) => sum + item.population, 0);
    const proposed = eligible.map((item) => {
      const exact = (remaining * item.population) / weight;
      return { item, whole: Math.min(item.population - item.quota, Math.floor(exact)), remainder: exact % 1 };
    });
    const allocated = proposed.reduce((sum, proposal) => sum + proposal.whole, 0);
    for (const proposal of proposed) proposal.item.quota += proposal.whole;
    remaining -= allocated;
    if (remaining === 0) break;

    proposed
      .filter((proposal) => proposal.item.quota < proposal.item.population)
      .sort((a, b) => b.remainder - a.remainder || a.item.key.localeCompare(b.item.key))
      .slice(0, remaining)
      .forEach((proposal) => {
        proposal.item.quota += 1;
        remaining -= 1;
      });
  }

  return normalized.map(({ key, population, quota }) => ({ key, population, quota }));
}

/**
 * Baseline policy from the million-scale ingest specification: a bounded,
 * equal floor prevents small OpenAlex domains disappearing, then the remaining
 * budget follows provider population by largest-remainder allocation.
 */
export function planDomainBaseline(
  target: number,
  buckets: readonly PopulationBucket[],
  options: { floorBudgetRatio?: number; maxFloorPerDomain?: number } = {},
): DomainAllocation[] {
  const eligible = buckets
    .filter((bucket) => Number.isInteger(bucket.population) && bucket.population > 0)
    .sort((a, b) => a.key.localeCompare(b.key));
  if (eligible.length === 0 || target <= 0) return eligible.map((bucket) => ({ ...bucket, floor: 0, quota: 0 }));

  const boundedTarget = Math.min(Math.floor(target), eligible.reduce((sum, bucket) => sum + bucket.population, 0));
  const floorBudget = Math.min(
    Math.floor(boundedTarget * (options.floorBudgetRatio ?? 0.2)),
    eligible.length * (options.maxFloorPerDomain ?? 20_000),
    boundedTarget,
  );

  let remainingFloor = floorBudget;
  const allocations = eligible.map((bucket) => ({ ...bucket, floor: 0, quota: 0 }));
  while (remainingFloor > 0) {
    const candidates = allocations.filter((item) => item.floor < item.population);
    if (candidates.length === 0) break;
    const each = Math.max(1, Math.floor(remainingFloor / candidates.length));
    let consumed = 0;
    for (const item of candidates) {
      const added = Math.min(each, item.population - item.floor, remainingFloor - consumed);
      item.floor += added;
      consumed += added;
      if (consumed === remainingFloor) break;
    }
    remainingFloor -= consumed;
  }

  const floorTotal = allocations.reduce((sum, item) => sum + item.floor, 0);
  const proportional = allocateLargestRemainder(
    boundedTarget - floorTotal,
    allocations.map((item) => ({ key: item.key, population: item.population - item.floor })),
  );
  const proportionalByKey = new Map(proportional.map((item) => [item.key, item.quota]));
  return allocations.map((item) => ({
    key: item.key,
    population: item.population,
    floor: item.floor,
    quota: item.floor + (proportionalByKey.get(item.key) ?? 0),
  }));
}
