// Algorithm: greedy "least-recently-used cluster" with deterministic tie-break
// by sourceRef ASC. No randomness — same input always produces same output.
//
// Dominant-cluster fallback: when one cluster has > ceil(n/2) cards it is
// mathematically impossible to guarantee no-adjacent rule; we space dominant
// items as evenly as possible and allow the minimum required adjacency.

export function interleave<T extends { cluster: string; sourceRef: string }>(
  cards: T[],
): T[] {
  if (cards.length <= 1) return [...cards];

  const distinct = new Set(cards.map((c) => c.cluster));
  if (distinct.size === 1) return [...cards];

  // Build per-cluster buckets, each sorted by sourceRef for determinism.
  const buckets = new Map<string, T[]>();
  for (const card of cards) {
    if (!buckets.has(card.cluster)) buckets.set(card.cluster, []);
    buckets.get(card.cluster)!.push(card);
  }
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => (a.sourceRef < b.sourceRef ? -1 : 1));
  }

  const result: T[] = [];
  let lastCluster: string | null = null;

  while (result.length < cards.length) {
    // Collect non-empty clusters, prefer any cluster != lastCluster.
    // Tie-break: largest bucket first, then cluster name ASC for determinism.
    const candidates = [...buckets.entries()]
      .filter(([, bucket]) => bucket.length > 0)
      .sort(([clusterA, bucketA], [clusterB, bucketB]) => {
        const aBlocked = clusterA === lastCluster ? 1 : 0;
        const bBlocked = clusterB === lastCluster ? 1 : 0;
        if (aBlocked !== bBlocked) return aBlocked - bBlocked;
        if (bucketB.length !== bucketA.length) return bucketB.length - bucketA.length;
        return clusterA < clusterB ? -1 : 1;
      });

    const [chosenCluster, chosenBucket] = candidates[0];
    const card = chosenBucket.shift()!;
    result.push(card);
    lastCluster = chosenCluster;

    if (chosenBucket.length === 0) buckets.delete(chosenCluster);
  }

  return result;
}
