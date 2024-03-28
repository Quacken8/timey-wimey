import { dateSetLength } from "./dateSetLength";
import dayjs from "dayjs";

describe("dateSetLength", () => {
  it("should return 0 for an empty array", () => {
    expect(dateSetLength([])).toBe(0);
  });

  it("should correctly calculate the length for non-overlapping intervals", () => {
    const intervals = [
      { from: dayjs("2022-01-01T00:00:00"), to: dayjs("2022-01-01T01:00:00") },
      { from: dayjs("2022-01-01T02:00:00"), to: dayjs("2022-01-01T03:00:00") },
    ];
    expect(dateSetLength(intervals)).toBe(120); // 2 intervals of 60 minutes each
  });

  it("should correctly calculate the length for overlapping intervals", () => {
    const intervals = [
      { from: dayjs("2022-01-01T00:00:00"), to: dayjs("2022-01-01T02:00:00") },
      { from: dayjs("2022-01-01T01:00:00"), to: dayjs("2022-01-01T03:00:00") },
    ];
    expect(dateSetLength(intervals)).toBe(180); // 1 interval from 00:00 to 03:00
  });

  it("should correctly handle fully contained intervals", () => {
    const intervals = [
      { from: dayjs("2022-01-01T00:00:00"), to: dayjs("2022-01-01T03:00:00") },
      { from: dayjs("2022-01-01T01:00:00"), to: dayjs("2022-01-01T02:00:00") },
    ];
    expect(dateSetLength(intervals)).toBe(180); // The second interval is fully contained in the first one
  });
});
