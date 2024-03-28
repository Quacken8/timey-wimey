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
    const workspace = row.workspace;
    let filename = row.current_file ?? "None";
    filename =
      workspace && filename.includes(workspace.replace("file://", "")) // FIXME ok maybe find a smart solution instead of just patching this for your own case you lazy bum
        ? filename.replace(workspace, "")
        : filename;
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
