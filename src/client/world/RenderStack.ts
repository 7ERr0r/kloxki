import { _OriginRenderOcTree } from "./OriginRenderOcTree";

export class _RenderStackElement {
    public _nodeID: number;
    public _drawCount: number;
    public _buf: WebGLBuffer;

    constructor(nodeID: number, drawCount: number, buf: WebGLBuffer){
        this._nodeID = nodeID;
        this._drawCount = drawCount;
        this._buf = buf;
    }
}

export class _RenderStack {
    public _count: number;
    public _sections: Uint32Array;
    constructor(capacity: number){
        this._count = 0;
        this._sections = new Uint32Array(capacity);

    }
}