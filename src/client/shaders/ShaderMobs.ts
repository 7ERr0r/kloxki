import { _Klocki } from "../Klocki";

import { _Shader } from "./Shader";

export class _ShaderMobs extends _Shader {

    public _program: WebGLProgram;
    public _attribLocations: { _vertexPosition: number; _textureCoord: number; _textureAtlas: number; _color: number; _groupMatrixID: number };
    public _uniformLocations: { _projectionMatrix: WebGLUniformLocation | null; _uSampler: WebGLUniformLocation | null ; _uGroupinfoSampler: WebGLUniformLocation | null };
    public _klocki: _Klocki;

    constructor(klocki: _Klocki) {
        super();
        this._klocki = klocki;
        let ink = klocki._display._inKeyword;
        const outk = klocki._display._outKeyword;
        const mainSamplerk = klocki._display._mainSamplerKeyword;
        let getGroupMatrix: string;
        if (klocki._display._version2) {
            getGroupMatrix = `mat4 getGroupMatrix(int id){
            id = id << 2;
            int groupMatrixX = id & 255;
            int groupMatrixY = id >> 8;
            vec4 ga = texelFetch(uGroupinfoSampler, ivec2(groupMatrixX, groupMatrixY), 0);
            vec4 gb = texelFetch(uGroupinfoSampler, ivec2(groupMatrixX+1, groupMatrixY), 0);
            vec4 gc = texelFetch(uGroupinfoSampler, ivec2(groupMatrixX+2, groupMatrixY), 0);
            vec4 gd = texelFetch(uGroupinfoSampler, ivec2(groupMatrixX+3, groupMatrixY), 0);
            return mat4(ga, gb, gc, gd);
          }`;
        } else {
            getGroupMatrix = `
          

          mat4 getGroupMatrix(float id){
            float y = 256.0;
            id = id * 4.0;
            float groupMatrixY = floor(id / y);
            float groupMatrixX = id - y * groupMatrixY;
            
            vec4 ga = texture2D(uGroupinfoSampler, vec2(groupMatrixX, groupMatrixY)/y);
            vec4 gb = texture2D(uGroupinfoSampler, vec2(groupMatrixX+1.0, groupMatrixY)/y);
            vec4 gc = texture2D(uGroupinfoSampler, vec2(groupMatrixX+2.0, groupMatrixY)/y);
            vec4 gd = texture2D(uGroupinfoSampler, vec2(groupMatrixX+3.0, groupMatrixY)/y);
            return mat4(ga, gb, gc, gd);
          }`;
        }

        const vsSource = klocki._display._glslPrefix + `
        ${ink} vec4 aVertexPosition;
        ${ink} vec2 aTextureCoord;
        ${klocki._display._version2 ? "in int aTextureAtlas;" : "attribute float aTextureAtlas;"}
        ${ink} vec4 aColor;
        ${klocki._display._version2 ? "in int aGroupMatrixID;" : "attribute float aGroupMatrixID;"}

  
    uniform mat4 uProjectionMatrix;
    uniform lowp sampler2D uGroupinfoSampler;
  
    ${outk} lowp vec4 vertexColor;
    ${outk} lowp vec3 vTextureCoord;
  
    ${getGroupMatrix}
    void main(void) {
      vec4 pos = aVertexPosition;

      
      pos = getGroupMatrix(aGroupMatrixID) * pos;

      gl_Position = uProjectionMatrix * (pos);
      vertexColor = aColor;
      vTextureCoord = vec3(aTextureCoord, aTextureAtlas);
    }
  `;
        ink = klocki._display._inVaryingKeyword;
        const fsSource = klocki._display._glslPrefix + `
  precision lowp float;
  
  ${ink} lowp vec3 vTextureCoord;
  ${ink} lowp vec4 vertexColor;
  
    uniform lowp ${mainSamplerk} uSampler;
    
  
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
        // this._gl = gl;
        const program = this._initShaderProgram(gl, vsSource, fsSource);
        this._program = program;
        this._attribLocations = {
            _vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            _textureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
            _textureAtlas: gl.getAttribLocation(program, 'aTextureAtlas'),
            _color: gl.getAttribLocation(program, 'aColor'),
            _groupMatrixID: gl.getAttribLocation(program, 'aGroupMatrixID'),
        };
        this._uniformLocations = {
            _projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
            _uSampler: gl.getUniformLocation(program, 'uSampler'),
            _uGroupinfoSampler: gl.getUniformLocation(program, 'uGroupinfoSampler'),
        };

    }

}
