import { _Klocki } from "../client/Klocki";

export class _BlockStateMeta {

    public _json: any;

    constructor(mjson: any) {
        this._json = mjson;
    }

    public static _load(mjson: any) {
        return new _BlockStateMeta(mjson);
    }

    public _getAnyStateModelName(): string | null {
        const stateMeta = this._json;
        const variants = stateMeta.variants;
        if (variants) {
            // _Klocki._log(variants);
            const variantPropertyStrs = Object.keys(variants);
            const plen = variantPropertyStrs.length;
            for (let i = 0; i < plen; i++) {
                const variantPropertyStr = variantPropertyStrs[i];
                const variantOrArray = variants[variantPropertyStr];
                if (variantOrArray instanceof Array) {
                    const variants = variantOrArray;
                    const vlen = variants.length;
                    for (let j = 0; j < vlen; j++) {
                        const variant = variants[j];
                        const model = variant.model;

                        if (model) {
                            return model;
                        }
                    }
                } else {
                    const model = variantOrArray.model;
                    if (model) {
                        return model;
                    }
                }
            }
        }

        const multipart = stateMeta.multipart;
        if (multipart && multipart instanceof Array) {
            const mlen = multipart.length;
            for (let i = 0; i < mlen; i++) {
                const part = multipart[i];
                const apply = part.apply;
                if (apply && apply instanceof Array) {
                    const alen = apply.length;
                    for (let j = 0; j < alen; j++) {
                        const variant = apply[j];
                        const model = variant.model;
                        if (model) {
                            return model;
                        }
                    }
                } else {
                    const variant = apply;
                    const model = variant.model;
                    if (model) {
                        return model;
                    }
                }
            }
        }

        return null;
    }
    
}
