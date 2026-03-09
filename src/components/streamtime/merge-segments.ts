/**
 * Merges stream segments from multiple sources (mycamgirlnet + statbate).
 *
 * Strategy:
 * 1. MyCamgirlNet is preferred (has exact activity transitions with second-level precision)
 * 2. Statbate is used to fill gaps where MyCamgirlNet has no data
 * 3. Consecutive same-type segments are merged into one longer segment
 */

interface Segment {
  start_time: string;
  end_time: string;
  show_type: string;
  source?: string;
  platform?: string;
  cam_account_id?: string;
  model_id?: string;
  date?: string;
  duration_minutes?: number;
  tokens_earned?: number;
  usd_earned?: number;
  [key: string]: unknown;
}

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function mergeSegments(segments: Segment[]): Segment[] {
  if (!segments || segments.length === 0) return [];

  const byPlatform: Record<string, Segment[]> = {};
  segments.forEach((seg) => {
    const p = seg.platform || "Unknown";
    if (!byPlatform[p]) byPlatform[p] = [];
    byPlatform[p].push(seg);
  });

  const result: Segment[] = [];

  for (const [, platformSegs] of Object.entries(byPlatform)) {
    const mcgSegs = platformSegs.filter(
      (s) => s.source === "mycamgirlnet"
    );
    const statbateSegs = platformSegs.filter(
      (s) => s.source === "statbate"
    );

    mcgSegs.sort(
      (a, b) =>
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
    );

    const coveredIntervals = mcgSegs.map((s) => ({
      start: new Date(s.start_time).getTime(),
      end: new Date(s.end_time).getTime(),
    }));

    const filteredStatbate: Segment[] = [];
    for (const seg of statbateSegs) {
      const segStart = new Date(seg.start_time).getTime();
      const segEnd = new Date(seg.end_time).getTime();

      const isFullyCovered = coveredIntervals.some(
        (iv) => iv.start <= segStart && iv.end >= segEnd
      );
      if (isFullyCovered) continue;

      const hasOverlap = coveredIntervals.some((iv) =>
        overlaps(segStart, segEnd, iv.start, iv.end)
      );
      if (hasOverlap) continue;

      filteredStatbate.push(seg);
    }

    const combined = [...mcgSegs, ...filteredStatbate];
    combined.sort(
      (a, b) =>
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
    );

    const merged: Segment[] = [];
    const GAP_TOLERANCE_MS = 60 * 1000;

    for (const seg of combined) {
      const last = merged[merged.length - 1];
      if (last && last.show_type === seg.show_type) {
        const lastEnd = new Date(last.end_time).getTime();
        const thisStart = new Date(seg.start_time).getTime();

        if (thisStart - lastEnd <= GAP_TOLERANCE_MS) {
          last.end_time = seg.end_time;
          last.duration_minutes =
            (new Date(last.end_time).getTime() -
              new Date(last.start_time).getTime()) /
            60000;
          if (seg.source !== last.source) last.source = "merged";
          last.tokens_earned =
            (last.tokens_earned || 0) + (seg.tokens_earned || 0);
          last.usd_earned =
            (last.usd_earned || 0) + (seg.usd_earned || 0);
          continue;
        }
      }

      merged.push({
        ...seg,
        duration_minutes:
          (new Date(seg.end_time).getTime() -
            new Date(seg.start_time).getTime()) /
          60000,
      });
    }

    result.push(...merged);
  }

  result.sort(
    (a, b) =>
      new Date(a.start_time).getTime() -
      new Date(b.start_time).getTime()
  );

  return result;
}

export function mergeSegmentsByPlatform(
  segments: Segment[]
): Record<string, Segment[]> {
  const merged = mergeSegments(segments);
  const byPlatform: Record<string, Segment[]> = {};
  merged.forEach((seg) => {
    const p = seg.platform || "Unknown";
    if (!byPlatform[p]) byPlatform[p] = [];
    byPlatform[p].push(seg);
  });
  return byPlatform;
}
