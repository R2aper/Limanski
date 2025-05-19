import * as gui from './gui.js'

export abstract class WorkspaceElement {
    public Position: gui.Vec2 = gui.Vec2.Zero();

    public abstract Draw(offset: gui.Vec2, scale: number): void;
}

export class Comment extends WorkspaceElement {

    public FontSize: number = 48;
    public Color: gui.Color = new gui.Color(0,0,0);
    public Text: string = "this is a comment";

    public Draw(offset: gui.Vec2, scale: number): void {
        gui.Control.Context.fillStyle = this.Color.CSS();
        gui.Control.Context.font = `${this.FontSize * scale}px`
        gui.Control.Context.fillText(this.Text, offset.X, offset.Y)
    }

    constructor(comment: string) {
        super();
        this.Text = comment;
    }
}

export class Workspace extends gui.Control {

    public BackgroundColor: gui.Color = new gui.Color(255,255,255);
    public CameraOffset: gui.Vec2 = gui.Vec2.Zero();
    public CameraScale: number = 1;

    public Elements: WorkspaceElement[] = [];

    protected Dragged: boolean = false;

    constructor() {
        super();
        gui.Input.InputChanged.Hook((button, press) => {
            if(press == gui.ButtonPress.Lowering && button == gui.MouseButton.Wheel) {
                this.Dragged = true;
            }  else if (press == gui.ButtonPress.Rising && button == gui.MouseButton.Wheel) {
                this.Dragged = false;
            }
        });
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

        if(this.Dragged) {
            this.CameraOffset = this.CameraOffset.Sub(gui.Input.Mouse.Delta);
            console.log(this.CameraOffset)
        }

        super.Update();
    }
}