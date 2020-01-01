import { mat4, vec3, vec4 } from "gl-matrix";
import { isString } from "util";
import { decode } from "@msgpack/msgpack";

import { _CPacketPositionAndLook } from "../network/play/client/CPacketPositionAndLook";
import { _Timer } from "../util/Timer";
import { _EnumConnectionState } from "../network/EnumConnectionState";
import { _Deque } from "../util/Deque";
import { _CPacketChatMessage } from "../network/play/client/CPacketChatMessage";
import { _CHandshake } from "../network/handshake/client/CHandshake";
import { _NetworkManager } from "../network/NetworkManager";
import { _CPacketLoginStart } from "../network/login/client/CPacketLoginStart";
import { _BlockRegistry } from "../block/BlockRegistry";
import { _Heap } from "../util/Heap";
import { _AudioManager } from "../audio/AudioManager";
import { _ModelRegistry } from "../block/model/ModelRegistry";
import { _NbtReader } from "../nbt/Nbt";
import { _PacketBuffer } from "../network/PacketBuffer";
import { _ItemRegistry } from "../item/ItemRegistry";
import { _Uint32BlockStorage } from "../world/chunk/storage/Uint32BlockStorage";

import { _Controls } from "./Controls";
import { _WorldRenderer } from "./renderer/WorldRenderer";
import { _NetHandlerLoginClient } from "./network/NetHandlerLoginClient";
import { _TextureManager } from "./txt/TextureManager";
import { _FontRenderer } from "./renderer/FontRenderer";
import { _ShaderUI } from "./shaders/ShaderUI";
import { _Display } from "./Display";
import { _GameSettings } from "./settings/GameSettings";
import { _ShaderWorld } from "./shaders/ShaderWorld";
import { _GuiChat } from "./gui/GuiChat";
import { _BakeTask } from "./world/BakeTask";
import { _WorldClient } from "./world/WorldClient";
import { _RenderList } from "./world/RenderList";
import { _Frustum } from "./world/Frustum";
import { _ShaderMobs } from "./shaders/ShaderMobs";
import { _LineRenderer } from "./world/LineRenderer";
import { _ShaderLines } from "./shaders/ShaderLines";
import { _OriginRenderOcTree } from "./world/OriginRenderOcTree";
import { _UIRenderer } from "./renderer/UIRenderer";
import { _EntityRenders } from "./render/EntityRenders";
import { _GuiOverlayEquipment } from "./gui/GuiOverlayEquipment";
import { _ChunkSection } from "./world/ChunkSection";
import { _KlockiEntityPlayerSP } from "./entity/KlockiEntityPlayerSP";
import { _KlockiEntityPlayer } from "./entity/KlockiEntityPlayer";
import { _KlockiEntityPlayerMP } from "./entity/KlockiEntityPlayerMP";

export class _Klocki {
    public static _utilVec3 = vec3.create();
    public static _utilVec4 = vec4.create();
    public static _forbiddenWord = "mine" + "craft";

    public _protocol: number = 498;
    public _assetsVersion: string = "1.14";
    public _assetURI: string = "";
    public _gameSettings: _GameSettings;
    public _display: _Display;
    public _theWorld: _WorldClient | null = null;
    public _scheduledTasks: _Deque<Function>;
    public _networkManager: _NetworkManager | null = null;
    public _textureManager!: _TextureManager;
    public _uiRenderer!: _UIRenderer;
    public _fontRenderer!: _FontRenderer;
    public _lineRenderer!: _LineRenderer;

    public _shaderUI!: _ShaderUI;
    public _shaderWorld!: _ShaderWorld;
    public _shaderMobs!: _ShaderMobs;
    public _shaderLines!: _ShaderLines;
    public _fpsDeque: _Deque<number>;
    public _guiChat!: _GuiChat;
    public _guiOverlayEquipment!: _GuiOverlayEquipment;
    public _renderList!: _RenderList;
    public _blockRegistry!: _BlockRegistry;
    public _itemRegistry!: _ItemRegistry;
    public _scheduledBakeTasks: _Deque<_BakeTask>;
    // public _scheduledBakeTasksSet: Set<_BakeTask>;
    // public _scheduledBakeTasks: _Heap<_BakeTask>;
    public _worldRenderer!: _WorldRenderer;
    public _worldRendererMobs!: _WorldRenderer;
    public _worldRendererMobsHelper!: _WorldRenderer;
    public _worldRendererBaker!: _WorldRenderer;
    
