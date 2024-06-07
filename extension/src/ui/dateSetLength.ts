import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
dayjs.extend(minMax);
/// Returns total non-overlapping length of set of dayjs intervals in minutes
export function dateSetLength(
  timeEntries: { date: Date; interval_minutes: number }[]
): number {
  if (timeEntries.length === 0) return 0;
  if (timeEntries.length === 1) return timeEntries[0].interval_minutes;
  const intervals = timeEntries
    .map((row) => ({
      from: dayjs(row.date).subtract(row.interval_minutes, "minutes"),
      to: dayjs(row.date),
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

  const res = merged.reduce(
    (prev, curr) => prev + curr.to.diff(curr.from, "minutes"),
    0
  );

  if (timeEntries.length === 0) return 0;

  const fuckedUp = merged.findIndex((f) =>
    Number.isNaN(0 + f.to.diff(f.from, "minutes"))
  );

  const cintervals = timeEntries
    .map((row) => ({
      from: dayjs(row.date).subtract(row.interval_minutes, "minutes"),
      to: dayjs(row.date),
    }))
    .sort((a, b) => a.from.diff(b.from));

  let cmerged: { from: dayjs.Dayjs; to: dayjs.Dayjs }[] = [cintervals[0]];
  for (const [i, interval] of cintervals.slice(1).entries()) {
    const lastInMerged = cmerged.at(-1)!;
    if (!lastInMerged.to.isAfter(interval.from)) cmerged.push(interval);
    else
      cmerged[cmerged.length - 1] = {
        from: dayjs.min(lastInMerged.from, interval.from)!,
        to: dayjs.max(lastInMerged.to, interval.to)!,
      };
  }

  const cres = cmerged.reduce(
    (prev, curr) => prev + curr.to.diff(curr.from, "minutes"),
    0
  );

  return res;
}
