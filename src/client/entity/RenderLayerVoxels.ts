
import { mat4, vec3 } from "gl-matrix";

import { _KlockiTexture } from "../txt/KlockiTexture";
import { _WorldRenderer } from "../renderer/WorldRenderer";
import { _TextureInfo } from "../txt/TextureInfo";
import { _Klocki } from "../Klocki";

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
    public _cachedBuf: Uint8Array;
    public _divisions: number;

    constructor(klocki: _Klocki, divisions: number, x: number, y: number, z: number, dx: number, dy: number, dz: number, texture: _KlockiTexture) {
        this._divisions = divisions;
        this._x = x;
        this._y = y;
        this._z = z;
        this._dx = dx;
        this._dy = dy;
        this._dz = dz;
        this._texture = texture;

        const as = klocki._textureManager._atlasSize;
        const wr = klocki._worldRendererMobsHelper;
        wr._reset();
        wr._atlas = this._texture._atlasId;

        const tex = this._texture;
        const texOffsetX = tex._subRect._min._x / as;
        const texOffsetY = tex._subRect._min._y / as;
        const texScaleX = tex._subRect._dx() / as;
        const texScaleY = tex._subRect._dy() / as;
        const color = 0xFFFFFFFF;

        let vx = 0;
        
        let vy = 1;
        let vz = 0;
        let fixtexx = 0;
        let fixtexz = 0;
        function poormacro() {
            wr._pos(x + dx * vx, y + dy * vy, z + dz * vz)._tex(texOffsetX + (vx + fixtexx) * texScaleX, texOffsetY + (vz + fixtexz) * texScaleY)._color(color)._endVertex();
        }

        vx = 0;
        vz = 0;
        poormacro();
        vx = 1;
        poormacro();
        vx = 0;
        vz = 1;
        poormacro();
        vx = 1;
        poormacro();

        vy = 0;
        vx = 1;
        vz = 0;
        poormacro();
        vx = 0;
        poormacro();
        vx = 1;
        vz = 1;
        poormacro();
        vx = 0;
        poormacro();

        const delta = 1 / divisions;
        vz = 0;
        fixtexx = 0;
        fixtexz = delta / 2;
        for (let i = 0; i < divisions; i++) {
            vy = 0;
            vx = 0;
            poormacro();
            vy = 0;
            vx = 1;
            poormacro();

            vy = 1;
            vx = 0;
            poormacro();
            vy = 1;
            vx = 1;
            poormacro();

            vz += delta;
            
        }
        vz = delta;
        fixtexx = 0;
        fixtexz = -delta / 2;
        for (let i = 0; i < divisions; i++) {
            vy = 1;
            vx = 0;
            poormacro();
            vy = 1;
            vx = 1;
            poormacro();
            
            vy = 0;
            vx = 0;
            poormacro();
            vy = 0;
            vx = 1;
            poormacro();

            vz += delta;
            
        }

        vx = delta;
        fixtexx = -delta / 2;
        fixtexz = 0;
        for (let i = 0; i < divisions; i++) {

            vy = 0;
            vz = 0;
            poormacro();
            vy = 0;
            vz = 1;
            poormacro();

            vy = 1;
            vz = 0;
            poormacro();
            vy = 1;
            vz = 1;
            poormacro();

            vx += delta;
            
        }

        vx = 0;
        fixtexx = delta / 2;
        fixtexz = 0;
        for (let i = 0; i < divisions; i++) {
            vy = 1;
            vz = 0;
            poormacro();
            vy = 1;
            vz = 1;
            poormacro();
            
            vy = 0;
            vz = 0;
            poormacro();
            vy = 0;
            vz = 1;
            poormacro();

            vx += delta;
            
        }

        this._cachedBuf = new Uint8Array(wr._copyBuf());
    }

    public _renderAt(wr: _WorldRenderer, m: mat4) {

        wr._putPrepared(this._cachedBuf);
        const matID = wr._klocki._textureManager._pushGroupMatrix(m);

        wr._matMany(matID, (2 + this._divisions * 4) * 4);

    }
}
