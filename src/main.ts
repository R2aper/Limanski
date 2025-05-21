import * as gui from './gui.js'
import { InputController } from './input.js';
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

let workspace = new Workspace();
workspace.Size = gui.CDim.Comps(.8, 1, 0, -20)
workspace.Position = gui.CDim.Comps(0, 0, 0, 20);
workspace.BackgroundColor = new gui.Color(230,230,230);
workspace.AddElement(new Comment("my comment"))

let topbar = new gui.Rectangle()
topbar.Size = gui.CDim.Comps(1, 0, 0, 20);
topbar.Color = gui.Control.Palette.Main;

let file_button = new gui.Button()
topbar.AddChild(file_button);
file_button.Size = gui.CDim.Comps(0, 1, 50, 0);
file_button.Text = 'File'

let edit_button = new gui.Button()
topbar.AddChild(edit_button);
edit_button.Position = gui.CDim.Comps(0,0,50,0);
edit_button.Size = gui.CDim.Comps(0, 1, 50, 0);
edit_button.Text = 'Edit'

layer.Add(workspace, topbar)

let draw_update = () => {};
draw_update = () => {
    layer.Draw();
    InputController.Update();
    window.requestAnimationFrame(draw_update)
}
window.requestAnimationFrame(draw_update)

