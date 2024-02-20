import { Checker, DBColumnEntry } from "./types";
import { workspaceChecker } from "./checkers";
import dayjs from "dayjs";

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
  #timer?: Timer;
  #checkers: Checker[] = [];
  #saveToDB?: (row: DBColumnEntry[]) => void;
  #interval?: number;

  #startIfAllDefined = () => {
    this.#timer?.dispose();
    if (
      this.#saveToDB !== undefined &&
      this.#interval !== undefined &&
      this.#checkers.length > 0
    ) {
      this.#timer = new Timer({
        interval: this.#interval,
        repeating: true,
        callback: () => {
          this.#saveToDB!([
            { header: "timestamp", data: dayjs() },
            workspaceChecker(),
            ...this.checkers.map((checker) => checker()),
          ]);
        },
      });
      this.#timer.start();
    }
  };

  set checkers(value: Checker[]) {
    this.checkers = value;
    this.#startIfAllDefined();
  }

  set interval(value: number) {
    this.interval = value;
    this.#startIfAllDefined();
  }

  set saveToDB(value: (row: DBColumnEntry[]) => void) {
    this.saveToDB = value;
    this.#startIfAllDefined();
  }

  constructor() {}

  stopTimer() {
    this.#timer?.stop();
  }
  startTimer() {
    this.#startIfAllDefined();
  }

  dispose() {
    this.#timer?.dispose();
  }
}
