import { GenericEvent } from "./events.js";
import { Vec2 } from "./gui.js";

type MouseInputEvent = GenericEvent<[MouseButton, ButtonPress]>;

export enum MouseButton {
    Left = 0,
    Wheel = 1,
    Right = 2,
    Other = 3,
    None = 4
}

export enum ButtonPress {
    Held,       // The button is currently held down
    Released,   // The button is currently released (not held down)
    Rising,     // The button was just released (was held during the previous cycle)
    Lowering    // The butto was just pressed (was released during the previous cycle)
}

/**
 * @description
 * A member of input pipeline, able to capture the input and fire according events.
 * A consumer is able to block the input from propagating to the following consumers.
 * The consumer position in the pipeline is determined by the {@link InputConsumer.Priority | Priority} property:
 * lesser values come after the greater ones ( 1 -> 0 -> -1).
 * 
 * For example, if a consumer with priority `1` blocks the propagation, the consumer with priority `0` will not fire.
 * 
 * The blocking mechanism persists only for *one* cycle, after that it is reset to non-blocking mode.
 */
export class InputConsumer {
    public MouseEvent: MouseInputEvent = new GenericEvent();
    public Priority: number = 0;
    public Blocking: boolean = false;


    constructor(priority: number) {
        this.Priority = priority;
    }
}

/**
 * Static input controlling class. Requires {@link InputController.Initialize} to be called first.
 */
export class InputController {

    protected static InputChanged: GenericEvent<[MouseButton, ButtonPress]> = new GenericEvent();
    public static Consumers: InputConsumer[] = [];

    public static Mouse = {
        Position: new Vec2(0, 0), Pressed: MouseButton.None, Previous: new Vec2(0, 0), Delta: new Vec2(0, 0)
    };

    public static Update() {
        this.Mouse.Delta = this.Mouse.Position.Sub(this.Mouse.Previous);
        this.Mouse.Previous = this.Mouse.Position;
    }

    /**
     * Add an {@link InputConsumer} to the input pipeline
     */
    public static Register(consumer: InputConsumer): void {
        this.Consumers.push(consumer);
        this.Consumers.sort((a,b) => b.Priority - a.Priority); // descending order
    }

    /**
     * Remove an {@link InputConsumer} to the input pipeline
     */
    public static Unregister(consumer: InputConsumer): void {
        this.Consumers.splice(this.Consumers.indexOf(consumer), 1);
    }

    public static Initialize(canvas: HTMLCanvasElement) {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.Mouse.Position = new Vec2(e.clientX - rect.left, e.clientY - rect.top);
        });

        canvas.addEventListener('mousedown', (e: MouseEvent) => {
            let prev = this.Mouse.Pressed;
            switch (e.button) {
                case 0: this.Mouse.Pressed = MouseButton.Left; break;
                case 1: this.Mouse.Pressed = MouseButton.Wheel; break;
                case 2: this.Mouse.Pressed = MouseButton.Right; break;
                default: this.Mouse.Pressed = MouseButton.Other; break;
            }
            if (prev == MouseButton.None) { this.InputChanged.Fire(this.Mouse.Pressed, ButtonPress.Lowering); }
        });

        canvas.addEventListener('mouseup', () => {
            this.InputChanged.Fire(this.Mouse.Pressed, ButtonPress.Rising);
            this.Mouse.Pressed = MouseButton.None;
        });

        this.InputChanged.Hook((a, b) => {
            for(let consumer of this.Consumers) {
                consumer.MouseEvent.Fire(a, b);
                if (consumer.Blocking) { consumer.Blocking = false; break;}
            }
        })
    }
}
