import { _Klocki } from "../Klocki";
import { _Deque } from "../../util/Deque";

import { _Gui } from "./Gui";
import { _ChatLine } from "./ChatLine";

export class _GuiChatInput extends _Gui {
    public _fakeInput: HTMLInputElement | null;
    public _shown: boolean;
    public _fakeForm: HTMLFormElement | null;

    constructor(klocki: _Klocki) {
        super(klocki);
        this._fakeInput = null;
        this._fakeForm = null;
        this._shown = false;

    }

    public _requestKeyboard() {

        let fakeInput = this._fakeInput;
        if (fakeInput != null) {
            this._show();
            fakeInput.focus();
            fakeInput.click();

            return;
        }
        // let target = document.getElementsByTagName("input")[0];
        const fakeForm = document.createElement("form");
        this._fakeForm = fakeForm;
        fakeForm.addEventListener("submit", e => this._onSubmit(e));
        fakeForm.style.position = "absolute";
        fakeForm.style.left = "1%";
        fakeForm.style.bottom = "6px";
        fakeForm.style.width = "98%";
        fakeForm.style.height = "40px";
        fakeForm.style.display = "block";

        fakeInput = document.createElement("input");
        fakeInput.style.width = "100%";
        fakeInput.style.height = "100%";
        fakeInput.style.background = "rgba(0,0,0,0.5)";
        fakeInput.style.border = "0px solid black";
        fakeInput.style.font = "16px Arial Black";
        fakeInput.style.fontWeight = "bold";
        fakeInput.style.color = "white";
        fakeInput.addEventListener("focusout", e => this._onFocusOut(e));
        fakeForm.appendChild(fakeInput);

        document.body.appendChild(fakeForm);
        this._fakeInput = fakeInput;

        this._show();
        fakeInput.focus();
        fakeInput.click();
        
    }
    public _onSubmit(e: Event): void {
        e.preventDefault();
        this._hide();
        const fakeInput = this._fakeInput!;
        const message = fakeInput.value;
        fakeInput.value = "";

        this._klocki._sendChat(message);
        this._klocki._controls._lockOnNextEvent = true;

    }
    public _onFocusOut(e: FocusEvent) {
        this._hide();
    }
    public _show() {
        if (!this._shown) {
            this._shown = true;
            if (this._fakeInput != null) {
                this._fakeInput.style.visibility = "visible";
            }
        }
    }
    public _hide() {
        if (this._shown) {
            this._shown = false;
            if (this._fakeInput != null) {
                this._fakeInput.style.visibility = "hidden";
            }
        }
    }
    public _render(): void {
        // const fr = this._klocki._fontRenderer;
        
    }
    public _tick(): void {
        
    }

}
