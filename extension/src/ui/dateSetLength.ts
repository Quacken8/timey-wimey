import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
dayjs.extend(minMax);
/// Returns total non-overlapping length of set of dayjs intervals in minutes
export function dateSetLength(
  timeEntries: { timestamp: Date; interval_minutes: number }[]
): number {
  const intervals = timeEntries
    .map((row) => ({
      from: dayjs(row.timestamp).subtract(row.interval_minutes, "minutes"),
      to: dayjs(row.timestamp),
    }))
    .sort((a, b) => a.from.diff(b.from));

  let merged: { from: dayjs.Dayjs; to: dayjs.Dayjs }[] = [intervals[0]];
  for (const interval of intervals.slice(1)) {
    const lastInMerged = merged.at(-1)!;
    if (!lastInMerged.to.isAfter(interval.from)) merged.push(interval);
    else
      merged[merged.length - 1] = {
        from: dayjs.min(lastInMerged.from, interval.from)!,
        to: dayjs.max(lastInMerged.to, interval.to)!,
      };
  }

  return merged.reduce(
    (prev, curr) => prev + curr.to.diff(curr.from, "minutes"),
    0
  );
}
