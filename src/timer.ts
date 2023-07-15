/** ![](https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Kitchen_timer.jpg/120px-Kitchen_timer.jpg) */
export class Timer {
    private interval: number;
    private readonly repeating: boolean;
    private callback: () => void;

    private timerId: number = -1;
    public ticking = false;

    constructor({ interval, repeating, callback }: { interval: number, callback: () => void, repeating?: boolean }) {
        this.interval = interval;
        this.callback = callback;
        this.repeating = repeating ?? false;
    }

    private setTimer(f: () => void): number {
        if (this.repeating) {
            return +setInterval(f, this.interval);
        } else {
            return +setTimeout(f, this.interval);
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
        this.start = () => { throw new Error("Calling a timer that has been disposed of."); };
    }
}
