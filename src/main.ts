import * as gui from './gui.js'

let canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let context = canvas.getContext('2d');
let layer = new gui.GUILayer();

gui.Control.Canvas = canvas;
gui.Control.Context = context!;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

layer.Add(new gui.Rectangle())

window.requestAnimationFrame(layer.Draw)
