/** ![](https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Kitchen_timer.jpg/120px-Kitchen_timer.jpg) */
export class Timer {
    private timerId: number = -1;
    public ticking = false;

    constructor(
        private interval: number,
        private callback: () => void
    ) {}

    start() {
        this.ticking = true;

        clearTimeout(this.timerId);
        this.timerId = +setTimeout(() => {
            this.ticking = false;
            this.callback();
        }, this.interval);
    }

    stop() {
        this.ticking = false;
        clearTimeout(this.timerId);
    }

    dispose() {
        this.stop();
        this.callback = () => {};
        this.start = () => { throw new Error("Calling a timer that has been disposed of."); };
    }
}
