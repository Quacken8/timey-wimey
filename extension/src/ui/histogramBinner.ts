import { DBRowSelect } from "../db/schema";
export type HistogramData = { value: number; time: number }[];
import dayjs from "dayjs";

export function binForHistogram(data: DBRowSelect[], from: dayjs.Dayjs, to: dayjs.Dayjs): HistogramData {
  const leastBinsPerRange = 10;
  let currDay = ;
}

function scaleForDayjs(from: dayjs.Dayjs, to: dayjs.Dayjs, minBinsPerRange: number): any {
  if (to.diff(from, "hours") < minBinsPerRange) return "minutes";
  if (to.diff(from, "days") < minBinsPerRange) return "hours";
  if (to.diff(from, "months") < minBinsPerRange) return "days";
  return "months";
}