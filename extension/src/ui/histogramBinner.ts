import { DBRowSelect } from "../db/schema";
export type HistogramData = {
  workingMinutes: number;
  time: number;
}[];
import dayjs from "dayjs";

export function binForHistogram(
  data: DBRowSelect[],
  from: dayjs.Dayjs,
  to: dayjs.Dayjs
): HistogramData {
  if (data.length === 0) return [];
  const scale = "days";
  let currDay = dayjs(data[0].timestamp).startOf(scale).subtract(0.5, scale);
  let bins: HistogramData = [];

  for (const row of data) {
    const rowDay = dayjs(row.timestamp).startOf(scale).add(0.5, scale);
    while (rowDay.isAfter(currDay)) {
      currDay = currDay.add(1, scale);
      bins.push({
        workingMinutes: 0,
        time: currDay.unix(),
      });
    }
    bins[bins.length - 1].workingMinutes +=
      +(row.working || row.window_focused) * row.interval_minutes;
  }
  return bins;
}

function scaleForDayjs(
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
  maxBinsPerRange: number
): any {
  if (to.diff(from, "minutes") < maxBinsPerRange) return "minutes";
  if (to.diff(from, "hours") < maxBinsPerRange) return "hours";
  if (to.diff(from, "days") < maxBinsPerRange) return "days";
  if (to.diff(from, "months") < maxBinsPerRange) return "months";

  return "years";
}
