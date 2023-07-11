export class Timer {
    private timerId: NodeJS.Timeout | null = null;
    private interval: number;
    private callback: () => void;

    constructor(interval: number, callback: () => void) {
        this.interval = interval;
        this.callback = callback;
    }

    start() {
        this.timerId = setInterval(() => {
            this.callback();
        }, this.interval);
    }

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    reset() {
        this.stop();
        this.start();
    }
}