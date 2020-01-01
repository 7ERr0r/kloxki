import { _Klocki } from "../Klocki";

import { _Shader } from "./Shader";

export class _ShaderLines extends _Shader {
    public _program: WebGLProgram;
    public _attribLocations: { _vertexPosition: number; _color: number };
    public _uniformLocations: { _projectionMatrix: WebGLUniformLocation | null };

    constructor(klocki: _Klocki) {
        super();
        let ink = klocki._display._inKeyword;
        const outk = klocki._display._outKeyword;
        const vsSource = klocki._display._glslPrefix+`
  ${ink} vec4 aVertexPosition;
  ${ink} vec4 aColor;

  uniform mat4 uProjectionMatrix;

  ${outk} lowp vec4 vertexColor;

  void main(void) {
    gl_Position = uProjectionMatrix * aVertexPosition;
    vertexColor = aColor;
  }
`;
    ink = klocki._display._inVaryingKeyword;
        const fsSource = klocki._display._glslPrefix+`
precision mediump float;

${ink} lowp vec4 vertexColor;


${klocki._display._version2?"out vec4 fragColor;":""} 
  void main(void) {
    
    ${klocki._display._version2?"fragColor":"gl_FragColor"} = vertexColor;
  }
`;
        const gl = klocki._display._gl;
        const program = this._initShaderProgram(gl, vsSource, fsSource);
        this._program = program;
        this._attribLocations = {
            _vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            _color: gl.getAttribLocation(program, 'aColor'),
        };

        this._uniformLocations = {
            _projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        };

    }

}
