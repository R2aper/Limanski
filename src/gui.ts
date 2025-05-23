import { GenericEvent } from "./events.js";


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

    public static One(): Vec2 { return new Vec2(1,1); }
    public static Zero(): Vec2 { return new Vec2(0,0); }

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

    public Length(): number {
        return Math.sqrt(this.X*this.X + this.Y*this.Y)
    }

    static From<T extends Record<string, number>>(obj: T, keys: { x: keyof T; y: keyof T }): Vec2 {
        return new Vec2(obj[keys.x], obj[keys.y]);
    }
    
    public Wise(f: (_: number) => number): Vec2 {
        return new Vec2(f(this.X), f(this.Y))
    }

    public Contains(bottom_right: Vec2, probe: Vec2): boolean {
        return probe.X >= this.X && probe.X <= bottom_right.X && probe.Y >= this.Y && probe.Y <= bottom_right.Y;
    }
}

/**
 * Represents relative and absolute components of a 2d position of a GUI {@link Control | Control} element
 */
export class CDim {
    public Relative: Vec2;
    public Absolute: Vec2;

    public static FromRelative(rx: number, ry: number): CDim { return this.Comps(rx, ry, 0, 0); }
    public static FromAbsolute(ax: number, ay: number): CDim { return this.Comps(0, 0, ax, ay); }
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

/**
 * Represents an RGBA color value
 */
export class Color {
    public R: number;
    public G: number;
    public B: number;
    public A: number = 100;

    /** 
     * Returns a CSS-friendly color string, able to be used as a canvas rule
     */
    public CSS(): string { return `rgba(${this.R} ${this.G} ${this.B} / ${this.A}%)`; }

    public static RGBA(r: number, g: number, b: number, a: number): Color {
        let color = new Color(r, g, b);
        color.A = a;
        return color;
    }

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

    public static Palette = {
        Main: new Color(66, 68, 122),
        Text: new Color(219, 178, 235),
        MainHover: new Color(88, 91, 160),
        MainActive: new Color(106, 110, 193)
    }

    public static Canvas: HTMLCanvasElement;
    public static Context: CanvasRenderingContext2D;
    public static Debug: boolean = false;

    public PositionChanged: GenericEvent<[CDim]> = new GenericEvent();
    private _Position: CDim = CDim.Comps(0, 0, 0, 0);

    public get Position(): CDim {
        return this._Position;
    }
    public set Position(value: CDim) {
        this._Position = value;
        this.PositionChanged.Fire(this._Position);
    }

    public SizeChanged: GenericEvent<[CDim]> = new GenericEvent();
    private _Size: CDim = CDim.Identity();
    public get Size(): CDim {
        return this._Size;
    }
    public set Size(value: CDim) {
        this._Size = value;
        this.SizeChanged.Fire(this._Size);
    }

    public Contains(probe: Vec2): boolean { 
        let adjusted_pos = this.PixelPosition();
        return adjusted_pos.Contains(
            adjusted_pos.Add(this.PixelSize()),
            probe
        );
    }

    public With<T extends this>(obj: Partial<T>): this {
        let current = this;
        const descriptors = new Map<PropertyKey, PropertyDescriptor>();
        
        while (current) {
            const currentDescriptors = Object.getOwnPropertyDescriptors(current);
            for (const [key, descriptor] of Object.entries(currentDescriptors)) {
                if (!descriptors.has(key)) {
                    descriptors.set(key, descriptor);
                }
            }
            current = Object.getPrototypeOf(current);
        }

        // Assign values
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const sourceValue = obj[key];
                if (sourceValue === undefined) continue;
                
                const descriptor = descriptors.get(key);
                
                if (descriptor) {
                    // Handle property with setter
                    if (descriptor.set) {
                        descriptor.set.call(this, sourceValue);
                    } 
                    // Handle regular property
                    else if (!descriptor.get || descriptor.writable !== false) {
                        (this as any)[key] = sourceValue;
                    }
                    // Skip readonly property
                } 

                else if ((this as any)[key] !== undefined) {
                    (this as any)[key] = sourceValue;
                }
            }
        }
    

