export class _Display {
    public _canvas: HTMLCanvasElement;
    public _gl: WebGL2RenderingContext | WebGLRenderingContext;
    public _domWidth: number = 256;
    public _domHeight: number = 256;
    public _width: number = 0;
    public _height: number = 0;
    public _guiWidth: number = 0;
    public _guiHeight: number = 0;
    public _guiScale: number = 2;
    public _indexBuffer16!: WebGLBuffer;
    public _indexBuffer32!: WebGLBuffer;
    public _resizeGetter: Function;
    public _translucent: boolean;
    public _pixelDensityMultiplier: number;
    public _version2: boolean;
    public _version1: boolean;
    private _vertexArrayExt: OES_vertex_array_object | undefined;
    private _textureFloatExt: OES_texture_float | undefined | null;
    public readonly _glslPrefix: string;
    public readonly _inKeyword: string;
    public readonly _outKeyword: string;
    public readonly _inVaryingKeyword: string;
    public readonly _mainSamplerKeyword: string;


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
        const context = canvas.getContext('webgl2', glAttributes) || canvas.getContext('experimental-webgl2', glAttributes) || canvas.getContext('webgl', glAttributes);
        this._version2 = context instanceof WebGL2RenderingContext;
        this._version1 = context instanceof WebGLRenderingContext;
        if (!(this._version1 || this._version2)) {
            console.warn('WebGL is not supported in your browser');
            throw new Error('WebGL not supported');
        }
        const gl = <WebGL2RenderingContext | WebGLRenderingContext>context;
        this._gl = gl;
        this._canvas = canvas;


        if(this._version1){
              this._vertexArrayExt = (
              gl.getExtension('OES_vertex_array_object') ||
              gl.getExtension('MOZ_OES_vertex_array_object') ||
              gl.getExtension('WEBKIT_OES_vertex_array_object')
            );
            if(!this._vertexArrayExt){
                throw new Error('No WebGL1 vertex_array_object');
            }
            this._textureFloatExt = gl.getExtension('OES_texture_float');
            if(!this._textureFloatExt){
                throw new Error('No WebGL1 texture_float');
            }
        }

        if(this._version1){
            this._glslPrefix = "";
            this._inKeyword = "attribute";
            this._outKeyword = "varying";
            this._inVaryingKeyword = "varying";
            this._mainSamplerKeyword = "sampler2D";
        }else{
            this._glslPrefix = "#version 300 es";
            this._inKeyword = "in";
            this._inVaryingKeyword = "in";
            this._outKeyword = "out";
            this._mainSamplerKeyword = "sampler2DArray";
        }

        this._pixelDensityMultiplier = Math.max(this._pixelDensityMultiplier, this._calcHighDensity());
        this._pixelDensityMultiplier = Math.max(this._pixelDensityMultiplier, this._calcRetina());
        

        this._resize();
        window.addEventListener("resize", (ev: Event) => this._resize());

        this._generateIndices16();

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

    public _generateIndices32() {
        const gl = this._gl;

        
        const indexBuffer32 = gl.createBuffer();
        this._indexBuffer32 = indexBuffer32!;

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
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer32);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    }
    public _generateIndices16() {
        const gl = this._gl;

        
        const indexBuffer16 = gl.createBuffer();
        this._indexBuffer16 = indexBuffer16!;

        const numQuads = 32 * 1024;
        const indices = new Uint16Array(6 * numQuads);
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
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer16);
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

    public _createVertexArray(): WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null {
        if(this._version1){
            return this._vertexArrayExt!.createVertexArrayOES();
        }else{
            return (<WebGL2RenderingContext>this._gl).createVertexArray();
        }
    }
    public _bindVertexArray(arr: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) {
        if(this._version1){
            this._vertexArrayExt!.bindVertexArrayOES(arr);
        }else{
            (<WebGL2RenderingContext>this._gl).bindVertexArray(arr);
        }
    }
}
