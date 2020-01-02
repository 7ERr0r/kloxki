import { _Klocki } from "../Klocki";

import { _Shader } from "./Shader";

export class _ShaderUI extends _Shader {
    public _program: WebGLProgram;
    public _attribLocations: { _vertexPosition: number; _textureCoord: number; _textureAtlas: number; _color: number };
    public _uniformLocations: { _uiMatrix: WebGLUniformLocation | null; _uSampler: WebGLUniformLocation | null };

    constructor(klocki: _Klocki) {
        super();
        let ink = klocki._display._inKeyword;
        const outk = klocki._display._outKeyword;
        const mainSamplerk = klocki._display._mainSamplerKeyword;
        const vsSource = klocki._display._glslPrefix + `
        ${ink} vec4 aVertexPosition;
        ${ink} vec2 aTextureCoord;
        ${ink} float aTextureAtlas;
        ${ink} vec4 aColor;

  uniform mat4 uUiMatrix;

  ${outk} lowp vec4 vertexColor;
  ${outk} highp vec3 vTextureCoord;

  void main(void) {
    gl_Position = uUiMatrix * aVertexPosition;
    vertexColor = aColor;
    vTextureCoord = vec3(aTextureCoord, aTextureAtlas);
  }
`;
        ink = klocki._display._inVaryingKeyword;
        const fsSource = klocki._display._glslPrefix + `
precision mediump float;

${ink} highp vec3 vTextureCoord;
${ink} lowp vec4 vertexColor;

  uniform mediump ${mainSamplerk} uSampler;

  ${klocki._display._version2 ? "out vec4 fragColor;" : ""}
  void main(void) {
    vec4 tmpColor = ${klocki._display._version1 ? "texture2D(uSampler, vec2(vTextureCoord))" : "texture(uSampler, vTextureCoord)"} * vertexColor;
    if(tmpColor.a < 0.1){
      discard;
    }
    ${klocki._display._version2 ? "fragColor" : "gl_FragColor"} = tmpColor;
  }
`;
        const gl = klocki._display._gl;
        const program = this._initShaderProgram(gl, vsSource, fsSource);
        this._program = program;
        this._attribLocations = {
            _vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            _textureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
            _textureAtlas: gl.getAttribLocation(program, 'aTextureAtlas'),
            _color: gl.getAttribLocation(program, 'aColor'),
        };

        this._uniformLocations = {
            _uiMatrix: gl.getUniformLocation(program, 'uUiMatrix'),
            _uSampler: gl.getUniformLocation(program, 'uSampler'),
        };

    }

}