        return this;
    }

    /**
     * Specifies which "part" of the element gets positioned:
     * @example
     * Vec2(0,0) // top left corner is positioned
     * Vec2(.5,.5) // middle of the element is positioned
     */
    public Anchor: Vec2 = new Vec2(0,0);
    
    public Parent: Control | undefined;
    public Children: Control[]

    public AddChild(child: Control): void {
        this.Children.push(child);
        child.Parent = this;
    }

    /** Get element size in pixels */
    public PixelSize(): Vec2 {
        const parentSize = this.Parent?.PixelSize() ?? 
            new Vec2(Control.Canvas.width, Control.Canvas.height);
        return this.Size.With(parentSize);
    }
    
    /** Get element position in pixels */
    public PixelPosition(): Vec2 {
        const parentSize = this.Parent?.PixelSize() ?? 
            new Vec2(Control.Canvas.width, Control.Canvas.height);
        let position = Vec2.Zero();
        if(this.Parent != undefined) {
            position = this.Parent.PixelPosition();
        }
        position = position.Add(this.Position.With(parentSize));
        return position.Sub(this.PixelSize().Mult(this.Anchor));
    }

    constructor() {
        this.Children = []
    }

    /** @virtual */
    public Draw(): void { 
        for(let child of this.Children) { child.Draw(); }
        if(Control.Debug) {
            let pos = this.PixelPosition();
            let size = this.PixelSize();

            Control.Context.font = '16px Arial'
            Control.Context.strokeStyle = 'magenta'
            Control.Context.fillStyle = 'magenta';
            Control.Context.lineWidth = 2;

            let textsize = Control.Context.measureText(this.constructor.name)
            let textWidth = textsize.width;
            let textHeight = textsize.actualBoundingBoxAscent + textsize.actualBoundingBoxDescent;

            Control.Context.beginPath();
            Control.Context.rect(pos.X, pos.Y, size.X, size.Y);
            Control.Context.stroke();

            
            Control.Context.beginPath();
            Control.Context.rect(pos.X, pos.Y, textWidth, textHeight);
            Control.Context.fill()

            Control.Context.fillStyle = 'black';
            Control.Context.fillText(this.constructor.name, pos.X, pos.Y + textHeight - 1)
        }
    }

    public Update(): void {
        for(let child of this.Children) { child.Update(); }
    }
}

/**
 * A container class for {@link Control | Controls}
 */
export class GUILayer {
    public Elements: Control[] = [];

    public Add(...controls: Control[]): void {
        for(let control of controls) {
            this.Elements.push(control);
        }
    }

    public Remove(control: Control) {
        console.log(this.Elements.indexOf(control))
        this.Elements.splice(this.Elements.indexOf(control), 1);
    } 

    public Draw(): void {
        for(let child of this.Elements) {
            child.Draw();
            child.Update();
        }
    }

    constructor() { 
        this.Draw = this.Draw.bind(this);
    }
}

/** Simple {@link Control | Control} that draws a filled rectangle */
export class Rectangle extends Control {
    
    public Color: Color = new Color(0,255,0);

    public override Draw(): void {

        let pos = this.PixelPosition();
        let size = this.PixelSize();

        Control.Context.fillStyle = this.Color.CSS();
        Control.Context.beginPath();
        Control.Context.rect(pos.X, pos.Y, size.X, size.Y);
        Control.Context.fill()

        super.Draw();
    }
}

/** 
 * A {@link Control | Control} that renders a provided image. Does not render until it is {@link ImageRect.Loaded | Loaded}
 */
export class ImageRect extends Control {
    public Source: HTMLImageElement;
    public Loaded: boolean = false;

    public override Draw(): void {
        if (!this.Loaded) return;

        let pos = this.PixelPosition();
        let size = this.PixelSize();

        Control.Context.drawImage(this.Source, pos.X, pos.Y, size.X, size.Y);

        super.Draw();
    }

    constructor(path: string) {
        super();
        this.Source = new Image();
        this.Source.src = path;
        this.Source.onload = () => { this.Loaded = true; }
    }
}

export class OrderedLayout extends Control {

    public Direction: "Horizontal" | "Vertical" = "Horizontal";
    public Padding: number = 5;

    public override AddChild(child: Control): void {
        let pos = this.PixelPosition();
        if(this.Children.length == 0) {
            child.Position = CDim.Comps(0,0,0,0);
            this.Children.push(child);
            child.Parent = this;
            return;
        }

        let previous_child = this.Children[this.Children.length - 1];
        let offset!: Vec2;
        if(this.Direction == "Horizontal") {
            offset = previous_child.Position.Absolute.Add(new Vec2(this.Padding + previous_child.PixelSize().X, 0))
        } else {
            offset = previous_child.Position.Absolute.Add(new Vec2(0, this.Padding + previous_child.PixelSize().Y))
        }

        this.Children.push(child);
        child.Parent = this;
        child.Position = CDim.FromAbsolute(offset.X, offset.Y);
    }
}