import { DBRowSelect } from "../db/schema";
export type HistogramData = {
  workingMinutes: number;
  focusedMinutes: number;
  time: number;
}[];
import dayjs from "dayjs";

export function binForHistogram(
  data: DBRowSelect[],
  from: dayjs.Dayjs,
  to: dayjs.Dayjs
): HistogramData {
  if (data.length === 0) return [];
  const scale = scaleForDayjs(from, to, 50);
  let currDay = dayjs(data[0].timestamp).startOf(scale).subtract(1, scale);
  let bins: HistogramData = [];

  for (const row of data) {
    const rowDay = dayjs(row.timestamp).startOf(scale);
    if (rowDay.isAfter(currDay)) {
      bins.push({
        workingMinutes: 0,
        focusedMinutes: 0,
        time: currDay.unix(),
      });
      currDay = rowDay;
    }
    bins[bins.length - 1].workingMinutes += +row.working * row.interval_minutes;
    bins[bins.length - 1].focusedMinutes +=
      +row.window_focused * row.interval_minutes;
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
