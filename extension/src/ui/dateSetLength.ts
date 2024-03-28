import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);
dayjs.extend(minMax);
/// Returns total non-overlapping length of set of dayjs intervals in minutes
export function dateSetLength(
  intervals: { from: dayjs.Dayjs; to: dayjs.Dayjs }[]
): number {
  let nonOverlapping: Set<{ from: dayjs.Dayjs; to: dayjs.Dayjs }> = new Set();

  for (const interval of intervals) {
    if (Array.from(nonOverlapping).some((i) => fullyContained(interval, i)))
      continue;

    const overlapping = Array.from(nonOverlapping).filter((i) =>
      doOverlap(interval, i)
    );
    if (overlapping.length === 0) nonOverlapping.add(interval);
    else {
      overlapping.forEach((i) => nonOverlapping.delete(i));

      const newInterval = {
        from: dayjs.min([interval.from, ...overlapping.map((i) => i.from)])!,
        to: dayjs.max([interval.to, ...overlapping.map((i) => i.to)])!,
      };
      nonOverlapping.add(newInterval);
    }
  }

  return Array.from(nonOverlapping).reduce(
    (acc, i) => acc + i.to.diff(i.from, "minute"),
    0
  );
}

function doOverlap(
  a: { from: dayjs.Dayjs; to: dayjs.Dayjs },
  b: { from: dayjs.Dayjs; to: dayjs.Dayjs }
): boolean {
  return (
    fullyContained(a, b) ||
    a.from.isBetween(b.from, b.to) ||
    a.to.isBetween(b.from, b.to)
  );
}

/// Returns true if a is fully contained in b
function fullyContained(
  a: { from: dayjs.Dayjs; to: dayjs.Dayjs },
  b: { from: dayjs.Dayjs; to: dayjs.Dayjs }
): boolean {
  return b.from.isBefore(a.from) && b.to.isAfter(a.to);
}
