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
            if (this.repeating) {
                const currentIntervalValue = get(this.interval);
                if (currentIntervalValue !== this.lastIntervalValue) {
                    this.start();
                }
            } else {
                this.ticking = false;
            }

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
