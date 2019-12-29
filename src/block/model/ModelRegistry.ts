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
    public _fetchModel(name: string): Promise<any> | null {
        const guiChat = this._klocki._guiChat;
        if (guiChat) {
            guiChat._appendMessage({ text: "Loading model " + name });
        }
        let url = this._klocki._assetURI+"assets/" + _Klocki._forbiddenWord + "/models/" + name + ".json";
        //console.log("fetchModel", url)
        try {
        return fetch(url)
            .then((response)=>{
                if (!response.ok || response.status !== 200) {
                    return null;
                }
                //console.log("fetchedModel", url)

                return response.json();
            });
        }catch(e){
            return null;
        }
            
    }
    public _loadModel(name: string): _BlockModel | null {
        let mjson = this._klocki._getAssetJSON("models/"+name);
        if(!mjson){
            //console.warn("no model for "+name);
            return null;
        }
        const loaded = _BlockModel._load(mjson);
        //console.log(name, mjson, loaded)
        if (loaded._parent !== null) {
            const parentModel = this._getModel(loaded._parent);
            if(parentModel != null){
                loaded._init(parentModel);
            }else{
                console.log("null parentModel?", name)
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
