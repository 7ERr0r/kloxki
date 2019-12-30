
import { _Klocki } from "../Klocki";
import { _TextureInfo } from "../txt/TextureInfo";
import { _KlockiTexture } from "../txt/KlockiTexture";
import { _RenderPlayer } from "../render/RenderPlayer";

import { _KlockiEntityLiving } from "./KlockiEntityLiving";
import { _RenderBox } from "./RenderBox";
import { _RenderLayerVoxels } from "./RenderLayerVoxels";

export class _KlockiEntityPlayer extends _KlockiEntityLiving {

    public _gameMode: number = 0;

    public _skinInfo: _TextureInfo;
    public _skinLoaded: boolean;

    public _wingInfo: _TextureInfo;
    public _wingLoaded: boolean;

    public _headBox: _RenderBox | undefined;
    public _headOBox: _RenderBox | undefined;
    public _chestBox: _RenderBox | undefined;
    public _chestOBox: _RenderBox | undefined;
    public _limbBoxes: _RenderBox[] | undefined;
    public _legRightBox: _RenderBox | undefined;
    public _legRightOBox: _RenderBox | undefined;
    public _legLeftBox: _RenderBox | undefined;
    public _legLeftOBox: _RenderBox | undefined;
    public _armRightBox: _RenderBox | undefined;
    public _armRightOBox: _RenderBox | undefined;
    public _armLeftBox: _RenderBox | undefined;
    public _armLeftOBox: _RenderBox | undefined;
    public _wingLeft: _RenderLayerVoxels | undefined;
    public _wingRight: _RenderLayerVoxels | undefined;
    public _idleTime: number;
    public _armThickness: number;

    constructor(klocki: _Klocki) {
        super(klocki);
        this._width = 0.6;
        this._height = 1.8;

        this._armThickness = klocki.defaultArmThickness;

        this._skinLoaded = false;
        this._wingLoaded = false;

        this._idleTime = 0;

        const skinInfo: _TextureInfo = klocki._textureManager._loadTextureFromURL("assets/" + _Klocki._forbiddenWord + "/textures/entity/steve.png", null, (tex: _KlockiTexture) => {
            /*[
                tex._subTex(8/64.0, 8/64.0, 8/64.0, 8/64.0),
                tex._subTex(24/64.0, 8/64.0, 8/64.0, 8/64.0),
                tex._subTex(0/64.0, 8/64.0, 8/64.0, 8/64.0),
                tex._subTex(16/64.0, 8/64.0, 8/64.0, 8/64.0),
                tex._subTex(8/64.0, 0/64.0, 8/64.0, 8/64.0),
                tex._subTex(16/64.0, 0/64.0, 8/64.0, 8/64.0),
            ]*/

            /*
            const texs = [
                skinInfo,
                skinInfo,
                skinInfo,
                skinInfo,
                skinInfo,
                skinInfo,
            ]*/
            const limbOffsets = [
                [0, 16, 0, 32],
                [16, 48, 0, 48],
                [32, 48, 48, 48],
                [40, 16, 40, 32],
            ];
            const limbBoxes = this._limbBoxes = new Array<_RenderBox>(8);
            for (let i = 0; i < 4; i++) {
                const arms = i >= 2;
                const thichness = arms ? this._armThickness : 4;

                const off = limbOffsets[i];
                // i inside, o outside
                const litex = tex._stdBox64(off[0] + 4, off[1] + 4, thichness, 12, 4);
                const lotex = tex._stdBox64(off[2] + 4, off[3] + 4, thichness, 12, 4);

                limbBoxes[i * 2] = new _RenderBox(klocki, -(thichness / 2) / 16, -12 / 16, -2 / 16, thichness / 16, 12 / 16, 4 / 16, litex);
                limbBoxes[i * 2 + 1] = new _RenderBox(klocki, -(thichness + 0.4) / 2 / 16, -12.2 / 16, -2.2 / 16, (thichness + 0.4) / 16, 12.4 / 16, 4.4 / 16, lotex);

            }

            this._headBox = new _RenderBox(klocki, -4 / 16, 0, -4 / 16, 8 / 16, 8 / 16, 8 / 16, tex._stdBox64(8, 8, 8, 8, 8));
            this._headOBox = new _RenderBox(klocki, -4.2 / 16, -0.2 / 16, -4.2 / 16, 8.4 / 16, 8.4 / 16, 8.4 / 16, tex._stdBox64(8 + 32, 8, 8, 8, 8));
            this._chestBox = new _RenderBox(klocki, -4 / 16, -6 / 16, -2 / 16, 8 / 16, 12 / 16, 4 / 16, tex._stdBox64(20, 20, 8, 12, 4));
            this._chestOBox = new _RenderBox(klocki, -4.2 / 16, -6.2 / 16, -2.2 / 16, 8.4 / 16, 12.4 / 16, 4.4 / 16, tex._stdBox64(20, 20 + 16, 8, 12, 4));

            this._legRightBox = limbBoxes[0];
            this._legRightOBox = limbBoxes[1];

            this._legLeftBox = limbBoxes[2];
            this._legLeftOBox = limbBoxes[3];

            this._armRightBox = limbBoxes[4];
            this._armRightOBox = limbBoxes[5];

            this._armLeftBox = limbBoxes[6];
            this._armLeftOBox = limbBoxes[7];

            this._skinLoaded = true;
        }, false);

        const wingInfo: _TextureInfo = klocki._textureManager._loadTextureFromURL("assets/wings/wings3.png", null, (tex: _KlockiTexture) => {
            const divisions = 32;
            this._wingLeft = new _RenderLayerVoxels(klocki, divisions, 0, 0, 0, 1, 1 / divisions, 1, tex);
            this._wingRight = new _RenderLayerVoxels(klocki, divisions, 0, 0, 0, 1, 1 / divisions, 1, tex);
            this._wingLoaded = true;
        }, true);
        this._skinInfo = skinInfo;
        this._wingInfo = wingInfo;
    }

    public _tick() {

        super._tick();
        const dx = this._posX - this._prevPosX;
        const dz = this._posZ - this._prevPosZ;
        this._prevLimbSwingAmount = this._limbSwingAmount;
    
        let dist = Math.sqrt(dx * dx + dz * dz) * 4;
        if (dist > 1) {
            dist = 1;
        }
    
        this._limbSwingAmount += (dist - this._limbSwingAmount) * 0.4;
        this._limbSwing += this._limbSwingAmount;
    }
    public _render() {
        if (!this._skinLoaded) {
            console.log("skin not loaded");

            return;
        }
        this._klocki._entityRenders._renderPlayer._render(this);
        
    }
}