    public _mainVao!: WebGLVertexArrayObject;
    public _controls!: _Controls;
    public _joinedThisFrame: number;
    public _maxJoinsPerFrame: number;
    public _lastStartedJumping: boolean = false;
    public _flyToggleTimer: number = 0;
    public _startedJumping: boolean = false;
    public _lastJumping: boolean = false;
    public _jumping: boolean = false;
    public _personViewMode: number = 0;
    public readonly _timer: _Timer = new _Timer(20);
    public _frustum: _Frustum;
    public _audioManager!: _AudioManager;
    public _modelRegistry!: _ModelRegistry;
    public _blurTexture!: WebGLTexture;
    public _smoothCam: boolean;
    public _yawSmoothSpeed: number;
    public _pitchSmoothSpeed: number;
    public _zoomed: boolean;
    public _entityRenders!: _EntityRenders;
    public _reuseGlBuffers: WebGLBuffer[][];
    public _bakeSectionsByDistanceSquared: ((_OriginRenderOcTree | number)[] | null)[];
    public _sectionsByDistanceSquared: ((any | number)[] | null)[];
    public _glBuffersEntities!: WebGLBuffer[];
    public _glBuffersEntitiesIndex: number;
    public _glBuffersEntitiesCount: number;
    public _sectionLookingAt: _ChunkSection | null;
    public _reuseGlBuffersIndexRemover: number;
    public _reuseGlBuffersIndexAdder: number;
    public _assetsJson: any = null;
    public _soundsJson: any = null;
    // public _randomInts!: Uint32Array;
    public _renderX: number;
    public _renderY: number;
    public _renderZ: number;
    public _sectionsPerChunkDistance: number;
    public _debugInfo: boolean;
    public fov: number;
    public defaultArmThickness: number;
    public showUI: boolean;
    public _assetsJsons: any;
    public _targetBlock: number[] | null;
    public _made8Daudio: boolean = false;
    public _reducedMemory: boolean;
    public _clearColor: number[];
 
    private readonly _pako: any = require('../pako');

    private readonly _isGamePaused: boolean = false;

    constructor(domID: string, optionals: any) {
        const reduced: boolean = !!optionals.reducedMemory;
        this._clearColor = [0.6, 0.7, 1];
        if (optionals.clearColor) {
            this._clearColor = optionals.clearColor;
        }
        this._reducedMemory = reduced;
        this._gameSettings = new _GameSettings();
        this._gameSettings._loadOptions();
        this._display = new _Display(domID, optionals);
        this._fpsDeque = new _Deque<number>();
        this._scheduledTasks = new _Deque<Function>();
        this._frustum = new _Frustum();
        this._targetBlock = null;
        this.fov = 70;
        this.showUI = true;
        this.defaultArmThickness = 4;
        this._smoothCam = false;
        this._debugInfo = !reduced;
        this._yawSmoothSpeed = 0;
        this._pitchSmoothSpeed = 0;
        this._zoomed = false;
        this._glBuffersEntitiesIndex = 0;
        // very important for mobile
        this._glBuffersEntitiesCount = 2;
        this._sectionLookingAt = null;
        this._renderX = 0;
        this._renderY = 65;
        this._renderZ = 0;
        this._reuseGlBuffers = new Array<WebGLBuffer[]>(3);
        for (let i = 0; i < this._reuseGlBuffers.length; i++) {
            this._reuseGlBuffers[i] = [];
        }
        this._reuseGlBuffersIndexRemover = 1;
        this._reuseGlBuffersIndexAdder = 0;
        const _sectionsLen = Math.pow(reduced ? 10 : 48, 2);
        this._bakeSectionsByDistanceSquared = new Array(_sectionsLen);
        this._sectionsByDistanceSquared = new Array(_sectionsLen);
        this._sectionsPerChunkDistance = reduced ? 200 : 2000;

        const _sec = this._sectionsByDistanceSquared;
        const _bakeSec = this._bakeSectionsByDistanceSquared;
        for (let i = 0; i < _bakeSec.length; i++) {
            _bakeSec[i] = null;
            _sec[i] = null;
        }

        /*
        for (let i = 0; i < bakeSec.length; i++) {

            sec[i] = new Array(secsPerDistance + 1);
            sec[i][0] = 0;
        }
        */
        /*const compareBakes = (a: _BakeTask, b: _BakeTask): number => {
            const world = this._theWorld;
            if (world !== null) {
                const as = a._section;
                const bs = b._section;
                const ad = world._thePlayer!._distanceSquaredTo(as._posX * 16, as._posY * 16, as._posZ * 16);
                const bd = world._thePlayer!._distanceSquaredTo(bs._posX * 16, bs._posY * 16, bs._posZ * 16);

                return ad - bd;
            } else {
                return a._bakeId - b._bakeId;
            }
        };*/
        this._scheduledBakeTasks = new _Deque<_BakeTask>(); // (compareBakes);
        // this._scheduledBakeTasksSet = new Set<_BakeTask>();
        this._joinedThisFrame = 0;
        this._maxJoinsPerFrame = 3;
        
        (<any>window).vec4 = vec4;
        (<any>window).mat4 = mat4;
        (<any>window).kscope = function(s: string) {
            return eval(s);
        };

        // this._run();
    }

