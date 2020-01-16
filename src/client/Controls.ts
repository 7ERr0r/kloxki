import { isNumber } from "util";

import { _Klocki } from "./Klocki";
import { _KlockiEntityPlayerSP } from "./entity/KlockiEntityPlayerSP";

class _SimpleTouch {
    public _identifier: number;
    public _pageX: number;
    public _pageY: number;
    public _isMovement: boolean;
    public _timeStart: number;
    public _jumper: boolean;
    public _isChat: boolean;
    constructor(id: number, pageX: number, pageY: number) {
        this._identifier = id;
        this._pageX = pageX;
        this._pageY = pageY;
        this._isMovement = false;
        this._timeStart = -1;
        this._jumper = false;
        this._isChat = false;
    }
}

export class _Controls {
    public _pressed: Map<string, boolean>;
    public _klocki: _Klocki;
    public _mouseLocked: boolean;
    public _mouseMoves: number;
    public _ongoingTouches: _SimpleTouch[];

    public _lastOrientA: number = 1337;
    public _lastOrientB: number = 1337;
    public _lastOrientG: number = 1337;

    public _registededTouches: boolean;
    public _lastMovementTouchEnd: number;
    public _lockOnNextEvent: boolean;

    constructor(klocki: _Klocki) {
        this._klocki = klocki;
        this._pressed = new Map<string, boolean>();
        this._mouseLocked = false;
        this._registededTouches = false;
        this._lockOnNextEvent = false;
        this._mouseMoves = 0;
        this._ongoingTouches = new Array<_SimpleTouch>();
        this._lastMovementTouchEnd = 0;

        document.addEventListener("mouseup",  (e) => {
            if (this._mouseLocked) {
                e.preventDefault(); // disable mouse back and forward buttons
            }
        });
        document.addEventListener("mousedown",  (e) => {
            if (this._mouseLocked) {
                this._klocki._onClick();
            }
        });

        document.addEventListener("keydown", (e) => this._keydown(e));
        document.addEventListener("keyup", (e) => this._keyup(e));

        document.addEventListener('pointerlockchange', (e) => this._onLockChange(e), false);
        document.addEventListener('mozpointerlockchange', (e) => this._onLockChange(e), false);
        const canvas = this._klocki._display._canvas;
        canvas.addEventListener("click", () => {
            if (!this._mouseLocked) {
                this._requestLock();
                // this._klocki._display._canvas.requestFullscreen();

            }
            if (!this._registededTouches) {
                this._addTouchHandlers();
            }
        });
        
        canvas.addEventListener("mousemove", (e) => {
            
            if (this._mouseLocked) {
                // const locked = this._isLocked();
                const locked = true;
                if (locked) {
                    const klocki = this._klocki;
                    const world = klocki._theWorld;
                    if (world !== null) {
                        const thePlayer = world._thePlayer!;
                        // _Klocki._log(e.movementX, e.movementY, e.clientX, e.clientY, locked);
                        const dyaw = e.movementX / 400;
                        const dpitch = e.movementY / 400;
                        if (klocki._smoothCam || klocki._zoomed) {
                            klocki._yawSmoothSpeed += dyaw;
                            klocki._pitchSmoothSpeed += dpitch;
                        } else {

                            thePlayer._yaw += dyaw;
                            thePlayer._pitch += dpitch;

                            thePlayer._prevYaw += dyaw;
                            thePlayer._prevPitch += dpitch;
                        }
                        thePlayer._fixPitch();
                        this._mouseMoves++;
                    }
                }
            } else {
                if (this._lockOnNextEvent) {
                    this._onLockNextEventFulfilled();
                }
            }
        }, false);

        window.addEventListener("wheel", (e) => {
            if (this._mouseLocked) {
                e.preventDefault();
                e.stopPropagation();
                
                const klocki = this._klocki;
                const world = klocki._theWorld;
                if (world !== null) {
                    const thePlayer = world._thePlayer!;
                    const wheelEvent = e;
                    let delta = wheelEvent.deltaY;
                    if (wheelEvent.deltaMode == 0) {
                        delta /= 100;
                    }
                    thePlayer._scroll(delta);
                }
            } else {
                if (this._lockOnNextEvent) {
                    this._onLockNextEventFulfilled();
                }
            }
        }, false);

        window.addEventListener('beforeunload', (e) => {
            if (this._mouseLocked) {
                e.preventDefault();
                e.returnValue = "Do you really want to leave?";
                this._klocki._guiChat._appendMessage({ text: "Press F11 to prevent CTRL+W", color: "green" });
                this._unpressAll();

                return "Do you really want to leave?";
                
            } else {
                return void 0;
            }
        });

    }
    public static _copyTouch(touch: Touch) {
        return new _SimpleTouch(touch.identifier, touch.pageX, touch.pageY);
    }

    public _unpressAll() {
        this._pressed = new Map<string, boolean>();
    }

    public _onLockNextEventFulfilled() {
        this._lockOnNextEvent = false;
        this._requestLock();
    }

    public _requestLock() {
        const canvas = this._klocki._display._canvas;
        canvas.requestPointerLock = canvas.requestPointerLock ||
                    (<any>canvas).mozRequestPointerLock;

        canvas.requestPointerLock();
    }

