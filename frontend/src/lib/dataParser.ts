import type { DBRowSelect } from "@extension/src/db/schema";
import type { SummaryData } from "./Summary.svelte";
import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";
dayjs.extend(minMax);

export async function getSummary(
  rows: Promise<DBRowSelect[]>
): Promise<SummaryData> {
  const data = await rows;
  const workData: SummaryData = {
    workingMinutes: 0,
    focusedMinutes: 0,
  };

  // to avoid overlapping entries
  let alreadyAccountedFor: { start: dayjs.Dayjs; end: dayjs.Dayjs } | undefined;
  for (const row of data) {
    const start = dayjs(row.timestamp);
    const end = dayjs(row.timestamp).add(row.interval_minutes, "minute");

    const nonOverlappingMins = dayjs
      .max(start, alreadyAccountedFor?.start ?? start)!
      .diff(dayjs.min(end, alreadyAccountedFor?.end ?? end)!, "minute");

    workData.workingMinutes += nonOverlappingMins * +row.working;
    workData.focusedMinutes += nonOverlappingMins * +row.window_focused;

    alreadyAccountedFor = {
      start: dayjs.min(start, alreadyAccountedFor?.start ?? start)!,
      end: dayjs.max(end, alreadyAccountedFor?.end ?? end)!,
    };
  }

  return workData;
}
