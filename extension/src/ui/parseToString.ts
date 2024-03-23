import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { DBRowSelect } from "../db/schema";

export type SummaryData = {
  workingMinutes: number;
  focusedMinutes: number;
};

export function summarize(rows: DBRowSelect[]): SummaryData {
  const workData: SummaryData = {
    workingMinutes: 0,
    focusedMinutes: 0,
  };
  // to avoid overlapping entries
  // let alreadyAccountedFor: { start: dayjs.Dayjs; end: dayjs.Dayjs } | undefined;
  for (const row of rows) {
    workData.workingMinutes += row.interval_minutes * +row.working;
    workData.focusedMinutes += row.interval_minutes * +row.window_focused;
    // const start = dayjs(row.timestamp);
    // const end = dayjs(row.timestamp).add(row.interval_minutes, "minutes");

    // const nonOverlappingMins = dayjs
    //   .max(start, alreadyAccountedFor?.start ?? start)!
    //   .diff(dayjs.min(end, alreadyAccountedFor?.end ?? end)!, "minutes");

    // workData.workingMinutes += nonOverlappingMins * +row.working;
    // workData.focusedMinutes += nonOverlappingMins * +row.window_focused;

    // alreadyAccountedFor = {
    //   start: dayjs.min(start, alreadyAccountedFor?.start ?? start)!,
    //   end: dayjs.max(end, alreadyAccountedFor?.end ?? end)!,
    // };
  }

  return workData;
}

export function getMostUsedFiles(
  rows: DBRowSelect[],
  number: number
): Record<string, number> {
  const fileTimes: Record<string, number> = {};
  for (const row of rows) {
    const filename = row.current_file ?? "None";
    if (filename in fileTimes) {
      fileTimes[filename] += row.interval_minutes;
    } else {
      fileTimes[filename] = row.interval_minutes;
    }
  }

  return Object.fromEntries(
    Object.entries(fileTimes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, number)
  );
}

export const minutesToString = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${(minutes % 60).toFixed(0)}m`;
dayjs.extend(isoWeek);

export const parseToString = (
  thisWeek: Record<string, number>,
  thisMonth: Record<string, number>,
  lastMonth: Record<string, number>
) => {
  return `This week (${dayjs()
    .startOf("isoWeek")
    .format("DD. MM.")} — ${dayjs().format("DD. MM.")})
    ${Object.entries(thisWeek)
      .map(
        ([repo, minutes]) =>
          `${repo.split("/").at(-1)} \t ${minutesToString(minutes)}`
      )
      .join("\n")}
      ------------------------
    \n
    This month (${dayjs()
      .startOf("month")
      .format("DD. MM.")} — ${dayjs().format("DD. MM.")})
    ${Object.entries(thisMonth)
      .map(
        ([repo, minutes]) =>
          `${repo.split("/").at(-1)} \t ${minutesToString(minutes)}`
      )
      .join("\n")}
    
      ------------------------
    Last month (${dayjs()
      .startOf("month")
      .subtract(1, "month")
      .format("DD. MM.")} — ${dayjs().startOf("month").format("DD. MM.")})\n
    ${Object.entries(lastMonth)
      .map(
        ([repo, minutes]) =>
          `${repo.split("/").at(-1)} \t ${minutesToString(minutes)}`
      )
      .join("\n")}
  `.replace(/^\s+/gm, "");
};
