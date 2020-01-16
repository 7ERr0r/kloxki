import { _OriginRenderOcTree } from "./OriginRenderOcTree";

export class _BakeStack {
    public _count: number;
    public _sections: Uint32Array;
    constructor(capacity: number) {
        this._count = 0;
        this._sections = new Uint32Array(capacity);
    }
}