    public _exitLock() {
        this._mouseLocked = false;
        document.exitPointerLock = document.exitPointerLock ||
            (<any>document).mozExitPointerLock;
        document.exitPointerLock();
    }

    public _isLocked() {
        return document.pointerLockElement === this._klocki._display._canvas || (<any>document).mozPointerLockElement === this._klocki._display._canvas;
    }
    public _onLockChange(e: Event) {
        if (this._isLocked()) {
            this._mouseLocked = true;
        } else {
            this._mouseLocked = false;
        }
    }
    public _keydown(e: KeyboardEvent) {
        const key = e.key.toLowerCase();

        // preventions
        if (this._mouseLocked) {
            if (e.ctrlKey || e.key == ' ' || e.key === "F1" || e.key === "F3" || e.key === "F5" || e.key === "F8" || e.key == "Tab" || e.key == "Control" || e.key == "Shift") {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        let inGame = this._mouseLocked;
        // going back to game
        if (!this._mouseLocked) {
            if (this._lockOnNextEvent) {
                if (key == 't') {
                    this._lockOnNextEvent = false;
                    inGame = true; // handle only current chat open key
                } else {
                    if (e.key != 'Escape') {
                        this._onLockNextEventFulfilled();
                    }
                }
            }
        }

        if (e.ctrlKey && (key == 'w' || key == 's')) {
            e.preventDefault();
            e.stopPropagation();
        }

        const was = this._pressed.get(key);
        this._pressed.set(key, true);
        // _Klocki._log("pressed", e.key)
        if (was) {
            return;
        }
        if (inGame) {
            if (key == 'f1') {
                this._klocki._toggleUI();
            }
            if (key == 'f3') {
                this._klocki._toggleDebugInfo();
            }
            if (key == 'f5') {
                this._klocki._cyclePersonView();
            }
            if (key == 'f8') {
                this._klocki._toggleSmoothCam();
            }
            if (key == 't') {
                this._klocki._toggleChatInput();
                e.preventDefault();
                e.stopPropagation();
            }
    
            if (key == 'c') {
                this._klocki._yawSmoothSpeed = 0;
                this._klocki._pitchSmoothSpeed = 0;
            }
            if (key == 'a' && this._pressed.get('f3')) {
                const world = this._klocki._theWorld;
                if (world) {
                    world._sections.forEach((v, k) => {
                        v._notify();
                    });
                }
            }
        } else {
            if (key == 'escape') {
                this._klocki._hideChatInput();
            }
        }
        
        return true;
    }
    public _keyup(e: KeyboardEvent) {
        const key = e.key.toLowerCase();
        this._pressed.set(key, false);
        // _Klocki._log("unpressed", key)

    }
    public isPressed(key: string) {
        return this._pressed.get(key) === true;
    }

    public _handleTouchEnd(evt: TouchEvent) {

        evt.preventDefault();
        const touches = evt.changedTouches;

        let thePlayer: _KlockiEntityPlayerSP | null = null;
        if (this._klocki._theWorld) {
            thePlayer = this._klocki._theWorld._thePlayer;
        }
        for (let i = 0; i < touches.length; i++) {
            const idx = this._ongoingTouchIndexById(touches[i].identifier);

            if (idx >= 0) {
                const touch = this._ongoingTouches[idx];
                const now = Date.now();
                const diff = now - touch._timeStart;
                if (thePlayer && touch._isMovement) {
                    thePlayer._touchMoveForward = 0;
                    thePlayer._touchMoveStrafe = 0;
                    
                }
                if (thePlayer && diff < 200) {
                    if (touch._jumper) {
                        thePlayer._isFlying = !thePlayer._isFlying;
                    }
                    if (touch._isChat) {
                        this._klocki._guiChat._appendMessage({ text: "touch chat" });
                        this._klocki._toggleChatInput();
                        
                    }

                    thePlayer._jumping = true;
                    
                    this._lastMovementTouchEnd = now;
                    
                }
                this._ongoingTouches.splice(idx, 1);
            } else {
                // _Klocki._log("can't figure out which touch to end");
            }
        }
    }
    public _ongoingTouchIndexById(idToFind: number) {
        for (let i = 0; i < this._ongoingTouches.length; i++) {
            const id = this._ongoingTouches[i]._identifier;
            if (id == idToFind) {
                return i;
            }
        }

        return -1;
    }
    public _handleTouchMove(evt: TouchEvent) {

        evt.preventDefault();
        // _Klocki._log("touch move");
        const touches = evt.changedTouches;

        let thePlayer: _KlockiEntityPlayerSP | null = null;
        if (this._klocki._theWorld) {
            thePlayer = this._klocki._theWorld._thePlayer;
        }
        for (let i = 0; i < touches.length; i++) {
            const idx = this._ongoingTouchIndexById(touches[i].identifier);

            if (idx >= 0) {
                const touch = _Controls._copyTouch(touches[i]);
                const dx = touch._pageX - this._ongoingTouches[idx]._pageX;
                const dy = touch._pageY - this._ongoingTouches[idx]._pageY;

                touch._isMovement = this._ongoingTouches[idx]._isMovement;
                touch._timeStart = this._ongoingTouches[idx]._timeStart;
                if (thePlayer) {
                    if (touch._isMovement) {
                        let rx = touch._pageX / window.innerWidth;
                        let ry = touch._pageY / window.innerHeight;

                        rx -= 0.18;
                        ry -= 0.7;

                        rx *= 20;
                        ry *= 10;

                        thePlayer._touchMoveForward = -ry;
                        thePlayer._touchMoveStrafe = -rx;
                    } else {
                        thePlayer._yaw += dx / 95;
                        thePlayer._pitch += dy / 95;
                        thePlayer._fixPitch();
                    }
                }

                this._ongoingTouches.splice(idx, 1, touch);

            } else {
                // _Klocki._log("can't figure out which touch to continue");
            }
        }
    }
    public _handleTouchStart(evt: TouchEvent) {

        evt.preventDefault();
        const touches = evt.changedTouches;
        // _Klocki._log("touch start");
        // this._klocki._display._canvas.requestFullscreen();

        for (let i = 0; i < touches.length; i++) {
            const touch = _Controls._copyTouch(touches[i]);
            const rx = touch._pageX / window.innerWidth;
            const ry = touch._pageY / window.innerHeight;

            touch._isChat = rx < 0.15 && ry > 0.85;
            
            touch._isMovement = rx < 0.3 && ry > 0.5;
            touch._timeStart = Date.now();
            // touch._jumper = false;

            if (Math.abs(touch._timeStart - this._lastMovementTouchEnd) < 300) {
                let thePlayer: _KlockiEntityPlayerSP | null = null;
                if (this._klocki._theWorld) {
                    thePlayer = this._klocki._theWorld._thePlayer;
                    if (thePlayer != null) {
                        touch._jumper = true;
                        
                    }
                }
                
            }
            this._ongoingTouches.push(touch);
        }
    }
    public _handleTouchCancel(evt: TouchEvent) {

        evt.preventDefault();
        const touches = evt.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const idx = this._ongoingTouchIndexById(touches[i].identifier);
            this._ongoingTouches.splice(idx, 1);
        }
    }
    public _handleOrientation(evt: DeviceOrientationEvent) {
        if (!isNumber(evt.alpha)) {
            return;
        }
        
        let thePlayer: _KlockiEntityPlayerSP | null = null;
        if (this._klocki._theWorld) {
            thePlayer = this._klocki._theWorld._thePlayer;
        }

        // _Klocki._log("orient")
        if (thePlayer) {
            if (evt.absolute) {
                thePlayer._yaw += (evt.alpha / 180) * Math.PI;
                thePlayer._pitch += (evt.gamma! / 180) * Math.PI;
            } else {
                const [alpha, beta, gamma] = this._screenTransformed(evt.alpha, evt.beta!, evt.gamma!);
                if (this._lastOrientA == 1337) {
                    
                } else {
                    
                    let da = alpha - this._lastOrientA;
                    // const db = evt.beta!-this._lastOrientB;
                    let dg = gamma - this._lastOrientG;

                    if (dg > 90) {
                        dg -= 180;
                    }
                    if (dg < -90) {
                        dg += 180;
                    }
                    if (da > 90 && da < 270) {
                        da -= 180;
                    }
                    if (da < -90 && da > -270) {
                        da += 180;
                    }
                    thePlayer._yaw -= (da / 180) * Math.PI;

                    thePlayer._pitch += (dg / 180) * Math.PI;
                }
                this._lastOrientA = alpha;
                this._lastOrientB = beta;
                this._lastOrientG = gamma;
                
            }
        }
    }
    public _addTouchHandlers() {
        // _Klocki._log("registering touches");
        const canvas = this._klocki._display._canvas;
        if (!this._registededTouches) {
            this._registededTouches = true;
            canvas.addEventListener("touchstart", (e: TouchEvent) => this._handleTouchStart(e), false);
            canvas.addEventListener("touchend", (e: TouchEvent) => this._handleTouchEnd(e), false);
            canvas.addEventListener("touchcancel", (e: TouchEvent) => this._handleTouchCancel(e), false);
            canvas.addEventListener("touchmove", (e: TouchEvent) => this._handleTouchMove(e), false);

            window.addEventListener("deviceorientation", (e: DeviceOrientationEvent) => this._handleOrientation(e));
        }
    }
    public _screenTransformed(alpha: number, beta: number, gamma: number): number[] {
        const orientation = (screen.orientation || {}).type;

        if (orientation === "landscape-primary") {
            return [alpha, beta, gamma];
        } else if (orientation === "landscape-secondary") {
            // console.log("Mmmh... the screen is upside down!");
            return [alpha, beta, -gamma];
        } else if (orientation === "portrait-primary") {
            return [0, 0, 0];
        } else if (orientation === "portrait-secondary") {
            // console.log("Mmmh... you should rotate your device to landscape");
            return [0, 0, 0];
        } else if (orientation === undefined) {
            // console.log("The orientation API isn't supported in this browser :(");
            
        }

        return [alpha, beta, gamma];

    }

}
