import * as gui from './gui.js'
import * as input from "./input.js";

export abstract class WorkspaceElement {

    public static WORSPACE_ELEMENT_INPUT_PRIORITY: number = 0;

    public Position: gui.Vec2 = gui.Vec2.Zero();
    public Focused: boolean = false;
    public Selected: boolean = false;
    public Parent!: Workspace;
    
    public Contains(probe: gui.Vec2): boolean { 
        let adjusted_pos = this.GetScreenPosition()
        return adjusted_pos.Contains(
            adjusted_pos.Add(this.GetSize()),
            probe
        );
    }

    public GetScreenPosition() {
        return this.Position.Add(this.Parent.CameraOffset);
    }
    public abstract GetSize(): gui.Vec2;
    
    constructor() {

        let element_input_consumer = new input.InputConsumer(WorkspaceElement.WORSPACE_ELEMENT_INPUT_PRIORITY);
        element_input_consumer.Blocking = false;
        element_input_consumer.MouseEvent.Hook((button, press_type) => {
            
            if(button == input.MouseButton.Left && press_type == input.ButtonPress.Rising) {
                
                if(this.Contains(input.InputController.Mouse.Position)) {
                    element_input_consumer.Blocking = true;
                    this.Focused = !this.Focused;
                }
            }
        })

        input.InputController.Register(element_input_consumer);
    }

    public Update() {
        
    }

    public Draw(offset: gui.Vec2, scale: number): void {
        if(this.Focused) {
            Workspace.Context.fillStyle = Workspace.Palette.Focus.Fill.CSS();
            Workspace.Context.beginPath();
            Workspace.Context.rect(this.GetScreenPosition().X, this.GetScreenPosition().Y, this.GetSize().X, this.GetSize().Y);
            Workspace.Context.fill()
        }
    }
}

export class Comment extends WorkspaceElement {

    public FontSize: number = 48;
    public Color: gui.Color = new gui.Color(0,0,0);
    public Text: string = "this is a comment";

    public Draw(offset: gui.Vec2, scale: number): void {
        super.Draw(offset, scale);

        gui.Control.Context.fillStyle = this.Color.CSS();
        gui.Control.Context.font = `${this.FontSize * scale}px`
        gui.Control.Context.fillText(this.Text, offset.X, offset.Y + this.GetSize().Y)
    }

    public GetSize(): gui.Vec2 {
        gui.Control.Context.font = `${this.FontSize * this.Parent.CameraScale}px`
        let metrics = gui.Control.Context.measureText(this.Text);
        return new gui.Vec2(metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)
    }

    constructor(comment: string) {
        super();
        this.Text = comment;
    }
}

export class Workspace extends gui.Control {

    public static WORKSPACE_INPUT_PRIORITY: number = -2;
    public static Context: CanvasRenderingContext2D;

    public static Palette = {
        Focus: {
            Fill: gui.Color.RGBA(124, 176, 255, 70),
            Outline: gui.Color.RGBA(127, 180, 255, 90)
        }
    }

    public BackgroundColor: gui.Color = new gui.Color(255,255,255);
    public CameraOffset: gui.Vec2 = gui.Vec2.Zero();
    public CameraScale: number = 1;

    public Elements: WorkspaceElement[] = [];

    protected Dragged: boolean = false;

    public AddElement(element: WorkspaceElement) {
        this.Elements.push(element);
        element.Parent = this;
    }

    constructor() {
        super();

        let workspace_input_consumer = new input.InputConsumer(Workspace.WORKSPACE_INPUT_PRIORITY);
        workspace_input_consumer.MouseEvent.Hook((button, press_type) => {
            if(button == input.MouseButton.Wheel) {
                switch(press_type) {
                    case input.ButtonPress.Lowering: this.Dragged = true; break;
                    case input.ButtonPress.Rising: this.Dragged = false; break;
                }
            }
        });

        input.InputController.Register(workspace_input_consumer);
    }

    public override Draw(): void {

        let pos = this.PixelPosition();
        let size = this.PixelSize();

        gui.Control.Context.fillStyle = this.BackgroundColor.CSS();
        gui.Control.Context.beginPath();
        gui.Control.Context.rect(pos.X, pos.Y, size.X, size.Y);
        gui.Control.Context.fill()

        for(let element of this.Elements) {
            element.Draw(this.CameraOffset.Sub(pos), this.CameraScale);
        }

        super.Draw();
    }

    public override Update() {

        for(let element of this.Elements) {
            element.Update();
        }

        if(this.Dragged) {
            this.CameraOffset = this.CameraOffset.Sub(input.InputController.Mouse.Delta);
        }

        super.Update();
    }
}