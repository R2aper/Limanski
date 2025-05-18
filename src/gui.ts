
/**
 * A class representing a 2d vector
 */
export class Vec2 {
    public X: number = 0;
    public Y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        this.X = x;
        this.Y = y;
    }

    public Add(other: Vec2): Vec2 {
        return new Vec2(this.X + other.X, this.Y + other.Y);
    }

    public Sub(other: Vec2): Vec2 {
        return new Vec2(this.X - other.X, this.Y - other.Y);
    }

    public Mult(other: number | Vec2): Vec2 {
        if (typeof other === 'number') {
            return new Vec2(this.X * other, this.Y * other); 
        } else {
            return new Vec2(this.X * other.X, this.Y * other.Y);
        }
    }

    public Div(other: number | Vec2): Vec2 {
        if (typeof other === 'number') {
            return new Vec2(this.X / other, this.Y / other); 
        } else {
            return new Vec2(this.X / other.X, this.Y / other.Y);
        }
    }

    static From<T extends Record<string, number>>(obj: T, keys: { x: keyof T; y: keyof T }): Vec2 {
        return new Vec2(obj[keys.x], obj[keys.y]);
    }
    
    public Wise(f: (_: number) => number): Vec2 {
        return new Vec2(f(this.X), f(this.Y))
    }
}

/**
 * Represents relative and absolute components of a 2d position of a GUI {@link Control | Control} element
 */
export class CDim {
    public Relative: Vec2;
    public Absolute: Vec2;

    public static FromRelative(rx: number, ry: number): CDim { return this.Comps(rx, ry, 0, 0); }
    public static FromAbsolute(ax: number, ay: number): CDim { return this.Comps(1, 1, ax, ay); }
    public static Identity(): CDim { return this.Comps(1, 1, 0, 0); }
    
    public static Comps(rx: number, ry: number, ax: number, ay: number): CDim {
        return new CDim(new Vec2(rx, ry), new Vec2(ax, ay));
    }

    public With(measure: Vec2) {
        return this.Relative.Mult(measure).Add(this.Absolute);
    }

    constructor(rel: Vec2, abs: Vec2) {
        this.Absolute = abs;
        this.Relative = rel;
    }
}

export class Color {
    public R: number;
    public G: number;
    public B: number;

    public CSS(): string { return `rgb(${this.R}, ${this.G}, ${this.B})`; }

    constructor(r: number, g: number, b: number) {
        this.R = r;
        this.G = g;
        this.B = b;
    }
}

/**
 * Base class for canvas controls (GUI elements)
 */
export abstract class Control {

    public static Canvas: HTMLCanvasElement;
    public static Context: CanvasRenderingContext2D;

    public Position: CDim = CDim.Comps(0,0,0,0);
    public Size: CDim = CDim.Identity();
    public Anchor: Vec2 = new Vec2(0,0);
    
    public Parent: Control | undefined;
    public Children: Control[]

    protected GetContext(): CanvasRenderingContext2D { return Control.Canvas.getContext('2d')!; }

    public PixelSize(): Vec2 {
        const parentSize = this.Parent?.PixelSize() ?? 
            new Vec2(Control.Canvas.width, Control.Canvas.height); // Use .width/.height
        return this.Size.With(parentSize);
    }
    
    public PixelPosition(): Vec2 {
        const parentSize = this.Parent?.PixelSize() ?? 
            new Vec2(Control.Canvas.width, Control.Canvas.height); // Use .width/.height
        let position = this.Position.With(parentSize);
        return position.Sub(position.Mult(this.Anchor));
    }

    constructor() {
        this.Children = []
    }

    /** @virtual */
    public Draw(): void { 
        for(let child of this.Children) { child.Draw(); }
    }
}

export class GUILayer {
    public Elements: Control[] = [];

    public Add(...controls: Control[]): void {
        for(let control of controls) {
            this.Elements.push(control);
        }
    }

    public Draw(): void {

        for(let child of this.Elements) {
            child.Draw();
        }
        window.requestAnimationFrame(this.Draw)
    }

    constructor() { 
        this.Draw = this.Draw.bind(this);
    }
}

export class Rectangle extends Control {
    
    public Color: Color = new Color(0,255,0);

    public override Draw(): void {

        let ctx = Control.Context;
        let pos = this.PixelPosition();
        let size = this.PixelSize();

        console.log(pos)
        console.log(size)

        ctx.fillStyle = this.Color.CSS();
        ctx.beginPath();
        ctx.rect(pos.X, pos.Y, size.X, size.Y);
        ctx.fill()

        super.Draw();
    }
}