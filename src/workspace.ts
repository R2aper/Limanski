import * as gui from './gui.js'
import * as input from './input.js';
import * as ingui from './interactableControl.js'

/**
 * A generic member of the {@link Workspace} class, responding to clicks, selections, camera offsets and scaling
 */
export abstract class WorkspaceElement {

    public static WORKSPACE_ELEMENT_INPUT_PRIORITY: number = 0;
    public static BoxPadding: number = 3;

    public static Palette = {
        Focus: {
            Fill: gui.Color.RGBA(0,0,0,0),
            Outline: gui.Color.RGBA(0,0,0,50)
        },

        Selection: {
            Fill: gui.Color.RGBA(124, 176, 255, 70),
            Outline: gui.Color.RGBA(127, 180, 255, 90)
        }
    }

    public DefaultContextActions: {[name: string]: () => void} = {
        
        "Delete": () => { this.Parent.RemoveElement(this); }
        
    }

    public Position: gui.Vec2 = gui.Vec2.Zero();
    public Focused: boolean = false;
    public Selected: boolean = false;
    public Parent!: Workspace;

    protected Input: input.InputConsumer;
    
    // Check if the workspace element contains a vec2 position
    public Contains(probe: gui.Vec2): boolean { 
        let adjusted_pos = this.GetScreenPosition().Add(this.Parent.PixelPosition())
        return adjusted_pos.Contains(
            adjusted_pos.Add(this.GetSize()),
            probe
        );
    }

    public ToggleSelection() {
        if(this.Selected) {
            this.Selected = false;
            this.Parent.RemoveSelectedElement(this);
        } else {
            this.Selected = true;
            this.Parent.AddSelectedElement(this);
        }
    }

    public GetScreenPosition() {
        return this.Position.Add(this.Parent.CameraOffset);
    }
    
    public abstract GetSize(): gui.Vec2;
    public abstract GetContextMenuEntries(): {[name: string]: () => void};

    constructor() {

        // create an input consumer for the element to handle all the generic logic:
        // focus on left click, select on shift + left click or when in selection box, summon context menu on right click
        // etc
        this.Input = new input.InputConsumer(WorkspaceElement.WORKSPACE_ELEMENT_INPUT_PRIORITY);
        this.Input.MouseEvent.Hook((button, press_type) => {
            
            if(button == input.MouseButton.Left && press_type == input.ButtonPress.Rising) {
                
                if(this.Contains(input.InputController.Mouse.Position)) {
                    this.Input.Blocking = true;

                    // a click without any modifying keys
                    if (input.InputController.Modifiers.None()) {
                        this.Focused = !this.Focused;

                        this.Selected = false;
                        this.Parent.RemoveSelectedElement(this);

                    } else if (input.InputController.Modifiers.Shift) {
                        this.ToggleSelection();
                    }
                    
                }
            } else if (button == input.MouseButton.Right && press_type == input.ButtonPress.Rising
                && this.Contains(input.InputController.Mouse.Position)
            ) {
                this.Input.Blocking = true;
                // clear previous context menu if present
                if(this.Parent.CurrentContextMenu != undefined) {
                    this.Parent.Layer.Remove(this.Parent.CurrentContextMenu);
                    this.Parent.CurrentContextMenu = undefined;
                }

                // summon context menu
                let actions = this.GetContextMenuEntries();
                let height = 0;
                let width = 0;
                let context_menu = new gui.Rectangle().With({'Color': Workspace.Palette.Main})
                let layout = new gui.OrderedLayout().With({
                    'Direction': 'Vertical', 
                    'Padding': 0
                });
                context_menu.AddChild(layout);
                context_menu.Position = gui.CDim.FromAbsolute(
                    input.InputController.Mouse.Position.X,
                    input.InputController.Mouse.Position.Y
                );

                // fill the context menu
                for(let key in actions) {
                    let button_fn = actions[key];
                    let measure = Workspace.TargetContext.measureText(key);

                    height += (measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent);
                    width = Math.max(width, measure.width);
                    layout.AddChild(new ingui.Button(button_fn).With({'Text': key}));
                }

                
                context_menu.Size = gui.CDim.FromAbsolute(width, height);

                // place the button
                this.Parent.Layer.Add(context_menu);
                this.Parent.CurrentContextMenu = context_menu;
            }
        })

        input.InputController.Register(this.Input);
    }

    public Update() {
        
    }

    public Draw(): void {
        if(this.Focused) {
            Workspace.TargetContext.fillStyle = WorkspaceElement.Palette.Focus.Fill.CSS();
            Workspace.TargetContext.strokeStyle = WorkspaceElement.Palette.Focus.Outline.CSS();
            Workspace.TargetContext.beginPath();
            Workspace.TargetContext.rect(
                this.GetScreenPosition().X - WorkspaceElement.BoxPadding, 
                this.GetScreenPosition().Y - WorkspaceElement.BoxPadding, 
                this.GetSize().X + WorkspaceElement.BoxPadding * 2, 
                this.GetSize().Y + WorkspaceElement.BoxPadding * 2);
            Workspace.TargetContext.fill();
            Workspace.TargetContext.stroke();
        } else if (this.Selected) {
            Workspace.TargetContext.fillStyle = WorkspaceElement.Palette.Selection.Fill.CSS();
            Workspace.TargetContext.strokeStyle = WorkspaceElement.Palette.Selection.Outline.CSS();
            Workspace.TargetContext.beginPath();
            Workspace.TargetContext.rect(
                this.GetScreenPosition().X, 
                this.GetScreenPosition().Y, 
                this.GetSize().X + WorkspaceElement.BoxPadding * 2, 
                this.GetSize().Y + WorkspaceElement.BoxPadding * 2);
            Workspace.TargetContext.fill()
        }
    }
}