    public static _randomString(length: number) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;
    }
    public static _hashToPath(hash: string) {
        return "assets/objects/" + hash.substr(0, 2) + "/" + hash;
    }
    public static _yield(): Promise<void> {
        return new Promise(function(resolve, reject) {
            requestAnimationFrame(function() {
                resolve();
            });
        });
    }
    public static _sleep(ms: number): Promise<void> {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve();
            }, ms);
        });
    }
    public _getBakeSections(distanceSq: number) {
        const bakeSec = this._bakeSectionsByDistanceSquared;
        let sections = bakeSec[distanceSq];
        if (sections == null) {
            sections = bakeSec[distanceSq] = new Array(this._sectionsPerChunkDistance + 1);
            sections[0] = 0; // first element is amount of sections stored last render
        }

        return sections;
    }
    public _getRenderSections(distanceSq: number) {
        const sec = this._sectionsByDistanceSquared;
        let sections = sec[distanceSq];
        if (sections == null) {
            sections = sec[distanceSq] = new Array(this._sectionsPerChunkDistance + 1);
            sections[0] = 0;
        }

        return sections;
    }

    public _getPartialTicks() {
        return this._timer._renderPartialTicks;
    }
    public async run(): Promise<void> {
        await this._startGame();
    }
    public _nextFrame(): void {
        requestAnimationFrame((time: number) => this._currentFrame(time));
    }
    public _currentFrame(time: number): void {
        this._runGameLoop(time);
    }
    public _runTick(): void {

        this._guiChat._tick();

        this._yawSmoothSpeed *= 0.98;
        this._pitchSmoothSpeed *= 0.98;

        const world = this._theWorld;
        if (world != null) {
            const thePlayer = world._thePlayer!;
            this._lastStartedJumping = this._startedJumping;
            this._lastJumping = this._jumping;

            this._jumping = this._controls._pressed.get(' ') == true;
            this._startedJumping = this._jumping && !this._lastJumping;

            if (!this._lastStartedJumping && this._startedJumping) {
                if (this._flyToggleTimer == 0) {
                    this._flyToggleTimer = 7;
                } else {
                    thePlayer._isFlying = !thePlayer._isFlying;
                    this._flyToggleTimer = 0;
                }
            }
            if (this._flyToggleTimer > 0) {
                this._flyToggleTimer--;
            }

            thePlayer._movementForward = 0;
            thePlayer._movementStrafe = 0;

            if (this._controls._pressed.get('w')) {
                thePlayer._movementForward += 1;
            }
            if (this._controls._pressed.get('s')) {
                thePlayer._movementForward -= 1;
            }
            if (this._controls._pressed.get(' ')) {
                thePlayer._jumping = true;
            }

            if (this._controls._pressed.get('a')) {
                thePlayer._movementStrafe += 1;
            }
            if (this._controls._pressed.get('d')) {
                thePlayer._movementStrafe -= 1;
            }
            this._zoomed = this._controls._pressed.get('c') == true;
            
            thePlayer._setSprinting(this._controls._pressed.get('shift') == true);

            const sneak = this._controls._pressed.get('tab') === true;
            thePlayer._setSneaking(sneak);

            thePlayer._movementForward += thePlayer._touchMoveForward;
            thePlayer._movementStrafe += thePlayer._touchMoveStrafe;

            if (thePlayer._movementForward > 1) { thePlayer._movementForward = 1; }
            if (thePlayer._movementForward < -1) { thePlayer._movementForward = -1; }

            if (thePlayer._movementStrafe > 1) { thePlayer._movementStrafe = 1; }
            if (thePlayer._movementStrafe < -1) { thePlayer._movementStrafe = -1; }

            world._tick();

        }

    }
    public _schedule(f: Function): void {
        this._scheduledTasks._enqueue(f);
    }
    public _scheduleBaking(task: _BakeTask): void {
        this._scheduledBakeTasks._enqueue(task);
        // this._scheduledBakeTasksSet.add(task);
    }

    public _runGameLoop(time: number): void {
        if (this._isGamePaused && this._theWorld != null) {
            const f: number = this._timer._renderPartialTicks;
            this._timer._updateTimer(time);
            this._timer._renderPartialTicks = f;
        } else {
            this._timer._updateTimer(time);
        }
        while (this._scheduledTasks._size() !== 0) {
            const f: Function = this._scheduledTasks._dequeue();
            f();

        }
        const elapsed = this._timer._elapsedTicks;
        for (let j: number = 0; j < elapsed; j++) {
            this._runTick();
        }

        this._renderGame();
        // this._runheavyTasks();

        this._nextFrame();

        // window.setTimeout(() => {this._runheavyTasks()}, 0)
    }

    public _runheavyTasks(deadline: any) {
        
        (<any>window).requestIdleCallback((deadline: any) => {
            this._runheavyTasks(deadline);
        }, { timeout: 1000 });
        if (this._networkManager != null) {
            this._networkManager._idleCallback();
        }
        let baked = 0;
        const maxBakes = deadline.didTimeout ? 1 : 5;
        
        const secs = this._bakeSectionsByDistanceSquared;
        theBaking:
        if (1) {
            for (let secsIndex = 0; secsIndex < secs.length; ++secsIndex) {
                const sections = secs[secsIndex];
                if (sections != null) {
                    const count = sections[0];
                    if (count > 0) {
                        // _Klocki._log("baking", count, "sections at distanceSq", secsIndex)
                    }
                    for (let i = 1; i <= count; i++) {
                        const t = (<_OriginRenderOcTree>sections[i])._bakeTask;
                        if (t != null) {
                            if (!t._done) {
                                t._bake(this._worldRendererBaker);
                                baked++;
                                if (baked >= maxBakes) {
                                    break theBaking;
                                }
                                if (deadline.timeRemaining() == 0) {
                                    break theBaking;
                                }
                            }
                            
                        }
                    }
                }
            }
            
            while (baked < maxBakes && this._scheduledBakeTasks._size() > 0) {
                // const t: _BakeTask = this._scheduledBakeTasks._dequeue();
                const t: _BakeTask | undefined = this._scheduledBakeTasks._dequeue();

                // const t: _BakeTask | undefined = this._scheduledBakeTasksSet.
                // if(t){
                if (!t._done) {
                    t._bake(this._worldRendererBaker);
                    baked++;
                }
                if (deadline.timeRemaining() == 0) {
                    break;
                }
                // }
                
            }
        }
        
    }

    public send(msg: string): void {
        if (this._networkManager) {
            this._networkManager._sendPacket(new _CPacketChatMessage(msg));
        }
    }
    public _makeBlurTex() {
        // tODO maybe motion blur postprocessing
        
        // create to render to
        const targetTextureWidth = this._display._width;
        const targetTextureHeight = this._display._height;
        const gl = this._display._gl;

        gl.bindTexture(gl.TEXTURE_2D, this._blurTexture);
        
        {
                // define size and format of level 0
            const level = 0;
            const internalFormat = gl.RGBA;
            const border = 0;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            const data = null;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                          targetTextureWidth, targetTextureHeight, border,
                          format, type, data);
                
                // set the filtering so we don't need mips
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }
    public _scheduleDeleteBuffer(buf: WebGLBuffer) {
        this._reuseGlBuffers[this._reuseGlBuffersIndexAdder].push(buf);
    }

    public _renderGame(): void {
        const gl = this._display._gl;
        const toDelete = this._reuseGlBuffers[this._reuseGlBuffersIndexRemover];
        for (let i = 0; i < toDelete.length; i++) {
            gl.deleteBuffer(toDelete[i]);
            // _Klocki._log("deleteing");
        }
        this._reuseGlBuffers[this._reuseGlBuffersIndexRemover] = [];
        if (++this._reuseGlBuffersIndexRemover >= this._reuseGlBuffers.length) {
            this._reuseGlBuffersIndexRemover = 0;
        }
        if (++this._reuseGlBuffersIndexAdder >= this._reuseGlBuffers.length) {
            this._reuseGlBuffersIndexAdder = 0;
        }
        const bakeSecs = this._bakeSectionsByDistanceSquared;
        const secs = this._sectionsByDistanceSquared;
        for (let secsIndex = 0; secsIndex < secs.length; ++secsIndex) {
            const a = bakeSecs[secsIndex];
            if (a != null) {
                a[0] = 0;
            }
            const b = secs[secsIndex];
            if (b != null) {
                b[0] = 0;
            }
        }

        if (this._smoothCam || this._zoomed) {
            const world = this._theWorld;
            if (world) {
                const player = world._thePlayer!;
                const delta = this._timer._deltaTime;
                player._yaw += this._yawSmoothSpeed * delta;
                player._pitch += this._pitchSmoothSpeed * delta;
                player._fixPitch();
            }
        }

        this._textureManager._resetBoxBuf();
        const testMatrix = mat4.create();
        // mat4.translate(testMatrix, testMatrix, [Math.sin(Date.now() / 1000), Math.sin(Date.now() / 1300), Math.sin(Date.now() / 1500)]);
        // mat4.rotateY(testMatrix, testMatrix, Math.sin(Date.now() / 2300));
        this._textureManager._pushGroupMatrix(testMatrix);
        // this._textureManager._pushCubeParams(Math.sin(Date.now()/2000), Math.sin(Date.now()/2300), Math.sin(Date.now()/2500), 0, 0, 0, 0);

        this._lineRenderer._reset();
        const uir = this._uiRenderer;
        this._fontRenderer._reset();
        this._uiRenderer._reset();

        this._joinedThisFrame = 0;
        
        // this._makeBlurTex();
        
        // const attachmentPoint = gl.COLOR_ATTACHMENT0;
       // gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this._blurTexture, 0);
        const cc = this._clearColor;
        gl.clearColor(cc[0], cc[1], cc[2], this._display._translucent ? 0 : 1);
        gl.clearDepth(1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.frontFace(gl.CW);
        gl.depthFunc(gl.LEQUAL);

        this._display._bindVertexArray(this._mainVao);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = (this._zoomed ? 20 : this.fov) * Math.PI / 180;
        const aspect = this._display._width / this._display._height;
        const zNear = 0.05;
        const zFar = 1000;

        const projectionMatrix = mat4.create();

        mat4.perspective(projectionMatrix,
                         fieldOfView,
                         aspect,
                         zNear,
                         zFar);

        const modelViewMatrix = mat4.create();

        let debugBlock = "none";
        let debugBlock2 = "";
        let debugBlock3 = "";
        if (this._theWorld !== null && this._theWorld._thePlayer !== null) {
            const thePlayer = this._theWorld._thePlayer;
            if (this._personViewMode == 2) {
                mat4.rotate(modelViewMatrix, modelViewMatrix, -thePlayer._pitch, [1, 0, 0]);
            } else {
                mat4.rotate(modelViewMatrix, modelViewMatrix, thePlayer._pitch, [1, 0, 0]);
            }
            mat4.rotate(modelViewMatrix, modelViewMatrix, thePlayer._yaw + Math.PI, [0, 1, 0]);

            const rx = thePlayer._renderX(this._timer._renderPartialTicks);
            const ry = thePlayer._renderY(this._timer._renderPartialTicks) + 1.62;
            const rz = thePlayer._renderZ(this._timer._renderPartialTicks);

            this._renderX = rx;
            this._renderY = ry;
            this._renderZ = rz;

            const now = this._audioManager._audioCtx.currentTime;

            if (this._audioManager._listener.positionX) {
                this._audioManager._listener.positionX.setValueAtTime(rx, now);
                this._audioManager._listener.positionY.setValueAtTime(ry, now);
                this._audioManager._listener.positionZ.setValueAtTime(rz, now);
            } else {
                this._audioManager._listener.setPosition(rx, ry, rz);
            }
            const audioMatrix = mat4.create();
            mat4.invert(audioMatrix, modelViewMatrix);
            vec3.transformMat4(_Klocki._utilVec3, [0, 0, -1], audioMatrix);
            const viewx = _Klocki._utilVec3[0];
            const viewy = _Klocki._utilVec3[1];
            const viewz = _Klocki._utilVec3[2];
            vec3.transformMat4(_Klocki._utilVec3, [0, 1, 0], audioMatrix);
            const upx = _Klocki._utilVec3[0];
            const upy = _Klocki._utilVec3[1];
            const upz = _Klocki._utilVec3[2];
           
            if (this._audioManager._listener.forwardX) {
                this._audioManager._listener.forwardX.setValueAtTime(viewx, now);
                this._audioManager._listener.forwardY.setValueAtTime(viewy, now);
                this._audioManager._listener.forwardZ.setValueAtTime(viewz, now);

                this._audioManager._listener.upX.setValueAtTime(upx, now);
                this._audioManager._listener.upY.setValueAtTime(upy, now);
                this._audioManager._listener.upZ.setValueAtTime(upz, now);
            } else {
                this._audioManager._listener.setOrientation(viewx, viewy, viewz, upx, upy, upz);
            }
            if (this._personViewMode == 1) {
                mat4.translate(modelViewMatrix, modelViewMatrix, [viewx * 4, viewy * 4, viewz * 4]);
            }
            if (this._personViewMode == 2) {
                
                mat4.translate(modelViewMatrix, modelViewMatrix, [viewx * 4, viewy * 4, viewz * 4]);
                mat4.rotateY(modelViewMatrix, modelViewMatrix, Math.PI);
                
            }

            mat4.translate(modelViewMatrix, modelViewMatrix, [-rx, -ry, -rz]);

            const blockPos = this._theWorld._traceAnyBlock(10, new Float64Array([rx, ry, rz]), new Float64Array([viewx, viewy, viewz]));
            this._targetBlock = blockPos;
            if (blockPos != null) {
                
                debugBlock = blockPos[0] + " " + blockPos[1] + " " + blockPos[2];
                const section = this._theWorld._getSection(blockPos[0] >> 4, blockPos[1] >> 4, blockPos[2] >> 4);
                this._sectionLookingAt = section;
                if (section != null) {
                    if (section._debugInfo) {
                        debugBlock3 = section._debugInfo;
                    }
                    debugBlock3 += " " + this._theWorld._isUglyChunkLoaded(blockPos[0] >> 4, blockPos[2] >> 4);
                }
                const stateId = this._theWorld._getBlockType(blockPos[0], blockPos[1], blockPos[2]);
                const btype = stateId >> 4;
                const bdata = stateId & 15;
                // const bdm = this._blockRegistry._blocksByLegacyId[btype];
                const block = this._blockRegistry._byStateId(stateId);
                if (this._protocol >= 340) {
                    if (block) {
                        debugBlock2 = stateId + "=" + block._baseStateId + "+" + (stateId - block._baseStateId);
                    } else {
                        debugBlock2 = stateId + "=?";
                    }
                } else {
                    debugBlock2 = stateId + "=" + btype + ":" + bdata;
                }
                if (block) {
                    debugBlock2 += " " + block._name;
                }
                const delta = 0.001;
                const sx = blockPos[0] - delta;
                const sy = blockPos[1] - delta;
                const sz = blockPos[2] - delta;
                const s = 1 + 2 * delta;
                
                if (this.showUI) {
                    this._lineRenderer._drawOutline(sx, sy, sz, s, s, s, 0xFF000000);
                }
                
            }
        }

        mat4.multiply(projectionMatrix, projectionMatrix, modelViewMatrix);

        this._frustum._update(projectionMatrix);

        gl.useProgram(this._shaderWorld._program);
        gl.uniformMatrix4fv(
            this._shaderWorld._uniformLocations._projectionMatrix,
            false,
            projectionMatrix);
        this._shaderWorld._setScreenSize(1 * Math.min(this._display._width, this._display._height));
        this._shaderWorld._zeroOffset();
        this._renderList._renderAll(this._worldRenderer, this._shaderWorld);

        gl.useProgram(this._shaderMobs._program);
        gl.uniformMatrix4fv(
            this._shaderMobs._uniformLocations._projectionMatrix,
            false,
            projectionMatrix);
        gl.uniform1i(this._shaderMobs._uniformLocations._uSampler, 0);
        gl.uniform1i(this._shaderMobs._uniformLocations._uGroupinfoSampler, 1);

        if (this._theWorld !== null) {
            
            this._theWorld._renderEntities();

            this._textureManager._uploadGroupParamTex();
            this._worldRendererMobs._endAndUpload(this._shaderMobs, this._glBuffersEntities[this._glBuffersEntitiesIndex]);

            // this._worldRendererMobs._endAndUploadSetSize(this._shaderMobs, buf, true);

            if (++this._glBuffersEntitiesIndex >= this._glBuffersEntitiesCount) {
                this._glBuffersEntitiesIndex = 0;
            }
        }

        gl.useProgram(this._shaderLines._program);
        gl.uniformMatrix4fv(
            this._shaderLines._uniformLocations._projectionMatrix,
            false,
            projectionMatrix);
        // gl.lineWidth(1);
        this._lineRenderer._endAndUpload(this._shaderLines);

        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.useProgram(this._shaderUI._program);

        const uiMatrix = mat4.create();
        mat4.ortho(uiMatrix, 0, this._display._width << 1, this._display._height << 1, 0, -100, 100);
        gl.uniformMatrix4fv(this._shaderUI._uniformLocations._uiMatrix, false, uiMatrix);
        
        if (this._theWorld == null) {
            const sc = 2; // / 8;
            const cx = this._display._width / 2;
            const cy = this._display._height / 2;
            
            const size = Math.min(cx, cy);

            uir._pos(sc * (cx - size), sc * (cy - size), 0)._tex(0, 0)._color(0xFFFFFFFF)._endVertex();
            uir._pos(sc * (cx + size), sc * (cy - size), 0)._tex(1, 0)._color(0xFFFFFFFF)._endVertex();
            uir._pos(sc * (cx - size), sc * (cy + size), 0)._tex(0, 1)._color(0xFFFFFFFF)._endVertex();

            uir._pos(sc * (cx + size), sc * (cy + size), 0)._tex(1, 1)._color(0xFFFFFFFF)._endVertex();
            // uir._pos(sc * (cx + size), sc * (cx - size), 0)._tex(1, 0)._color(0xFFFFFFFF)._endVertex();
            // uir._pos(sc * (cx - size), sc * (cx + size), 0)._tex(0, 1)._color(0xFFFFFFFF)._endVertex();
        }

        this._calcFps();
        const fr = this._fontRenderer;
       
        if (this._debugInfo) {
            fr._drawString("\xa7a" + this._fpsDeque._size() + "fps", 1, 1, 0xFFFFFFFF, true);
            // fr._drawString("\xa7a" + this._mmpsDeque.length + "mmps", 1, 11, 0xffffffff, true)
            // fr._drawString("\xa7a" + lastFrameTime + "ms", 1, 21, 0xffffffff, true)
    
            // fr._drawString("\xa7a" + this._controls._lastOrientA+" "+this._controls._lastOrientG, 1, 11, 0xffffffff, true)
            if (this._theWorld) {
                const thePlayer = this._theWorld._thePlayer!;
                fr._drawString("\xa7eYaw:  " + Math.round((thePlayer._yaw * (180 / Math.PI)) * 10) / 10, 1, 11, 0xFFFFFFFF, true);
                fr._drawString("\xa7ePitch:" + Math.round((thePlayer._pitch * (180 / Math.PI)) * 10) / 10, 1, 21, 0xFFFFFFFF, true);
                fr._drawString("\xa7eX:" + Math.round(thePlayer._posX * 10) / 10, 1, 31, 0xFFFFFFFF, true);
                fr._drawString("\xa7eY:" + Math.round(thePlayer._posY * 10) / 10, 1, 41, 0xFFFFFFFF, true);
                fr._drawString("\xa7eZ:" + Math.round(thePlayer._posZ * 10) / 10, 1, 51, 0xFFFFFFFF, true);
                fr._drawString("\xa7eVRAM:" + Math.round((_OriginRenderOcTree._usedVideoMemory / (1024 * 1024)) * 10) / 10, 1, 61, 0xFFFFFFFF, true);
                // fr._
                fr._drawStringRight("\xa7eBlock:" + debugBlock, this._display._guiWidth-1, 1, 0xFFFFFFFF, true);
                fr._drawStringRight("\xa7e" + debugBlock2, this._display._guiWidth-1 , 11, 0xFFFFFFFF, true);
                fr._drawStringRight("\xa7e" + debugBlock3, this._display._guiWidth-1, 21, 0xFFFFFFFF, true);
                fr._drawStringRight("\xa7echunks: " + this._theWorld._loadedUglyLimitedHeightChunks.size, this._display._guiWidth-1, 41, 0xFFFFFFFF, true);
                
            }
        }
        if (this.showUI) {
            this._guiChat._render();
            this._guiOverlayEquipment._render();
        }

        uir._endAndUpload(this._shaderUI);

        gl.flush();
    }

    public _calcFps() {
        const now = Date.now(); // this._timer._lastSyncSysClock;
        const nowLater = now + 1000;
        const nowBefore = now - 1000;
        while (this._fpsDeque._size() > 0) {
            const el = this._fpsDeque._peek(-1);
            if (el > nowBefore && el < nowLater) {
                break;
            }
            this._fpsDeque._dequeue();
        }
        this._fpsDeque._enqueue(now);
    }

    public _canJoinNextRegion() {
        return this._joinedThisFrame++ < this._maxJoinsPerFrame;
    }
    public _cyclePersonView() {
        this._personViewMode++;
        if (this._personViewMode > 2) {
            this._personViewMode = 0;
        }
    }
    public _toggleSmoothCam() {
        this._smoothCam = !this._smoothCam;
    }
    public _toggleDebugInfo() {
        this._debugInfo = !this._debugInfo;
    }
    public _toggleUI() {
        this.showUI = !this.showUI;
    }
    public async _startGameSecond(): Promise<void> {

        this._entityRenders = new _EntityRenders(this);

        this._audioManager = new _AudioManager(this);

        await _Klocki._yield();
        this._renderList = new _RenderList(this, 4, 1, 4);
        await _Klocki._yield();

        // const track = this._audioManager._audioCtx.createMediaElementSource(audio);
        // track.connect(panner._panner).connect(this._audioManager._audioCtx.destination);

        this._guiChat = new _GuiChat(this);
        this._guiOverlayEquipment = new _GuiOverlayEquipment(this);

        const gl = this._display._gl;
        
        this._mainVao = this._display._createVertexArray()!;
        
        this._glBuffersEntities = new Array(this._glBuffersEntitiesCount);
        for (let i = 0; i < this._glBuffersEntities.length; i++) {
            const buf = this._display._gl.createBuffer()!;
            this._glBuffersEntities[i] = buf;
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, 1024 * 1024 * (this._reducedMemory ? 2 : 16), gl.DYNAMIC_DRAW);
        }
        // blur texture postprocess here?
        // this._blurTexture = gl.createTexture()!;
        // this._makeBlurTex();
        // const fb = gl.createFramebuffer();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        /*
        
        make8DaudioXD();
        */
        /*
        const ri = this._randomInts = new Uint32Array(1024 * 16);
        const range = Math.pow(2, 21);
        for (let i = 0; i < ri.length; ++i) {
            ri[i] = Math.floor(Math.random() * range);
        }
        */

        (<any>window).requestIdleCallback((deadline: any) => { this._runheavyTasks(deadline); }, { timeout: 500 });
        // this.myNetworkManager._sendPacket();
        this._nextFrame();
    }

    public _makeAudio8D(x: number, y: number, z: number) {
        const audioCtx = this._audioManager._audioCtx;
        const source = audioCtx.createBufferSource();

        const request = new Request(this._assetURI + 'kuku.webm');

        const panner = this._audioManager._newPanner();
        panner._setPosition(x, y, z);

        fetch(request).then(function (response) {
            return response.arrayBuffer();
        }).then(function (buffer) {
            audioCtx.decodeAudioData(buffer, function (decodedData: AudioBuffer) {
                source.buffer = decodedData;
                const gainer = audioCtx.createGain();
                gainer.gain.value = 0.5;
                source.connect(panner._panner).connect(gainer).connect(audioCtx.destination);
                
                const startTime = audioCtx.currentTime;
                source.start(startTime, 0);
                
            });
        });
        
    }

    public connectSocket(protoVersion: number, wsUrl: string) {
        this._protocol = protoVersion;
        if (!this._networkManager) {
            const nm = this._networkManager = new _NetworkManager(this, wsUrl);
            nm._createdPromise.then(() => {
                nm._packetListener = new _NetHandlerLoginClient(this);
                nm._sendPacket(new _CHandshake(this._protocol, "klocki.pl", 25565, _EnumConnectionState._Login));
                nm._sendPacket(new _CPacketLoginStart("Klocek_" + (this._controls._isMobile ? "m_" : "") + _Klocki._randomString(6)));
            });

        }
    }

    public offlineJoinGame(): void {
        const world = new _WorldClient(this, null);
        this._theWorld = world;
        const thePlayer = new _KlockiEntityPlayerSP(this);
        thePlayer._eid = 0;
        thePlayer._gameMode = 1;
        thePlayer._isFlying = true;
        world._thePlayer = thePlayer;
        world._addEntity(thePlayer);

    }
    public offlineSpawnPlayer(eid: number, x: number, y: number, z: number, yaw: number, pitch: number) {
        const world = this._theWorld;
        if (world != null) {
            const player = new _KlockiEntityPlayerMP(this);
            player._eid = eid;
            player._serverPosX = x;
            player._serverPosY = y;
            player._serverPosZ = z;

            player._serverYaw = yaw;
            player._serverPitch = pitch;

            player._yaw = yaw;
            player._pitch = pitch;

            player._prevYaw = yaw;
            player._prevPitch = pitch;

            player._posX = x;
            player._posY = y;
            player._posZ = z;

            player._lastTickPosX = x;
            player._lastTickPosY = y;
            player._lastTickPosZ = z;

            player._prevPosX = x;
            player._prevPosY = y;
            player._prevPosZ = z;

            world._addEntity(player);
        }
    }

    public offlineTeleportEntity(eid: number, x: number, y: number, z: number, yaw: number, pitch: number) {
        const world = this._theWorld;
        if (world != null) {
            const entity = world._getEntity(eid);
            if (entity) {
                entity._serverPosX = x;
                entity._serverPosY = y;
                entity._serverPosZ = z;

                entity._serverYaw = yaw;
                entity._serverPitch = pitch;

                entity._setNewLocation(entity._serverPosX, entity._serverPosY, entity._serverPosZ, entity._serverYaw, entity._serverPitch, 3, false);
            }
        }
    }

    public offlineTeleport(x: number, y: number, z: number, yaw: number, pitch: number): void {
        if (this._theWorld === null) {
            return;
        }
        const thePlayer: _KlockiEntityPlayer = this._theWorld._thePlayer!;
        thePlayer._posX = x;
        thePlayer._posY = y;
        thePlayer._posZ = z;
        thePlayer._yaw = yaw;
        thePlayer._pitch = pitch;
    }
    public stateIdByName(name: string) {
        const block = this._blockRegistry._byName(name);
        if (block) {
            return block._baseStateId;
        }

        return 0;
    }

    public offlineSetBlock(bx: number, by: number, bz: number, typ: number) {
        const world = this._theWorld;
        if (world != null) {
            const x = bx >> 4;
            const y = by >> 4;
            const z = bz >> 4;
            let w = world._getSectionWatcher(x, y, z);
            // _Klocki._log("block change", bx,by,bz,packet._blockID!);
            let section = w._section;
            if (!w._section) {
                section = new _ChunkSection(x, y, z, new _Uint32BlockStorage(y, false, new Uint32Array(4096)));
                w._setSection(section);
            }
            if (section) {
                const sx = bx & 15;
                const sy = by & 15;
                const sz = bz & 15;
                section._setBlockType(sx, sy, sz, typ);
                w._notify();

                if (sx == 15) {
                    w = world._getSectionWatcher(x + 1, y, z);
                    w._notify();
                }
                if (sz == 15) {
                    w = world._getSectionWatcher(x, y, z + 1);
                    w._notify();
                }
                if (sy == 15) {
                    w = world._getSectionWatcher(x, y + 1, z);
                    w._notify();
                }
                if (sx == 0) {
                    w = world._getSectionWatcher(x - 1, y, z);
                    w._notify();
                }
                if (sz == 0) {
                    w = world._getSectionWatcher(x, y, z - 1);
                    w._notify();
                }
                if (sy == 0) {
                    w = world._getSectionWatcher(x, y - 1, z);
                    w._notify();
                }
            }
        }
    }
    public _getAssetJSON(assetPath: string) {
        return this._assetsJsons[assetPath];
    }

    public setAssetURI(uri: string) {
        this._assetURI = uri;
    }

    public _onClick() {
        if (this._theWorld != null) {
            const blockPos = this._targetBlock;
            if (blockPos != null) {
                const stateId = this._theWorld._getBlockType(blockPos[0], blockPos[1], blockPos[2]);
                const block = this._blockRegistry._byStateId(stateId);
                if (block == this._blockRegistry._helper._JUKEBOX) {
                    if (!this._made8Daudio) {
                        this._made8Daudio = true;
                        this._makeAudio8D(blockPos[0], blockPos[1], blockPos[2]);
                    }
                }
            }
        }
    }

    private async _startGame(): Promise<void> {

        this._controls = new _Controls(this);

        this._shaderUI = new _ShaderUI(this);
        this._shaderWorld = new _ShaderWorld(this);
        this._shaderMobs = new _ShaderMobs(this);
        this._shaderLines = new _ShaderLines(this);

        this._textureManager = new _TextureManager(this);
        this._uiRenderer = new _UIRenderer(this);
        this._fontRenderer = new _FontRenderer(this);
        this._worldRenderer = new _WorldRenderer(this, (this._reducedMemory ? 1 / 8 : 1) * 1024 * 1024, false, false);
        this._lineRenderer = new _LineRenderer(this);
        this._worldRendererBaker = new _WorldRenderer(this, (this._reducedMemory ? 1 / 8 : 4) * 1024 * 1024, false, false);
        this._worldRendererMobs = new _WorldRenderer(this, (this._reducedMemory ? 1 : 4) * 1024 * 1024, false, true);
        this._worldRendererMobsHelper = new _WorldRenderer(this, (this._reducedMemory ? 1 / 64 : 0.5) * 1024 * 1024, false, true);

        this._modelRegistry = new _ModelRegistry(this);
        this._blockRegistry = new _BlockRegistry(this._textureManager, this._modelRegistry);
        this._itemRegistry = new _ItemRegistry(this);

        await this._fetchAndLoadBlocks();
        this._fetchAssetsIndex();
        await _Klocki._yield();
        await this._startGameSecond();

    }
    private async _fetchAndLoadBlocks() {
        await this._fetchAssetsJsons();
        await _Klocki._yield();
        this._blockRegistry._registerBlocks(this._protocol);
        this._blockRegistry._makeGlobalPalette(this._protocol >= 107);
        this._itemRegistry._registerItems();
    }

    private _fetchAssetsIndex() {
        fetch(this._assetURI + "assets/indexes/" + this._assetsVersion + ".json").then(response => {
            return response.json();
        }).then(assetsJson => {
            this._assetsJson = assetsJson;
            if (!this._assetsJson.objects) {
                throw new Error("no objects found in assets index file");
            }

            const soundsFileHash = this._assetsJson.objects[_Klocki._forbiddenWord + "/sounds.json"].hash;
            if (!isString(soundsFileHash)) {
                throw new Error("soundsFileHash is not a string");
            }
            const soundsFilePath = _Klocki._hashToPath(soundsFileHash);

            fetch(this._assetURI + soundsFilePath).then(response => {
                return response.json();
            }).then(soundsJson => {
                this._soundsJson = soundsJson;
            });
        });
    }

    private async _fetchAssetsJsons() {
        const jsonsName = "assets/jsons.msgpack.zlib";
        const response = await fetch(this._assetURI + jsonsName);
        if (!response.ok) { return null; }
        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer == null) {
            console.warn("no " + jsonsName + " found");
        } else {
            
            try {
                // yield because inflate takes a long time and yield works after 2 frames...
                await _Klocki._yield();
                const inflated: any = this._pako.inflate(arrayBuffer);
                await _Klocki._yield();
                if (inflated instanceof Uint8Array) {
                    this._receiveAssetsJsons(inflated);

                    return inflated;
                } else {
                    throw new Error(`Inflate error: ${inflated}`);
                }
            } catch (e) {
                console.warn("can't decompress msgpack: ", e);
            }
        }

        return null;
    }
    private _receiveAssetsJsons(msgpacked: Uint8Array) {
        this._assetsJsons = <any>decode(msgpacked);
        // _Klocki._log("msgpacked:", this._assetsJsons);
    }
    public static _log(...args: any[]) {
        console.log("[Klocki]", ...args);
    }

}
