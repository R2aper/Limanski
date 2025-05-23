import * as gui from './gui.js'
import { InputController } from './input.js';
import { Button } from './interactableControl.js';
import { Workspace, Comment } from './workspace.js';

let canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let context = canvas.getContext('2d');
let layer = new gui.GUILayer();

gui.Control.Canvas = canvas;
gui.Control.Context = context!;
//gui.Control.Debug = true;

InputController.Initialize(canvas);

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let workspace = new Workspace(layer).With({
    Size: gui.CDim.Comps(.8, 1, 0, -20),
    Position: gui.CDim.Comps(0, 0, 0, 20),
    BackgroundColor: new gui.Color(230, 230, 230),
});

workspace.AddElement(new Comment("my comment"))

let topbar = new gui.Rectangle().With({
    Color: gui.Control.Palette.Main,
    Size: gui.CDim.Comps(1, 0, 0, 20)
})

let hlist = new gui.OrderedLayout().With({Direction: "Horizontal", Padding: 0});
hlist.AddChild(
    new Button(() => {}).With({
        Size: gui.CDim.Comps(0, 1, 50, 0),
        Text: 'File'
    }) 
)
hlist.AddChild(
    new Button(() => {}).With({
        Size: gui.CDim.Comps(0, 1, 50, 0),
        Text: 'Edit'
    })
);

topbar.AddChild(hlist);

layer.Add(workspace, topbar)

let draw_update = () => {};
draw_update = () => {
    layer.Draw();
    InputController.Update();
    window.requestAnimationFrame(draw_update)
}
window.requestAnimationFrame(draw_update)

