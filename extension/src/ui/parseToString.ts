import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

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