/**
 * A simple text element which does not interact with any calculations.
 */
export class Comment extends WorkspaceElement {

    public FontSize: number = 20;
    public FontName: string = 'Arial'
    public Color: gui.Color = new gui.Color(0,0,0);
    public Text: string;

    public InputHandler: input.StringInputManipulator;

    public Draw(): void {
        super.Draw();
        let pos = this.GetScreenPosition();
        let size = this.GetSize();

        Workspace.TargetContext.fillStyle = this.Color.CSS();
        Workspace.TargetContext.font = `${this.FontSize * this.Parent.CameraScale}px ${this.FontName}`;
        Workspace.TargetContext.fillText(this.Text, pos.X, pos.Y + size.Y);

        
        if(this.Focused) {
            // draw cursor
            let measure = Workspace.TargetContext.measureText(this.Text.slice(0, this.InputHandler.CursorPosition));
            let start = pos.Add(new gui.Vec2(measure.width, 0));
            let end = start.Add(new gui.Vec2(0, size.Y));

            Workspace.TargetContext.strokeStyle = WorkspaceElement.Palette.Focus.Outline.CSS();
            Workspace.TargetContext.beginPath();
            Workspace.TargetContext.moveTo(start.X, start.Y);
            Workspace.TargetContext.lineTo(end.X, end.Y);
            Workspace.TargetContext.stroke();
        }
    }

    public GetContextMenuEntries(): {[name: string]: () => void} {
        return { ...this.DefaultContextActions }
    }

    public GetSize(): gui.Vec2 {
        Workspace.TargetContext.font = `${this.FontSize * this.Parent.CameraScale}px`
        let metrics = Workspace.TargetContext.measureText(this.Text);
        return new gui.Vec2(metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)
    }

    constructor(comment: string) {
        super();
        this.Text = comment;
        this.InputHandler = new input.StringInputManipulator(this.Text);
        this.InputHandler.QuitSignal.Hook(() => {
            this.Focused = false;
            if(this.InputHandler.Text.length == 0) { this.Parent.RemoveElement(this); }
        })

        this.Input.KeyboardEvent.Hook((e) => {
            if(this.Focused) {
                this.Input.Blocking = true;
                this.InputHandler.ProcessEvent(e);
                this.Text = this.InputHandler.Text;
            }
        })
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

    public BackgroundColor: gui.Color = new gui.Color(255,255,255);
    public CameraOffset: gui.Vec2 = gui.Vec2.Zero();
    public CameraScale: number = 1;

    public RenderTarget!: OffscreenCanvas;
    public Layer: gui.GUILayer;
    public CurrentContextMenu?: gui.Control;

    public Elements: WorkspaceElement[] = [];
    public SelectedElements: WorkspaceElement[] = [];

    protected Dragged: boolean = false;

    public AddElement(element: WorkspaceElement) {
        this.Elements.push(element);
        element.Parent = this;
    }

    public RemoveElement(element: WorkspaceElement) {
        this.Elements.splice(this.Elements.indexOf(element), 1);
    }

    public AddSelectedElement(element: WorkspaceElement) {
        this.SelectedElements.push(element);
    }

    public RemoveSelectedElement(element: WorkspaceElement) {
        this.SelectedElements.splice(this.SelectedElements.indexOf(element), 1);
    }

    constructor(layer: gui.GUILayer) {
        super();

        this.Layer = layer;

        // Make offset canvas resize accordingly whenever the size (viewport) changes
        this.SizeChanged.Hook((_) => {
            let size = this.PixelSize();
            this.RenderTarget = new OffscreenCanvas(size.X, size.Y);
            Workspace.TargetContext = this.RenderTarget.getContext('2d')!;
        });

        let workspace_input_consumer = new input.InputConsumer(Workspace.WORKSPACE_INPUT_PRIORITY);
        workspace_input_consumer.MouseEvent.Hook((button, press_type) => {
            // hide context menu if present
            if(this.CurrentContextMenu != undefined) {
                this.Layer.Remove(this.CurrentContextMenu);
                this.CurrentContextMenu = undefined;
            }

            if(button == input.MouseButton.Wheel) {
                switch(press_type) {
                    case input.ButtonPress.Lowering: this.Dragged = true; break;
                    case input.ButtonPress.Rising: this.Dragged = false; break;
                }
                // RMB click on an empty space
            } else if (button == input.MouseButton.Right && press_type == input.ButtonPress.Rising) {
                // deselect everything
                for(let e of this.SelectedElements) {this.RemoveSelectedElement(e);}
                
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