import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { DBRowSelect } from "../db/schema";
import { dateSetLength } from "./dateSetLength";

export type SummaryData = {
  workingMinutes: number;
  focusedMinutes: number;
};

export function summarize(rows: DBRowSelect[]): SummaryData {
  const workingAsIntervals = rows.filter((row) => row.working);

  const focusedAsIntervals = rows.filter((row) => row.window_focused);

  const workData: SummaryData = {
    workingMinutes: dateSetLength(workingAsIntervals),
    focusedMinutes: dateSetLength(focusedAsIntervals),
  };

  return workData;
}

/// NOTE: filters out null files
export function getMostUsedFiles(
  rows: DBRowSelect[],
  number: number
): Record<string, number> {
  const fileIntervals: Record<string, DBRowSelect[]> = {};
  for (const row of rows) {
    if (!row.working) continue;
    let filename = row.current_file;
    if (filename === null) continue;

    const workspaceFileless = row.workspace?.replace("file://", "");
    const workspaceRoot = row.workspace?.split("/").at(-1);
    filename =
      workspaceFileless && filename.includes(workspaceFileless) // FIXME this is a hack that only works on my machine, study better how vscode api reports on open files in remote workspaces and other weird edge cases
        ? (workspaceRoot ?? "").concat(filename.replace(workspaceFileless, ""))
        : filename;

    fileIntervals[filename] = [...(fileIntervals[filename] ?? []), row];
  }

  const fileLengths = Object.fromEntries(
    Object.entries(fileIntervals).map(([filename, intervals]) => [
      filename,
      dateSetLength(intervals),
    ])
  );

  return Object.fromEntries(
    Object.entries(fileLengths)
      .sort(([, a], [, b]) => b - a)
      .slice(0, number)
  );
}

export const minutesToString = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${(minutes % 60).toFixed(0)}m`;
dayjs.extend(isoWeek);
