export class _Display {
    public _canvas: HTMLCanvasElement;
    public _gl: WebGL2RenderingContext;
    public _domWidth: number = 256;
    public _domHeight: number = 256;
    public _width: number = 0;
    public _height: number = 0;
    public _guiWidth: number = 0;
    public _guiHeight: number = 0;
    public _guiScale: number = 2;
    public _indexBuffer!: WebGLBuffer;
    public _resizeGetter: Function;
    public _translucent: boolean;
    public _pixelDensityMultiplier: number;


    constructor(domID: string, attributes: any) {
        this._pixelDensityMultiplier = 1;
        if (attributes && attributes.resizeGetter instanceof Function) {
            this._resizeGetter = attributes.resizeGetter;
        } else {
            this._resizeGetter = () => ({ width: window.innerWidth, height: window.innerHeight });
        }
        const canvas: HTMLElement | null = document.getElementById(domID);
        if (!canvas) {
            throw new Error('#' + domID + ' not found');
        }
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('#' + domID + ' is not a canvas');
        }
        const glAttributes = { antialias: false, translucent: false };
        if (attributes && typeof attributes.antialias !== "undefined") {
            glAttributes.antialias = attributes.antialias;
        }
        if (attributes && typeof attributes.translucent !== "undefined") {
            glAttributes.translucent = attributes.translucent;
        }
        this._translucent = glAttributes.translucent;
        const webgl = canvas.getContext('webgl2', glAttributes) || canvas.getContext('experimental-webgl2', glAttributes);
        if (!(webgl instanceof WebGL2RenderingContext)) {
            alert('WebGL2 is not supported in your browser');
            throw new Error('WebGL2 not supported');
        }
        this._gl = webgl;
        this._canvas = canvas;

        this._pixelDensityMultiplier = Math.max(this._pixelDensityMultiplier, this._calcHighDensity());
        this._pixelDensityMultiplier = Math.max(this._pixelDensityMultiplier, this._calcRetina());
        

        this._resize();
        window.addEventListener("resize", (ev: Event) => this._resize());

        this._generateIndices();

    }
    public _resize(): void {
        const resizeInfo = this._resizeGetter();
        this._domWidth = resizeInfo.width;
        this._domHeight = resizeInfo.height;

        this._width = this._domWidth * this._pixelDensityMultiplier;
        this._height = this._domHeight * this._pixelDensityMultiplier;

        this._canvas.style.width = `${this._domWidth}px`;
        this._canvas.style.height = `${this._domHeight}px`;

        this._guiWidth = this._width / this._guiScale;
        this._guiHeight = this._height / this._guiScale;


        this._canvas.width = this._width;
        this._canvas.height = this._height;

        this._gl.viewport(0, 0, this._width, this._height);
    }

    private _generateIndices() {
        const gl = this._gl;
        const indexBuffer = gl.createBuffer();
        this._indexBuffer = indexBuffer!;

        const numQuads = 32 * 1024;
        const indices = new Uint32Array(6 * numQuads);
        let j = 0, k = 0;
        for (let i = 0; i < numQuads; i++) {
            j = i * 6;
            k = i * 4;
            
            indices[j + 0] = k + 0;
            indices[j + 1] = k + 1;
            indices[j + 2] = k + 2;
            indices[j + 3] = k + 3;
            indices[j + 4] = k + 2;
            indices[j + 5] = k + 1;
            
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    }
    public _calcHighDensity() {
        let val = ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));
        return val?2:1;
    }
    
    public _calcRetina() {
        let val = ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)').matches)) || (window.devicePixelRatio && window.devicePixelRatio >= 2)) && /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
        return val?2:1;
    }
}
