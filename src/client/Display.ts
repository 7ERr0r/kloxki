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
    public readonly _glslPrefix: string;
    public readonly _inKeyword: string;
    public readonly _outKeyword: string;
    public readonly _inVaryingKeyword: string;
    public readonly _mainSamplerKeyword: string;
    private readonly _vertexArrayExt: OES_vertex_array_object | undefined;
    private readonly _textureFloatExt: OES_texture_float | undefined | null;
    public _isMobile: boolean;

    constructor(domID: string, attributes: any) {
        this._pixelDensityMultiplier = 1;
        this._isMobile = this._calcIsMobile();

        if (attributes && attributes.resizeGetter instanceof Function) {
            this._resizeGetter = attributes.resizeGetter;
        } else {
            this._resizeGetter = () => ({ width: window.innerWidth, height: window.innerHeight+(this._isMobile?0:0) });
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

        if (this._version1) {
            this._vertexArrayExt = (
              gl.getExtension('OES_vertex_array_object') ||
              gl.getExtension('MOZ_OES_vertex_array_object') ||
              gl.getExtension('WEBKIT_OES_vertex_array_object')
            );
            if (!this._vertexArrayExt) {
                throw new Error('No WebGL1 vertex_array_object');
            }
            this._textureFloatExt = gl.getExtension('OES_texture_float');
            if (!this._textureFloatExt) {
                throw new Error('No WebGL1 texture_float');
            }
        }

        if (this._version1) {
            this._glslPrefix = "";
            this._inKeyword = "attribute";
            this._outKeyword = "varying";
            this._inVaryingKeyword = "varying";
            this._mainSamplerKeyword = "sampler2D";
        } else {
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
        const val = ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));

        return val ? 2 : 1;
    }
    
    public _calcRetina() {
        const val = ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)').matches)) || (window.devicePixelRatio && window.devicePixelRatio >= 2)) && /(iPad|iPhone|iPod)/g.test(navigator.userAgent);

        return val ? 2 : 1;
    }

    public _createVertexArray(): WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null {
        if (this._version1) {
            return this._vertexArrayExt!.createVertexArrayOES();
        } else {
            return (<WebGL2RenderingContext>this._gl).createVertexArray();
        }
    }
    public _bindVertexArray(arr: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) {
        if (this._version1) {
            this._vertexArrayExt!.bindVertexArrayOES(arr);
        } else {
            (<WebGL2RenderingContext>this._gl).bindVertexArray(arr);
        }
    }
    private _calcIsMobile(): boolean {
        let check = false;
        (function(a) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) { check = true; }})(navigator.userAgent || navigator.vendor || (<any>window).opera);

        return check;
    }
}
