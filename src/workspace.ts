import * as gui from './gui.js'
import * as input from "./input.js";

/**
 * A generic member of the {@link Workspace} class, responding to clicks, selections, camera offsets and scaling
 */
export abstract class WorkspaceElement {

    public static WORSPACE_ELEMENT_INPUT_PRIORITY: number = 0;

    public Position: gui.Vec2 = gui.Vec2.Zero();
    public Focused: boolean = false;
    public Selected: boolean = false;
    public Parent!: Workspace;

    protected Input: input.InputConsumer;
    
    // Check if the workspace element contains a vec2 position
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

        // create an input consumer for the element to handle all the generic logic:
        // focus on left click, select on shift + left click or when in selection box, summon context menu on right click
        // etc
        this.Input = new input.InputConsumer(WorkspaceElement.WORSPACE_ELEMENT_INPUT_PRIORITY);
        this.Input.MouseEvent.Hook((button, press_type) => {
            
            if(button == input.MouseButton.Left && press_type == input.ButtonPress.Rising) {
                
                if(this.Contains(input.InputController.Mouse.Position)) {
                    this.Input.Blocking = true;
                    this.Focused = !this.Focused;
                }
            }
        })

        input.InputController.Register(this.Input);
    }

    public Update() {
        
    }

    public Draw(): void {
        if(this.Focused) {
            Workspace.TargetContext.fillStyle = Workspace.Palette.Focus.Fill.CSS();
            Workspace.TargetContext.beginPath();
            Workspace.TargetContext.rect(this.GetScreenPosition().X, this.GetScreenPosition().Y, this.GetSize().X, this.GetSize().Y);
            Workspace.TargetContext.fill()
        }
    }
}

/**
 * A simple text element which does not interact with any calculations.
 */
export class Comment extends WorkspaceElement {

    public FontSize: number = 48;
    public Color: gui.Color = new gui.Color(0,0,0);
    public Text: string = "this is a comment";

    public Draw(): void {
        super.Draw();

        Workspace.TargetContext.fillStyle = this.Color.CSS();
        Workspace.TargetContext.font = `${this.FontSize * this.Parent.CameraScale}px`
        Workspace.TargetContext.fillText(this.Text, this.GetScreenPosition().X, this.GetScreenPosition().Y + this.GetSize().Y)
    }

    public GetSize(): gui.Vec2 {
        Workspace.TargetContext.font = `${this.FontSize * this.Parent.CameraScale}px`
        let metrics = Workspace.TargetContext.measureText(this.Text);
        return new gui.Vec2(metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)
    }

    constructor(comment: string) {
        super();
        this.Text = comment;
    }
}

/**
 * A class representing a canvas for every mathematical element that can be manipulated --
 * formulas, graphs, tables, etc.
 */
export class Workspace extends gui.Control {

    public static WORKSPACE_INPUT_PRIORITY: number = -2;
    public static Context: CanvasRenderingContext2D;
    public static TargetContext: OffscreenCanvasRenderingContext2D;

    public static Palette = {
        Focus: {
            Fill: gui.Color.RGBA(124, 176, 255, 70),
            Outline: gui.Color.RGBA(127, 180, 255, 90)
        }
    }

    public BackgroundColor: gui.Color = new gui.Color(255,255,255);
    public CameraOffset: gui.Vec2 = gui.Vec2.Zero();
    public CameraScale: number = 1;

    public RenderTarget!: OffscreenCanvas;

    public Elements: WorkspaceElement[] = [];

    protected Dragged: boolean = false;

    public AddElement(element: WorkspaceElement) {
        this.Elements.push(element);
        element.Parent = this;
    }

    constructor() {
        super();

        // Make offset canvas resize accordingly whenever the size (viewport) changes
        this.SizeChanged.Hook((_) => {
            let size = this.PixelSize();
            this.RenderTarget = new OffscreenCanvas(size.X, size.Y);
            Workspace.TargetContext = this.RenderTarget.getContext('2d')!;
        });

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

        Workspace.TargetContext.fillStyle = this.BackgroundColor.CSS();
        Workspace.TargetContext.beginPath();
        Workspace.TargetContext.rect(0, 0, size.X, size.Y);
        Workspace.TargetContext.fill()

        for(let element of this.Elements) {
            element.Draw();
        }

        Workspace.Context.drawImage(this.RenderTarget, pos.X, pos.Y);

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