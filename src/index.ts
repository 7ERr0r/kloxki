import { _Klocki } from './client/Klocki';
declare global {
    interface Window { klocki: _Klocki; }
}

window.klocki = window.klocki || {};
window.addEventListener("load", (ev: Event) => (window.klocki = new _Klocki()));
