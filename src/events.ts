type Action<T extends any[]> = (..._: T) => void;

export class GenericEvent<Ts extends any[]> {
    private Callbacks: Action<Ts>[] = [];

    public Hook(f: Action<Ts>): void {
        this.Callbacks.push(f);
    }

    public Unhook(f: Action<Ts>): void {
        const index = this.Callbacks.indexOf(f);
        if (index !== -1) {
            this.Callbacks.splice(index, 1);
        }
    }

    public Fire(...args: Ts): void {
        this.Callbacks.forEach(f => f(...args));
    }

    public Clear(): void {
        this.Callbacks = [];
    }
}
