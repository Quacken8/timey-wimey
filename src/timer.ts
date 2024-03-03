import dayjs from "dayjs";
import { Checker, CheckerOutput } from "./types";
import * as vscode from "vscode";

interface Readable<T> {
  get(): T;
}
const isReadable = <T>(x: unknown): x is Readable<T> =>
  typeof x === "object" &&
  x !== null &&
  "get" in x &&
  typeof x.get === "function";
const get = <T>(x: T | Readable<T>) => (isReadable(x) ? x.get() : x);
interface Disposable {
  dispose(): void;
}
const isDisposable = (x: unknown): x is Disposable =>
  typeof x === "object" &&
  x !== null &&
  "dispose" in x &&
  typeof x.dispose === "function";
const dispose = (x: unknown): void => {
  if (isDisposable(x)) x.dispose();
};

/** ![](https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Kitchen_timer.jpg/120px-Kitchen_timer.jpg) */
export class Timer {
  private interval: number | Readable<number>;
  private lastIntervalValue: number;
  private readonly repeating: boolean;
  private callback: () => void;

  private timerId: number = -1;
  public ticking = false;

  constructor({
    interval,
    repeating,
    callback,
  }: {
    interval: number;
    callback: () => void;
    repeating?: boolean;
  }) {
    this.interval = interval;
    this.lastIntervalValue = get(this.interval);
    this.callback = callback;
    this.repeating = repeating ?? false;
  }

  private setTimer(f: () => void): number {
    if (this.repeating) {
      return +setInterval(f, get(this.interval));
    } else {
      return +setTimeout(f, get(this.interval));
    }
  }

  private clearTimer(id: number): void {
    if (this.repeating) {
      clearInterval(id);
    } else {
      clearTimeout(id);
    }
  }

  start() {
    this.ticking = true;

    this.clearTimer(this.timerId);
    this.timerId = this.setTimer(() => {
      this.ticking = false;
      this.callback();
    });
  }

  stop() {
    this.ticking = false;
    this.clearTimer(this.timerId);
  }

  dispose() {
    this.stop();
    this.callback = () => {};
    this.start = () => {
      throw new Error("Calling a timer that has been disposed of.");
    };
    dispose(this.interval);
  }
}

/** Repeating timer that calls upon all checkers to check status of whatever you want to track and saves it to the database along with a timestamp and which workspace this is running in */
export class RepeatingSaver {
  timer?: Timer;
  checkers: Checker[] = [];
  insertToDB?: (row: Promise<CheckerOutput>[]) => void;
  interval?: number;

  constructor() {}

  stopTimer() {
    this.timer?.stop();
  }
  startTimer():
    | "started"
    | { missing: "insertToDB" | "interval" | "checkers" } {
    if (this.insertToDB === undefined) {
      return { missing: "insertToDB" };
    }
    if (this.interval === undefined) {
      return { missing: "interval" };
    }
    if (this.checkers.length === 0) {
      return { missing: "checkers" };
    }

    this.timer = new Timer({
      interval: this.interval,
      repeating: true,
      callback: () => {
        this.insertToDB!([
          Promise.resolve({
            key: "interval_minutes",
            value: this.interval! / 1000 / 60,
          }),
          ...this.checkers.map((checker) => checker()),
        ]);
      },
    });
    this.timer.start();
    return "started";
  }

  dispose() {
    this.timer?.dispose();
  }
}

export class StatusBarUpdater {
  interval = 5 * 1000; // FIXME think about the best interval; probably the same as the repeating saver? Or interpolate the data somehow?
  timer?: Timer;
  statusBarItem?: vscode.StatusBarItem;
  getTodaysWorkFromDB?: () => Promise<string>;

  constructor() {}

  async startTimer(): Promise<
    | "started"
    | { missing: "statusBarItem" | "interval" | "getTodaysWorkFromDB" }
  > {
    if (this.statusBarItem === undefined) {
      return { missing: "statusBarItem" };
    }
    if (this.interval === undefined) {
      return { missing: "interval" };
    }
    if (this.getTodaysWorkFromDB === undefined) {
      return { missing: "getTodaysWorkFromDB" };
    }

    const updateText = async () => {
      if (this.statusBarItem)
        this.statusBarItem.text = `${await (
          this.getTodaysWorkFromDB ?? (() => "getTodaysWorkFromDB undefined!")
        )()}`;
    };

    this.timer = new Timer({
      interval: this.interval,
      repeating: true,
      callback: updateText,
    });
    this.timer.start();
    updateText();
    return "started";
  }

  dispose() {
    this.timer?.dispose();
  }
}
