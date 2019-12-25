
import { mat4, vec3 } from "gl-matrix";

import { _KlockiTexture } from "../txt/KlockiTexture";
import { _WorldRenderer } from "../renderer/WorldRenderer";
import { _TextureInfo } from "../txt/TextureInfo";
import { _Klocki } from "../Klocki";

class _RenderPoint {
    public _pos: vec3;
    constructor(pos: vec3) {
        this._pos = pos;
    }
}
export class _RenderLayerVoxels {
    public static _tempPoints: vec3[] = [vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create(), vec3.create()];
    public static _identity: mat4 = mat4.create();
    public _x: number;
    public _y: number;
    public _z: number;
    public _dx: number;
    public _dy: number;
    public _dz: number;
    public _texture: _KlockiTexture;
    public _positions: _RenderPoint[];
    public _cachedBuf: Uint8Array;

    constructor(klocki: _Klocki, x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: _KlockiTexture) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._dx = dx;
        this._dy = dy;
        this._dz = dz;
        this._texture = texture;
        this._positions = [];

        const as = klocki._textureManager._atlasSize;
        const wr = klocki._worldRendererMobsHelper;
        wr._reset();
        wr._atlas = this._texture._atlasId;
        /*
        for (let i = 0; i < 8; i++) {
            const cubeVert = simpleCube[i];
            const pos = vec3.fromValues(this._x + this._dx * cubeVert.X, this._y + this._dy * cubeVert.Y, this._z + this._dz * cubeVert.Z);
            this._positions.push(new _RenderPoint(pos));
        }
        
        for (let facei = 0; facei < 6; facei++) {
            const face = faceVertices[facei];

            const verts = face.verts;

            let color = 0xFFFFFFFF;
            if (facei == 2 || facei == 3) {
                color = 0xFFCCCCCC;
            }
            if (facei == 4 || facei == 5) {
                color = 0xFFAAAAAA;
            }
            if (facei == 1) {
                color = 0xFF999999;
            }
            

            const cubeIndices = face.cubeIndices;

            for (let i = 0; i < 4; i++) {
                const vert = verts[i];

                const pos = this._positions[cubeIndices[i]]._pos;
                wr._pos(pos[0], pos[1], pos[2])._tex(texOffsetX + vert.TOffsetX * texScaleX, texOffsetY + vert.TOffsetY * texScaleY)._color(color)._endVertex();
            }
            */
        const tex = this._texture;
        const texOffsetX = tex._subRect._min._x / as;
        const texOffsetY = tex._subRect._min._y / as;
        const texScaleX = tex._subRect._dx() / as;
        const texScaleY = tex._subRect._dy() / as;
        let color = 0xFFFFFFFF;

        let vx = 0.0;
        
        let vy = 1.0;
        let vz = 0.0;
        let fixtexx = 0.0;
        let fixtexz = 0.0;
        function poormacro(){
            wr._pos(x+dx*vx, y+dy*vy, z+dz*vz)._tex(texOffsetX + (vx+fixtexx) * texScaleX, texOffsetY + (vz+fixtexz) * texScaleY)._color(color)._endVertex();
        }

        vx = 0.0;
        vz = 0.0;
        poormacro();
        vx = 1.0;
        poormacro();
        vx = 0.0;
        vz = 1.0;
        poormacro();
        vx = 1.0;
        poormacro();

        vy = 0;
        vx = 1.0;
        vz = 0.0;
        poormacro();
        vx = 0.0;
        poormacro();
        vx = 1.0;
        vz = 1.0;
        poormacro();
        vx = 0.0;
        poormacro();

        let divisions = 16;
        let delta = 1.0/divisions;
        vz = 0.0;
        fixtexx = 0;
        fixtexz = delta/2;
        for(let i = 0; i<divisions; i++){
            vy = 0.0;
            vx = 0.0;
            poormacro();
            vy = 0.0;
            vx = 1.0;
            poormacro();

            vy = 1.0;
            vx = 0.0;
            poormacro();
            vy = 1.0;
            vx = 1.0;
            poormacro();

            vz += delta;
            
        }
        vz = delta;
        fixtexx = 0;
        fixtexz = -delta/2;
        for(let i = 0; i<divisions; i++){
            vy = 1.0;
            vx = 0.0;
            poormacro();
            vy = 1.0;
            vx = 1.0;
            poormacro();
            
            vy = 0.0;
            vx = 0.0;
            poormacro();
            vy = 0.0;
            vx = 1.0;
            poormacro();

            vz += delta;
            
        }

        

        vx = delta;
        fixtexx = -delta/2;
        fixtexz = 0;
        for(let i = 0; i<divisions; i++){

            vy = 0.0;
            vz = 0.0;
            poormacro();
            vy = 0.0;
            vz = 1.0;
            poormacro();

            vy = 1.0;
            vz = 0.0;
            poormacro();
            vy = 1.0;
            vz = 1.0;
            poormacro();

            vx += delta;
            
        }


        vx = 0.0;
        fixtexx = delta/2;
        fixtexz = 0;
        for(let i = 0; i<divisions; i++){
            vy = 1.0;
            vz = 0.0;
            poormacro();
            vy = 1.0;
            vz = 1.0;
            poormacro();
            
            vy = 0.0;
            vz = 0.0;
            poormacro();
            vy = 0.0;
            vz = 1.0;
            poormacro();

            vx += delta;
            
        }


        



        
        this._cachedBuf = new Uint8Array(wr._copyBuf());
    }

    public _renderAt(wr: _WorldRenderer, m: mat4) {

        wr._putPrepared(this._cachedBuf);
        const matID = wr._klocki._textureManager._pushGroupMatrix(m);

        wr._matMany(matID, (2+16*4)*4);


    }
}
