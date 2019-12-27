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
    public _loadModel(name: string): Promise<any> {
        let promise = this._namePromiseMap.get(name);
        if (promise) {
            return promise;
        }
        promise = new Promise((resolve, reject) => {
            let f = this._fetchModel(name);
            if(f == null){
                resolve(null);
                return;
            }
            
                
                f.then((mjson) => {
                    if (mjson === null) {
                        resolve(null);
                    } else {
                        
                            
                            const loaded = _BlockModel._load(mjson);
                            console.log(name, mjson, loaded)
                            if (loaded._parent !== null) {
                                this._getModel(loaded._parent).then((parentModel: _BlockModel) => {
                                    if(parentModel != null){
                                        loaded._init(parentModel);
                                        resolve(loaded);
                                    }else{
                                        console.log("null parentModel?")
                                        resolve(null);
                                    }
                                });
                            }else{
                                resolve(loaded);
                            }
                        
                    }
                });
            
        });
        
        this._namePromiseMap.set(name, promise);

        return promise;
    }
    public async _getModel(name: string): Promise<_BlockModel> {
        const model = this._nameModelMap.get(name);
        if (!model) {
            return await this._loadModel(name);
        }

        return model;
    }
}
