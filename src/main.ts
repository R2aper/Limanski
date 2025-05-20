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
workspace.Size = gui.CDim.Comps(.8, 1, 0, 0)
workspace.Position = gui.CDim.Comps(0,0,0,0);
workspace.BackgroundColor = new gui.Color(230,230,230);
workspace.AddElement(new Comment("my comment"))

layer.Add(workspace)

let draw_update = () => {};
draw_update = () => {
    layer.Draw();
    InputController.Update();
    window.requestAnimationFrame(draw_update)
}
window.requestAnimationFrame(draw_update)

