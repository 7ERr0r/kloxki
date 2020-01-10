import { _Block } from "../Block";
import { _Klocki } from "../../client/Klocki";

import { _BlockModel } from "./Model";

export class _ModelRegistry {
    public _nameModelMap: Map<string, _BlockModel>;
    public _namePromiseMap: Map<string, Promise<any>>;
    public _klocki: _Klocki;

    constructor(klocki: _Klocki) {
        this._klocki = klocki;
        this._nameModelMap = new Map();
        this._namePromiseMap = new Map();
    }
    public _loadModel(name: string): _BlockModel | null {
        const mjson = this._klocki._getAssetJSON("models/" + name);
        if (!mjson) {
            // console.warn("no model for "+name);
            return null;
        }
        const loaded = _BlockModel._load(mjson);
        // _Klocki._log(name, mjson, loaded)
        if (loaded._parent !== null) {
            const parentModel = this._getModel(loaded._parent);
            if (parentModel != null) {
                loaded._init(parentModel);
            } else {
                _Klocki._log("null parentModel?", name);

                return null;
            }
        }

        return loaded;
    }
    public _getModel(name: string): _BlockModel | null {
        const model = this._nameModelMap.get(name);
        if (!model) {
            return this._loadModel(name);
        }

        return model;
    }
}
