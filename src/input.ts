import { GenericEvent } from "./events.js";
import { Vec2 } from "./gui.js";

type MouseInputEvent = GenericEvent<[MouseButton, ButtonPress]>;
type KeyboardInputEvent = GenericEvent<[KeyboardEvent]>;

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
    public KeyboardEvent: KeyboardInputEvent = new GenericEvent();

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

    protected static MouseInputChanged: GenericEvent<[MouseButton, ButtonPress]> = new GenericEvent();
    protected static KeyboardInputChanged: KeyboardInputEvent = new GenericEvent();
    public static Consumers: InputConsumer[] = [];

    public static Mouse = {
        Position: new Vec2(0, 0), Pressed: MouseButton.None, Previous: new Vec2(0, 0), Delta: new Vec2(0, 0)
    };

    public static Modifiers = {
        Shift: false, Ctrl: false,
        None: () => { return !(this.Modifiers.Shift || this.Modifiers.Ctrl) }
    }

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
            if (prev == MouseButton.None) { this.MouseInputChanged.Fire(this.Mouse.Pressed, ButtonPress.Lowering); }
        });

        canvas.addEventListener('mouseup', () => {
            this.MouseInputChanged.Fire(this.Mouse.Pressed, ButtonPress.Rising);
            this.Mouse.Pressed = MouseButton.None;
        });

        window.addEventListener('keydown', (e) => {
            this.KeyboardInputChanged.Fire(e);
            if(e.key === 'Shift') {
                this.Modifiers.Shift = true;
            } else if (e.key === 'Ctrl') {
                this.Modifiers.Ctrl = true;
            }      
        })

        document.addEventListener('keyup', (e) => {
            if(e.key === 'Shift') {
                this.Modifiers.Shift = false;
            } else if (e.key === 'Ctrl') {
                this.Modifiers.Ctrl = false;
            }    
        })

        this.MouseInputChanged.Hook((a, b) => {
            for(let consumer of this.Consumers) {
                consumer.MouseEvent.Fire(a, b);
                if (consumer.Blocking) { consumer.Blocking = false; break;}
            }
        })
        this.KeyboardInputChanged.Hook((e) => {
            for(let consumer of this.Consumers) {
                consumer.KeyboardEvent.Fire(e);
                if (consumer.Blocking) { consumer.Blocking = false; break;}
            }
        })
    }
}

export class StringInputManipulator {
    public Text: string = '';
    public CursorPosition: number = 0;
    public QuitSignal: GenericEvent<[]> = new GenericEvent();

    constructor(text: string) { this.Text = text; }

    protected RemoveAt(index: number): void {
        this.Text = this.Text.substring(0, index) + this.Text.substring(index + 1);
        if (this.CursorPosition > index) {
            this.CursorPosition--;
        }
    }

    protected InsertAt(index: number, character: string): void {
        this.Text = this.Text.substring(0, index) + character + this.Text.substring(index);
        this.CursorPosition++;
    }

    public ProcessEvent(event: KeyboardEvent): void {
        const key: string = event.key;
        
        switch(key) {
            case 'Backspace':
                if (this.CursorPosition > 0) {
                    this.RemoveAt(this.CursorPosition - 1);
                }
                break;
                
            case 'Delete':
                if (this.CursorPosition < this.Text.length) {
                    this.RemoveAt(this.CursorPosition);
                }
                break;
                
            case 'ArrowLeft':
                if (this.CursorPosition > 0) {
                    this.CursorPosition--;
                }
                break;
                
            case 'ArrowRight':
                if (this.CursorPosition < this.Text.length) {
                    this.CursorPosition++;
                }
                break;
                
            case 'Home':
                this.CursorPosition = 0;
                break;
                
            case 'End':
                this.CursorPosition = this.Text.length;
                break;

            case 'Esc':
                this.QuitSignal.Fire();
                break;

            case 'Enter':
                this.QuitSignal.Fire();
                break;
                
            default:
                // Handle character insertion
                if (key.length === 1 && !event.ctrlKey && !event.metaKey) {
                    this.InsertAt(this.CursorPosition, key);
                }
                break;
        }
        
        // Prevent default behavior for keys we handle
        if ([
            'Backspace', 'Delete', 
            'ArrowLeft', 'ArrowRight', 
            'Home', 'End'
        ].includes(key)) {
            event.preventDefault();
        }
    }
}