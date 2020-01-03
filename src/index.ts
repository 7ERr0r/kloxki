import { _Klocki } from './client/Klocki';

/*
(<any>window).createKlocki = (domID: string, options: any)=>{
    return new _Klocki(domID, options);
}
*/
(<any>window).Klocki = _Klocki;

// window.klocki = window.klocki || {};
// window.addEventListener("load", (ev: Event) => (window.klocki = new _Klocki()));
