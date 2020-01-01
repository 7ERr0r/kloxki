
export class _Shader {
    public _loadShader(gl: WebGL2RenderingContext | WebGLRenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error("can't create shader");
        }
        // send the source to the shader object

        gl.shaderSource(shader, source);

        // compile the shader program

        gl.compileShader(shader);

        // see if it compiled successfully

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            
            console.log(source);
            console.warn('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            throw new Error("can't compile shader");
        }

        return shader;
    }

    public _initShaderProgram(gl: WebGL2RenderingContext | WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
        const vertexShader = this._loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        if (!shaderProgram) {
            throw new Error("can't create shader program");
        }
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.warn('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            throw new Error("can't link shader program");
        }

        return shaderProgram;
    }

}
