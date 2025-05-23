import { GenericEvent } from "./events.js";
import { Color, Control } from "./gui.js";
import { InputConsumer, MouseButton, ButtonPress, InputController } from "./input.js";


export class InteractableControl extends Control {
    public static GUI_INPUT_PRIORITY = 2;

    public Hovered: boolean = false;
    public Held: boolean = false;

    public InputHandler: InputConsumer;

    public OnClick: GenericEvent<[]> = new GenericEvent();

    constructor() {
        super();
        this.InputHandler = new InputConsumer(InteractableControl.GUI_INPUT_PRIORITY);
        this.InputHandler.MouseEvent.Hook((button, press_type) => {

            if (this.Hovered) {
                if (button == MouseButton.Left && press_type == ButtonPress.Lowering) {
                    this.Held = true;
                    return;
                }
            }
            
            if (button == MouseButton.Left && press_type == ButtonPress.Rising) {
                if (this.Held) { this.OnClick.Fire(); }
                this.Held = false;
            }

        });
        InputController.Register(this.InputHandler);
    }

    public override Update() {
        this.Hovered = this.Contains(InputController.Mouse.Position);
    }
}

export class Button extends InteractableControl {
    public Hovered: boolean = false;
    public Held: boolean = false;

    public Text: string = "Button";
    public TextColor: Color = Control.Palette.Text;

    public FontSize: number = 16;
    public FontName: string = 'Arial'

    constructor(main_fn: () => void) {
        super();
        this.OnClick.Hook(main_fn);
    }

    public override Draw(): void {
        let pos = this.PixelPosition();
        let size = this.PixelSize();
        let fillColor = Control.Palette.Main.CSS();

        Control.Context.font = `${this.FontSize}px ${this.FontName}`
        let textMeasure = Control.Context.measureText(this.Text);

        if(this.Held) { fillColor = Control.Palette.MainActive.CSS(); }
        else if (this.Hovered) { fillColor = Control.Palette.MainHover.CSS(); }

        Control.Context.fillStyle = fillColor;
        Control.Context.beginPath();
        Control.Context.rect(pos.X, pos.Y, size.X, size.Y);
        Control.Context.fill()

        Control.Context.fillStyle = Control.Palette.Text.CSS();
        Control.Context.fillText(
            this.Text, 
            pos.X + size.X / 2 - textMeasure.width / 2, 
            pos.Y + size.Y - (textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent ) / 2);
        super.Draw();
    }
}