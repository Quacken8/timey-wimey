import { DBRowSelect } from "../db/schema";
export type HistogramData = {
  workingHours: number;
  label: string;
}[];
import dayjs from "dayjs";

export function binForHistogram(
  data: DBRowSelect[],
  from: dayjs.Dayjs,
  to: dayjs.Dayjs
): HistogramData {
  if (data.length === 0) return [];
  const period = getPeriodOfRange(from, to);
  let currDay = dayjs(data[0].date).startOf(period).subtract(0.5, period);
  let bins: HistogramData = [];

  for (const row of data) {
    const rowDay = dayjs(row.date).startOf(period).add(0.5, period);
    while (rowDay.isAfter(currDay)) {
      currDay = currDay.add(1, period);
      bins.push({
        workingHours: 0,
        label: formatWithAccuracy(currDay, period),
      });
    }
    bins[bins.length - 1].workingHours +=
      (+(row.working || row.window_focused) * row.interval_minutes) / 60;
  }
  return bins;
}

function getPeriodOfRange(from: dayjs.Dayjs, to: dayjs.Dayjs): Period {
  const shortWindow = 1.5;
  for (const era of periodsFromLargest) {
    if (to.diff(from, era) > shortWindow) return era;
  }
  return periodsFromLargest.at(-1)!;
}
const periodsFromLargest = <const>[
  "years",
  "months",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
];
export type Period = (typeof periodsFromLargest)[number];
const formattingStrings: FormattingStrings = {
  years: ["YYYY", undefined],
  months: ["MMM", "YYYY"],
  days: ["MMM D", "YYYY"],
  hours: ["HH:mm", "MMM D YYYY"],
  minutes: ["HH:mm", "MMM D YYYY"],
  seconds: ["HH:mm:ss", "MMM D YYYY"],
  milliseconds: ["HH:mm:ss.SSS", "MMM D YYYY"],
};
export type FormattingStrings = {
  [period in Period]: PeriodFormattingString;
};

export type PeriodFormattingString = [
  thisPeriod: string,
  largerPeriod: string | undefined
];
function formatWithAccuracy(
  date: dayjs.Dayjs | Date,
  accuracy: Period
): string {
  date = dayjs(date);

  return formattingStrings[accuracy].map((s) => date.format(s)).join(" ");
}
