import { Geometry, Renderer, Camera, Raycaster, Projector, Light, Fog, Scene, Coloring, FrontSide, Material, MeshDoubleLambertMaterial } from "./WebGL";
import { Vector3, Matrix4, Matrix3, Quaternion, XYZ } from "./WebGL/math";
import { MeshLambertMaterial, Object3D, Mesh, LineBasicMaterial, Line } from "./WebGL";
import { elementColors, CC, ColorSpec, ColorschemeSpec } from "./colors";
import { extend, getExtent, makeFunction, getPropertyRange, isEmptyObject, adjustVolumeStyle, mergeGeos, PausableTimer, getColorFromStyle, getElement } from "./utilities";
import { getGradient, Gradient } from "./Gradient";
import { AtomStyleSpec, Model3D, LineStyleSpec } from "./Model3D";
import { Label, LabelSpec } from "./Label";
import { ArrowSpec, BoxSpec, CurveSpec, CustomShapeSpec, CylinderSpec, Shape3D, IsoSurfaceSpec, LineSpec, ShapeSpec, SphereSpec, splitMesh } from "./Shape3D";
import { VolumeRender } from "./VolumeRender";
import { Surface3D, SurfaceType, syncSurface } from "./Surface3D4";
import { GLVolumetricRender, VolumetricRendererSpec } from "./VolumetricRender";
import { AtomSelectionSpec, AtomSpec } from "./specs";
import { decode, toRGBA8, encode } from 'upng-js'
export const CONTEXTS_PER_VIEWPORT = 16;
interface SurfObj {
    geo: Geometry;
    mat: Material;
    done: boolean;
    finished: boolean;
    lastGL?: any;
    symmetries?: any[];
    style?: SurfaceStyleSpec;
}
export class ViewerDeMol {
    private static numWorkers = 4; 
    private static maxVolume = 64000; 
    private callback: any;
    private defaultcolors: any;
    private config: ViewerSpec;
    private nomouse = false;
    private bgColor: any;
    private camerax: number;
    private _viewer: ViewerDeMol;
    private glDOM: HTMLCanvasElement | null = null;
    private models: Model3D[] = []; 
    private surfaces: Record<number,SurfObj[]> = {};
    private shapes = []; 
    private labels: Label[] = [];
    private clickables = []; 
    private hoverables = []; 
    private contextMenuEnabledObjects = []; 
    private current_hover: any = null;
    private hoverDuration = 500;
    private longTouchDuration = 1000;
    private viewer_frame = 0;
    private WIDTH: number;
    private HEIGHT: number;
    private viewChangeCallback: any = null;
    private stateChangeCallback: any = null;
    private NEAR = 1;
    private FAR = 800;
    private CAMERA_Z = 150;
    private fov = 20;
    private linkedViewers = [];
    private renderer: Renderer | null = null;
    private row: number;
    private col: number;
    private cols: number;
    private rows: number;
    private viewers: any;
    private control_all = false;
    private ASPECT: any;
    private camera: Camera;
    private lookingAt: Vector3;
    private raycaster: Raycaster;
    private projector: Projector;
    private scene: any = null;
    private rotationGroup: any = null; 
    private modelGroup: any = null;
    private fogStart = 0.4;
    private slabNear = -50; 
    private slabFar = 50;
    public container: HTMLElement | null;
    static readonly surfaceTypeMap = {
        "VDW": SurfaceType.VDW,
        "MS": SurfaceType.MS,
        "SAS": SurfaceType.SAS,
        "SES": SurfaceType.SES
    };
    private cq = new Quaternion(0, 0, 0, 1);
    private dq = new Quaternion(0, 0, 0, 1);
    private animated = 0;
    private animationTimers = new Set<PausableTimer>();
    private isDragging = false;
    private mouseStartX = 0;
    private mouseStartY = 0;
    private touchDistanceStart = 0;
    private touchHold = false;
    private currentModelPos = 0;
    private cz = 0;
    private cslabNear = 0;
    private cslabFar = 0;
    private mouseButton: any;
    private hoverTimeout: any;
    private longTouchTimeout: any;
    private divwatcher: any;
    private intwatcher: any;
    private spinInterval: any;
    private getWidth() {
        const div = this.container;
        let w = div.offsetWidth;
        if (w == 0 && div.style.display === 'none') {
            const oldpos = div.style.position;
            const oldvis = div.style.visibility;
            div.style.display = 'block';
            div.style.visibility = 'hidden';
            div.style.position = 'absolute';
            w = div.offsetWidth;
            div.style.display = 'none';
            div.style.visibility = oldvis;
            div.style.position = oldpos;
        }
        return w;
    }
    private getHeight() {
        const div = this.container;
        let h = div.offsetHeight;
        if (h == 0 && div.style.display === 'none') {
            const oldpos = div.style.position;
            const oldvis = div.style.visibility;
            div.style.display = 'block';
            div.style.visibility = 'hidden';
            div.style.position = 'absolute';
            h = div.offsetHeight;
            div.style.display = 'none';
            div.style.visibility = oldvis;
            div.style.position = oldpos;
        }
        return h;
    }
    private setupRenderer() {
        this.renderer = new Renderer({
            antialias: this.config.antialias,
            preserveDrawingBuffer: true, 
            premultipliedAlpha: false,
            id: this.config.id,
            row: this.config.row,
            col: this.config.col,
            rows: this.config.rows,
            cols: this.config.cols,
            canvas: this.config.canvas,
            containerWidth: this.WIDTH,
            containerHeight: this.HEIGHT,
            ambientOcclusion: this.config.ambientOcclusion,
            outline: this.config.outline
        });
        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        this.renderer.domElement.style.padding = "0";
        this.renderer.domElement.style.position = "absolute"; 
        this.renderer.domElement.style.top = "0px";
        this.renderer.domElement.style.left = "0px";
        this.renderer.domElement.style.zIndex = "0";
    }
    private initializeScene() {
        this.scene = new Scene();
        this.scene.fog = new Fog(this.bgColor, 100, 200);
        this.modelGroup = new Object3D();
        this.rotationGroup = new Object3D();
        this.rotationGroup.useQuaternion = true;
        this.rotationGroup.quaternion = new Quaternion(0, 0, 0, 1);
        this.rotationGroup.add(this.modelGroup);
        this.scene.add(this.rotationGroup);
        const directionalLight = new Light(0xFFFFFF);
        directionalLight.position = new Vector3(0.2, 0.2, 1)
            .normalize();
        directionalLight.intensity = 1.0;
        this.scene.add(directionalLight);
    }
    private _handleLostContext(event) {
        const isVisible = function (cont) {
            const rect = cont.getBoundingClientRect();
            return !(
                rect.right < 0 ||
                rect.bottom < 0 ||
                rect.top > (window.innerHeight || document.documentElement.clientHeight) ||
                rect.left > (window.innerWidth || document.documentElement.clientWidth)
            );
        };
        if (isVisible(this.container)) {
            let restored = 0;
            for(const c of document.getElementsByTagName('canvas')) {
                if( isVisible(c) && (c as any)._DeMol_viewer != undefined) {
                    (c as any)._DeMol_viewer.resize();
                    restored += 1;
                    if(restored >= CONTEXTS_PER_VIEWPORT) break;
                }
            }
        }
    }
    private initContainer(element) {
        this.container = element;
        this.WIDTH = this.getWidth();
        this.HEIGHT = this.getHeight();
        this.ASPECT = this.renderer.getAspect(this.WIDTH, this.HEIGHT);
        this.renderer.setSize(this.WIDTH, this.HEIGHT);
        this.container.append(this.renderer.domElement);
        this.glDOM = this.renderer.domElement;
        (this.glDOM as any)._DeMol_viewer = this;
        this.glDOM.addEventListener("webglcontextlost", this._handleLostContext.bind(this));
        if (!this.nomouse) {
            this.glDOM.addEventListener('mousedown', this._handleMouseDown.bind(this), { passive: false });
            this.glDOM.addEventListener('touchstart', this._handleMouseDown.bind(this), { passive: false });
            this.glDOM.addEventListener('wheel', this._handleMouseScroll.bind(this), { passive: false });
            this.glDOM.addEventListener('mousemove', this._handleMouseMove.bind(this), { passive: false });
            this.glDOM.addEventListener('touchmove', this._handleMouseMove.bind(this), { passive: false });
            this.glDOM.addEventListener("contextmenu", this._handleContextMenu.bind(this), { passive: false });
        }
    }
    private decAnim() {
        this.animated--;
        if (this.animated < 0) this.animated = 0;
    }
    private incAnim() {
        this.animated++;
    }
    private nextSurfID() {
        let max = 0;
        for (const i in this.surfaces) { 
            if (!this.surfaces.hasOwnProperty(i)) continue;
            const val = parseInt(i);
            if (!isNaN(val)) {
                if (val > max)
                    max = val;
            }
        }
        return max + 1;
    }
    private setSlabAndFog() {
        let center = this.camera.position.z - this.rotationGroup.position.z;
        if (center < 1)
            center = 1;
        this.camera.near = center + this.slabNear;
        if (!this.camera.ortho && this.camera.near < 1)
            this.camera.near = 1;
        this.camera.far = center + this.slabFar;
        if (this.camera.near + 1 > this.camera.far)
            this.camera.far = this.camera.near + 1;
        this.camera.fov = this.fov;
        this.camera.right = center * Math.tan(Math.PI / 180 * this.fov);
        this.camera.left = -this.camera.right;
        this.camera.top = this.camera.right / this.ASPECT;
        this.camera.bottom = -this.camera.top;
        this.camera.updateProjectionMatrix();
        this.scene.fog.near = this.camera.near + this.fogStart * (this.camera.far - this.camera.near);
        this.scene.fog.far = this.camera.far;
        if (this.config.disableFog) {
            this.scene.fog.near = this.scene.fog.far;
        }
    }
    private show(nolink?) {
        this.renderer.setViewport();
        if (!this.scene)
            return;
        this.setSlabAndFog();
        this.renderer.render(this.scene, this.camera);
        if (this.viewChangeCallback) this.viewChangeCallback(this._viewer.getView());
        if (!nolink && this.linkedViewers.length > 0) {
            const view = this._viewer.getView();
            for (let i = 0; i < this.linkedViewers.length; i++) {
                const other = this.linkedViewers[i];
                other.setView(view, true);
            }
        }
    }
    private updateClickables() {
        this.clickables.splice(0, this.clickables.length);
        this.hoverables.splice(0, this.hoverables.length);
        this.contextMenuEnabledObjects.splice(0, this.contextMenuEnabledObjects.length);
        for (let i = 0, il = this.models.length; i < il; i++) {
            const model = this.models[i];
            if (model) {
                const atoms = model.selectedAtoms({
                    clickable: true
                });
                const hoverable_atoms = model.selectedAtoms({
                    hoverable: true
                });
                const contextMenuEnabled_atom = model.selectedAtoms({ contextMenuEnabled: true });
                for (let n = 0; n < hoverable_atoms.length; n++) {
                    this.hoverables.push(hoverable_atoms[n]);
                }
                for (let m = 0; m < atoms.length; m++) {
                    this.clickables.push(atoms[m]);
                }
                for (let m = 0; m < contextMenuEnabled_atom.length; m++) {
                    this.contextMenuEnabledObjects.push(contextMenuEnabled_atom[m]);
                }
            }
        }
        for (let i = 0, il = this.shapes.length; i < il; i++) {
            const shape = this.shapes[i];
            if (shape && shape.clickable) {
                this.clickables.push(shape);
            }
            if (shape && shape.hoverable) {
                this.hoverables.push(shape);
            }
            if (shape && shape.contextMenuEnabled) {
                this.contextMenuEnabledObjects.push(shape);
            }
        }
    }
    private handleClickSelection(mouseX: number, mouseY: number, event) {
        const intersects = this.targetedObjects(mouseX, mouseY, this.clickables);
        if (intersects.length) {
            const selected = intersects[0].clickable;
            if (selected.callback !== undefined) {
                if (typeof (selected.callback) != "function") {
                    selected.callback = makeFunction(selected.callback);
                }
                if (typeof (selected.callback) === "function") {
                    const isContextMenu = this.mouseButton === 3
                        && this.contextMenuEnabledObjects.includes(selected)
                        && this.userContextMenuHandler;
                    if (!isContextMenu) {
                        selected.callback(selected, this._viewer, event, this.container, intersects);
                    }
                }
            }
        }
    }
    private canvasOffset() {
        const canvas = this.glDOM;
        const rect = canvas.getBoundingClientRect();
        const doc = canvas.ownerDocument;
        const docElem = doc.documentElement;
        const win = doc.defaultView;
        return {
            top: rect.top + win.pageYOffset - docElem.clientTop,
            left: rect.left + win.pageXOffset - docElem.clientLeft
        };
    }
    private setHover(selected, event?, intersects?) {
        if (this.current_hover == selected) return;
        if (this.current_hover) {
            if (typeof (this.current_hover.unhover_callback) != "function") {
                this.current_hover.unhover_callback = makeFunction(this.current_hover.unhover_callback);
            }
            this.current_hover.unhover_callback(this.current_hover, this._viewer, event, this.container, intersects);
        }
        this.current_hover = selected;
        if (selected && selected.hover_callback !== undefined) {
            if (typeof (selected.hover_callback) != "function") {
                selected.hover_callback = makeFunction(selected.hover_callback);
            }
            if (typeof (selected.hover_callback) === "function") {
                selected.hover_callback(selected, this._viewer, event, this.container, intersects);
            }
        }
    }
    private handleHoverSelection(mouseX, mouseY, event) {
        if (this.hoverables.length == 0) return;
        const intersects = this.targetedObjects(mouseX, mouseY, this.hoverables);
        if (intersects.length) {
            const selected = intersects[0].clickable;
            this.setHover(selected, event, intersects);
            this.current_hover = selected;
        }
        else {
            this.setHover(null);
        }
    }
    private handleHoverContinue(mouseX: number, mouseY: number) {
        const intersects = this.targetedObjects(mouseX, mouseY, this.hoverables);
        if (intersects.length == 0 || intersects[0] === undefined) {
            this.setHover(null);
        }
        if (intersects[0] !== undefined && intersects[0].clickable !== this.current_hover) {
            this.setHover(null);
        }
    }
    private closeEnoughForClick(event, { allowTolerance = event.targetTouches, tolerance = 5 } = {}) {
        const x = this.getX(event);
        const y = this.getY(event);
        if (allowTolerance) {
            const deltaX = Math.abs(x - this.mouseStartX);
            const deltaY = Math.abs(y - this.mouseStartY);
            return deltaX <= tolerance && deltaY <= tolerance;
        } else {
            return x === this.mouseStartX && y === this.mouseStartY;
        }
    }
    private calcTouchDistance(ev) { 
        const xdiff = ev.targetTouches[0].pageX -
            ev.targetTouches[1].pageX;
        const ydiff = ev.targetTouches[0].pageY -
            ev.targetTouches[1].pageY;
        return Math.hypot(xdiff, ydiff);
    }
    private getX(ev) {
        let x = ev.pageX;
        if (x == undefined) x = ev.pageX; 
        if (ev.targetTouches &&
            ev.targetTouches[0]) {
            x = ev.targetTouches[0].pageX;
        }
        else if (ev.changedTouches &&
            ev.changedTouches[0]) {
            x = ev.changedTouches[0].pageX;
        }
        return x;
    }
    private getY(ev) {
        let y = ev.pageY;
        if (y == undefined) y = ev.pageY;
        if (ev.targetTouches &&
            ev.targetTouches[0]) {
            y = ev.targetTouches[0].pageY;
        }
        else if (ev.changedTouches &&
            ev.changedTouches[0]) {
            y = ev.changedTouches[0].pageY;
        }
        return y;
    }
    private isInViewer(x: number, y: number) {
        if (this.viewers != undefined) {
            const width = this.WIDTH / this.cols;
            const height = this.HEIGHT / this.rows;
            const offset = this.canvasOffset();
            const relx = (x - offset.left);
            const rely = (y - offset.top);
            const r = this.rows - Math.floor(rely / height) - 1;
            const c = Math.floor(relx / width);
            if (r != this.row || c != this.col)
                return false;
        }
        return true;
    }
    private adjustZoomToLimits(z: number) {
        if (this.config.lowerZoomLimit && this.config.lowerZoomLimit > 0) {
            const lower = this.CAMERA_Z - this.config.lowerZoomLimit;
            if (z > lower) z = lower;
        }
        if (this.config.upperZoomLimit && this.config.upperZoomLimit > 0) {
            const upper = this.CAMERA_Z - this.config.upperZoomLimit;
            if (z < upper) z = upper;
        }
        if (z > this.CAMERA_Z - 1) {
            z = this.CAMERA_Z - 1; 
        }
        return z;
    }
    private static slerp(v0: Quaternion, v1: Quaternion, t: number) {
        if (t == 1) return v1.clone();
        else if (t == 0) return v0.clone();
        let dot = v0.x * v1.x + v0.y * v1.y + v0.z * v1.z + v0.w * v1.w;
        if (dot > 0.9995) {
            const result = new Quaternion(
                v0.x + t * (v1.x - v0.x),
                v0.y + t * (v1.y - v0.y),
                v0.z + t * (v1.z - v0.z),
                v0.w + t * (v1.w - v0.w));
            result.normalize();
            return result;
        }
        if (dot < 0.0) {
            v1 = v1.clone().multiplyScalar(-1);
            dot = -dot;
        }
        if (dot > 1) dot = 1.0;
        else if (dot < -1) dot = -1.0;
        const theta_0 = Math.acos(dot);  
        const theta = theta_0 * t;    
        const v2 = v1.clone();
        v2.sub(v0.clone().multiplyScalar(dot));
        v2.normalize();              
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const ret = new Quaternion(
            v0.x * c + v2.x * s,
            v0.y * c + v2.y * s,
            v0.z * c + v2.z * s,
            v0.w * c + v2.w * s
        );
        ret.normalize();
        return ret;
    }
    constructor(element, c: ViewerSpec = {}) {
        this.config = c;
        this.callback = this.config.callback;
        this.defaultcolors = this.config.defaultcolors;
        if (!this.defaultcolors)
            this.defaultcolors = elementColors.defaultColors;
        this.nomouse = Boolean(this.config.nomouse);
        this.bgColor = 0;
        this.config.backgroundColor = this.config.backgroundColor || "#ffffff";
        if (typeof (this.config.backgroundColor) != 'undefined') {
            this.bgColor = CC.color(this.config.backgroundColor).getHex();
        }
        this.config.backgroundAlpha = this.config.backgroundAlpha == undefined ? 1.0 : this.config.backgroundAlpha;
        this.camerax = 0;
        if (typeof (this.config.camerax) != 'undefined') {
            this.camerax = typeof(this.config.camerax) === 'string' ? parseFloat(this.config.camerax) : this.config.camerax;
        }
        this._viewer = this;
        this.container = element; 
        if (this.config.hoverDuration != undefined) {
            this.hoverDuration = this.config.hoverDuration;
        }
        if (this.config.antialias === undefined) this.config.antialias = true;
        if (this.config.cartoonQuality === undefined) this.config.cartoonQuality = 10;
        this.WIDTH = this.getWidth();
        this.HEIGHT = this.getHeight();
        this.setupRenderer();
        this.row = this.config.row == undefined ? 0 : this.config.row;
        this.col = this.config.col == undefined ? 0 : this.config.col;
        this.cols = this.config.cols;
        this.rows = this.config.rows;
        this.viewers = this.config.viewers;
        this.control_all = this.config.control_all;
        this.ASPECT = this.renderer.getAspect(this.WIDTH, this.HEIGHT);
        this.camera = new Camera(this.fov, this.ASPECT, this.NEAR, this.FAR, this.config.orthographic);
        this.camera.position = new Vector3(this.camerax, 0, this.CAMERA_Z);
        this.lookingAt = new Vector3();
        this.camera.lookAt(this.lookingAt);
        this.raycaster = new Raycaster(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
        this.projector = new Projector();
        this.initializeScene();
        this.renderer.setClearColorHex(this.bgColor, this.config.backgroundAlpha);
        this.scene.fog.color = CC.color(this.bgColor);
        document.body.addEventListener('mouseup', this._handleMouseUp.bind(this));
        document.body.addEventListener('touchend', this._handleMouseUp.bind(this));
        this.initContainer(this.container);
        if (this.config.style) { 
            this.setViewStyle(this.config as ViewStyle);
        }
        window.addEventListener("resize", this.resize.bind(this));
        if (typeof (window.ResizeObserver) !== "undefined") {
            this.divwatcher = new window.ResizeObserver(this.resize.bind(this));
            this.divwatcher.observe(this.container);
        }
        if (typeof (window.IntersectionObserver) !== "undefined") {
            const intcallback = (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.resize();
                    }
                });
            };
            this.intwatcher = new window.IntersectionObserver(intcallback);
            this.intwatcher.observe(this.container);
        }
        try {
            if (typeof (this.callback) === "function")
                this.callback(this);
        } catch (e) {
            console.log("error with glviewer callback: " + e);
        }
    }
    public targetedObjects(x: number, y: number, objects) {
        const mouse = {
            x: x,
            y: y,
            z: -1.0
        };
        if (!Array.isArray(objects)) { 
            objects = this.selectedAtoms(objects);
        }
        if (objects.length == 0) return [];
        this.raycaster.setFromCamera(mouse, this.camera);
        return this.raycaster.intersectObjects(this.modelGroup, objects);
    }
    public modelToScreen(coords) {
        let returnsingle = false;
        if (!Array.isArray(coords)) {
            coords = [coords];
            returnsingle = true;
        }
        const ratioX = this.renderer.getXRatio();
        const ratioY = this.renderer.getYRatio();
        const col = this.col;
        const row = this.row;
        const viewxoff = col * (this.WIDTH / ratioX);
        const viewyoff = (ratioY - row - 1) * (this.HEIGHT / ratioY);
        let results = [];
        const offset = this.canvasOffset();
        coords.forEach(coord => {
            const t = new Vector3(coord.x, coord.y, coord.z);
            t.applyMatrix4(this.modelGroup.matrixWorld);
            this.projector.projectVector(t, this.camera);
            const screenX = (this.WIDTH / ratioX) * (t.x + 1) / 2.0 + offset.left + viewxoff;
            const screenY = -(this.HEIGHT / ratioY) * (t.y - 1) / 2.0 + offset.top + viewyoff;
            results.push({ x: screenX, y: screenY });
        });
        if (returnsingle) results = results[0];
        return results;
    }
    public screenOffsetToModel(x: number, y: number, modelz?) {
        const dx = x / this.WIDTH;
        const dy = y / this.HEIGHT;
        const zpos = (modelz === undefined ? this.rotationGroup.position.z : modelz);
        const q = this.rotationGroup.quaternion;
        const t = new Vector3(0, 0, zpos);
        this.projector.projectVector(t, this.camera);
        t.x += dx * 2;
        t.y -= dy * 2;
        this.projector.unprojectVector(t, this.camera);
        t.z = 0;
        t.applyQuaternion(q);
        return t;
    }
    public screenToModelDistance(screen: XYZ, model) {
        const offset = this.canvasOffset();
        const mvec = new Vector3(model.x, model.y, model.z);
        mvec.applyMatrix4(this.modelGroup.matrixWorld);
        const m = mvec.clone();
        this.projector.projectVector(mvec, this.camera);
        const t = new Vector3((screen.x - offset.left) * 2 / this.WIDTH - 1, (screen.y - offset.top) * 2 / -this.HEIGHT + 1, mvec.z);
        this.projector.unprojectVector(t, this.camera);
        return t.distanceTo(m);
    }
    public setViewChangeCallback(callback) {
        if (typeof (callback) === 'function' || callback == null)
            this.viewChangeCallback = callback;
    }
    public setStateChangeCallback(callback) {
        if (typeof (callback) === 'function' || callback == null)
            this.stateChangeCallback = callback;
    }
    public getConfig() {
        return this.config;
    }
    public setConfig(c: ViewerSpec) {
        this.config = c;
        if(c.ambientOcclusion) {
            this.renderer.enableAmbientOcclusion(c.ambientOcclusion);
        }
    }
    public getInternalState() {
        const ret = { 'models': [], 'surfaces': [], 'shapes': [], 'labels': [] };
        for (let i = 0; i < this.models.length; i++) {
            if (this.models[i]) {
                ret.models[i] = this.models[i].getInternalState();
            }
        }
        return ret;
    }
    public setInternalState(state) {
        this.clear();
        const newm = state.models;
        for (let i = 0; i < newm.length; i++) {
            if (newm[i]) {
                this.models[i] = new Model3D(i);
                this.models[i].setInternalState(newm[i]);
            }
        }
        this.render();
    }
    public setZoomLimits(lower, upper) {
        if (typeof (lower) !== 'undefined') this.config.lowerZoomLimit = lower;
        if (upper) this.config.upperZoomLimit = upper;
        this.rotationGroup.position.z = this.adjustZoomToLimits(this.rotationGroup.position.z);
        this.show();
    }
    public setCameraParameters(parameters) {
        if (parameters.fov !== undefined) {
            this.fov = parameters.fov;
            this.camera.fov = this.fov;
        }
        if (parameters.z !== undefined) {
            this.CAMERA_Z = parameters.z;
            this.camera.z = this.CAMERA_Z;
        }
        if (parameters.orthographic !== undefined) {
            this.camera.ortho = parameters.orthographic;
        }
        this.setSlabAndFog();
    }
    public _handleMouseDown(ev) {
        ev.preventDefault();
        if (!this.scene)
            return;
        const x = this.getX(ev);
        const y = this.getY(ev);
        if (x === undefined)
            return;
        this.isDragging = true;
        this.mouseButton = ev.which;
        this.mouseStartX = x;
        this.mouseStartY = y;
        this.touchHold = true;
        this.touchDistanceStart = 0;
        if (ev.targetTouches &&
            ev.targetTouches.length == 2) {
            this.touchDistanceStart = this.calcTouchDistance(ev);
        }
        this.cq = this.rotationGroup.quaternion.clone();
        this.cz = this.rotationGroup.position.z;
        this.currentModelPos = this.modelGroup.position.clone();
        this.cslabNear = this.slabNear;
        this.cslabFar = this.slabFar;
        const self = this;
        if (ev.targetTouches && ev.targetTouches.length === 1) {
            this.longTouchTimeout = setTimeout(function () {
                if (self.touchHold == true) {
                    self.glDOM = self.renderer.domElement;
                    const touch = ev.targetTouches[0];
                    const newEvent = new PointerEvent('contextmenu', {
                        ...ev,
                        pageX: touch.pageX, pageY: touch.pageY,
                        screenX: touch.screenX, screenY: touch.screenY,
                        clientX: touch.clientX, clientY: touch.clientY,
                    });
                    self.glDOM.dispatchEvent(newEvent);
                }
                else {
                }
            }, this.longTouchDuration);
        }
    }
    public _handleMouseUp(ev) {
        this.touchHold = false;
        if (this.isDragging && this.scene) { 
            const x = this.getX(ev);
            const y = this.getY(ev);
            if (this.closeEnoughForClick(ev) && this.isInViewer(x, y)) {
                const mouse = this.mouseXY(x, y);
                this.handleClickSelection(mouse.x, mouse.y, ev);
            }
        }
        this.isDragging = false;
    }
    public _handleMouseScroll(ev) { 
        ev.preventDefault();
        if (!this.scene)
            return;
        const x = this.getX(ev);
        const y = this.getY(ev);
        if (x === undefined)
            return;
        if (!this.control_all && !this.isInViewer(x, y)) {
            return;
        }
        const scaleFactor = (this.CAMERA_Z - this.rotationGroup.position.z) * 0.85;
        let mult = 1.0;
        if (ev.ctrlKey) {
            mult = -1.0; 
        }
        if (ev.detail) {
            this.rotationGroup.position.z += mult * scaleFactor * ev.detail / 10;
        } else if (ev.wheelDelta) {
            const wd = ev.wheelDelta * 600 / (ev.wheelDelta + 600);
            this.rotationGroup.position.z -= mult * scaleFactor * wd / 400;
        }
        this.rotationGroup.position.z = this.adjustZoomToLimits(this.rotationGroup.position.z);
        this.show();
    }
    public pngURI() {
        return this.getCanvas().toDataURL('image/png');
    }
    public apngURI(nframes: number) {
        const viewer = this;
        nframes = nframes ? nframes : 1;
        return new Promise(function (resolve) {
            let framecnt = 0;
            const oldcb = viewer.viewChangeCallback;
            const bufpromise = [];
            const delays = [];
            let lasttime = Date.now();
            viewer.viewChangeCallback = function () {
                delays.push(Date.now() - lasttime);
                lasttime = Date.now();
                bufpromise.push(new Promise(resolve => {
                    viewer.getCanvas().toBlob(function (blob) {
                        blob.arrayBuffer().then(resolve);
                    }, "image/png");
                }));
                framecnt += 1;
                if (framecnt == nframes) {
                    viewer.viewChangeCallback = oldcb;
                    Promise.all(bufpromise).then((buffers) => {
                        const rgbas = [];
                        for (let i = 0; i < buffers.length; i++) {
                            const img = decode(buffers[i]);
                            rgbas.push(toRGBA8(img)[0]);
                        }
                        const width = viewer.getCanvas().width;
                        const height = viewer.getCanvas().height;
                        const apng = encode(rgbas, width, height, 0, delays);
                        const blob = new Blob([apng], { type: 'image/png' });
                        const fr = new FileReader();
                        fr.onload = function (e) {
                            resolve(e.target.result);
                        };
                        fr.readAsDataURL(blob);
                    });
                }
            };
        });
    }
    public getCanvas(): HTMLCanvasElement {
        return this.glDOM;
    }
    public getRenderer() {
        return this.renderer;
    }
    public setHoverDuration(duration?: number) {
        this.hoverDuration = duration;
    }
    private mouseXY(x, y) {
        const offset = this.canvasOffset();
        const ratioX = this.renderer.getXRatio();
        const ratioY = this.renderer.getYRatio();
        const col = this.col;
        const row = this.row;
        const viewxoff = col * (this.WIDTH / ratioX);
        const viewyoff = (ratioY - row - 1) * (this.HEIGHT / ratioY);
        const mouseX = ((x - offset.left - viewxoff) / (this.WIDTH / ratioX)) * 2 - 1;
        const mouseY = -((y - offset.top - viewyoff) / (this.HEIGHT / ratioY)) * 2 + 1;
        return { x: mouseX, y: mouseY };
    }
    public _handleMouseMove(ev) { 
        clearTimeout(this.hoverTimeout);
        ev.preventDefault();
        const x = this.getX(ev);
        const y = this.getY(ev);
        if (x === undefined)
            return;
        const ratioX = this.renderer.getXRatio();
        const ratioY = this.renderer.getYRatio();
        const mouse = this.mouseXY(x, y);
        const self = this;
        if (this.current_hover !== null) {
            this.handleHoverContinue(mouse.x, mouse.y);
        }
        let mode = 0;
        if (!this.control_all && !this.isInViewer(x, y)) {
            return;
        }
        if (!this.scene)
            return;
        if (this.hoverables.length > 0) {
            this.hoverTimeout = setTimeout(
                function () {
                    self.handleHoverSelection(mouse.x, mouse.y, ev);
                },
                this.hoverDuration);
        }
        if (!this.isDragging)
            return;
        if (ev.targetTouches && (ev.targetTouches.length > 1 ||
            (ev.targetTouches.length === 1 && !this.closeEnoughForClick(ev)))) {
            clearTimeout(this.longTouchTimeout);
        }
        let dx = (x - this.mouseStartX) / this.WIDTH;
        let dy = (y - this.mouseStartY) / this.HEIGHT;
        if (this.touchDistanceStart != 0 &&
            ev.targetTouches &&
            ev.targetTouches.length == 2) {
            const newdist = this.calcTouchDistance(ev);
            mode = 2;
            dy = (newdist - this.touchDistanceStart) * 2 / (this.WIDTH + this.HEIGHT);
        } else if (ev.targetTouches &&
            ev.targetTouches.length == 3) {
            mode = 1;
        }
        dx *= ratioX;
        dy *= ratioY;
        const r = Math.hypot(dx, dy);
        let scaleFactor;
        if (mode == 3 || (this.mouseButton == 3 && ev.ctrlKey)) { 
            this.slabNear = this.cslabNear + dx * 100;
            this.slabFar = this.cslabFar - dy * 100;
        } else if (mode == 2 || this.mouseButton == 3 || ev.shiftKey) { 
            scaleFactor = (this.CAMERA_Z - this.rotationGroup.position.z) * 0.85;
            if (scaleFactor < 80)
                scaleFactor = 80;
            this.rotationGroup.position.z = this.cz + dy * scaleFactor;
            this.rotationGroup.position.z = this.adjustZoomToLimits(this.rotationGroup.position.z);
        } else if (mode == 1 || this.mouseButton == 2 || ev.ctrlKey) { 
            const t = this.screenOffsetToModel(ratioX * (x - this.mouseStartX), ratioY * (y - this.mouseStartY));
            this.modelGroup.position.addVectors(this.currentModelPos, t);
        } else if ((mode === 0 || this.mouseButton == 1) && r !== 0) { 
            const rs = Math.sin(r * Math.PI) / r;
            this.dq.x = Math.cos(r * Math.PI);
            this.dq.y = 0;
            this.dq.z = rs * dx;
            this.dq.w = -rs * dy;
            this.rotationGroup.quaternion.set(1, 0, 0, 0);
            this.rotationGroup.quaternion.multiply(this.dq);
            this.rotationGroup.quaternion.multiply(this.cq);
        }
        this.show();
    }
    public userContextMenuHandler: Function | null = null;
    public _handleContextMenu(ev) {
        ev.preventDefault();
        if (this.closeEnoughForClick(ev)) {
            var x = this.mouseStartX;
            var y = this.mouseStartY;
            var offset = this.canvasOffset();
            const mouse = this.mouseXY(x, y);
            const mouseX = mouse.x;
            const mouseY = mouse.y;
            const intersects = this.targetedObjects(mouseX, mouseY, this.contextMenuEnabledObjects);
            let selected = null;
            if (intersects.length) {
                selected = intersects[0].clickable;
            }
            var offset = this.canvasOffset();
            var x = this.mouseStartX - offset.left;
            var y = this.mouseStartY - offset.top;
            if (this.userContextMenuHandler) {
                this.userContextMenuHandler(selected, x, y, intersects, ev);
                this.isDragging = false;
            }
        }
    }
    public setContainer(element) {
        const elem = getElement(element) || this.container;
        this.initContainer(elem);
        return this;
    }
    public setBackgroundColor(hex: ColorSpec, a: number) {
        if (typeof (a) == "undefined") {
            a = 1.0;
        }
        else if (a < 0 || a > 1.0) {
            a = 1.0;
        }
        const c = CC.color(hex);
        this.scene.fog.color = c;
        this.bgColor = c.getHex();
        this.renderer.setClearColorHex(c.getHex(), a);
        this.show();
        return this;
    }
    public setProjection(proj) {
        this.camera.ortho = (proj === "orthographic");
        this.setSlabAndFog();
    }
    public setViewStyle(parameters: ViewStyle) {
        parameters = parameters || {};
        parameters.style = parameters.style || "";
        if (parameters.style.includes("outline")) {
            this.renderer.enableOutline(parameters);
        } else {
            this.renderer.disableOutline();
        }
        if (parameters.style.includes("ambientOcclusion")) {
            const params: any = {};
            if (parameters.strength) params.strength = parameters.strength;
            if (parameters.radius) params.radius = parameters.radius;
            this.renderer.enableAmbientOcclusion(params);
        } else {
            this.renderer.disableAmbientOcclusion();
        }        
        return this;
    }
    private updateSize() {
        this.renderer.setSize(this.WIDTH, this.HEIGHT);
        this.ASPECT = this.renderer.getAspect(this.WIDTH, this.HEIGHT);
        this.renderer.setSize(this.WIDTH, this.HEIGHT);
        this.camera.aspect = this.ASPECT;
        this.camera.updateProjectionMatrix();
    }
    public setWidth(w: number) {
        this.WIDTH = w || this.WIDTH;
        this.updateSize();
        return this;
    }
    public setHeight(h: number) {
        this.HEIGHT = h || this.HEIGHT;
        this.updateSize();
        return this;
    }
    public resize() {
        this.WIDTH = this.getWidth();
        this.HEIGHT = this.getHeight();
        let regen = false;
        if (this.renderer.isLost() && this.WIDTH > 0 && this.HEIGHT > 0) {
            let resetcanvas = false;
            const currentcanvas = this.container.querySelector('canvas');
            if (currentcanvas && currentcanvas != this.renderer.getCanvas()) {
                this.config.canvas = currentcanvas;
            } else {
                currentcanvas.remove(); 
                if (this.config && this.config.canvas != undefined) {
                    delete this.config.canvas;
                    resetcanvas = true;
                }
            }
            this.setupRenderer();
            this.initContainer(this.container);
            this.renderer.setClearColorHex(this.bgColor, this.config.backgroundAlpha);
            regen = true;
            if (resetcanvas) {
                this.config.canvas = this.renderer.getCanvas();
            }
        }
        if (this.WIDTH == 0 || this.HEIGHT == 0) {
            if (this.animated) this._viewer.pauseAnimate();
        } else if (this.animated) {
            this._viewer.resumeAnimate();
        }
        this.updateSize();
        if (regen) { 
            const options = this.renderer.supportedExtensions();
            options.regen = true;
            if (this.viewers) {
                for (let i = 0, n = this.viewers.length; i < n; i++) {
                    for (let j = 0, m = this.viewers[i].length; j < m; j++) {
                        this.viewers[i][j].render(null, options);
                    }
                }
            }
            this._viewer.render(null, options);
        } else {
            this.show();
        }
        return this;
    }
    public getModel(id?: number | Model3D) {
        if (id === undefined) {
            return this.models.length == 0 ? null : this.models[this.models.length - 1];
        }
        if (id instanceof Model3D) {
            return id;
        }
        if (!(id in this.models)) {
            if (this.models.length == 0)
                return null;
            else
                return this.models[this.models.length - 1]; 
        }
        return this.models[id];
    }
    public spin(axis, speed: number = 1, only_when_visable: boolean = false) {
        clearInterval(this.spinInterval);
        if (typeof axis == 'undefined')
            axis = 'y';
        if (typeof axis == "boolean") {
            if (!axis)
                return;
            else
                axis = 'y';
        }
        if (Array.isArray(axis)) {
            axis = { x: axis[0], y: axis[1], z: axis[2] };
        }
        const viewer = this;
        this.spinInterval = setInterval(
            function () {
                if (!viewer.getCanvas().isConnected && viewer.renderer.isLost()) {
                    clearInterval(viewer.spinInterval);
                }
                if(!only_when_visable || (viewer.container.checkVisibility && viewer.container.checkVisibility())) {                    
                    viewer.rotate(1 * speed, axis);
                }
            }, 25);
    }
    private animateMotion(duration: number, fixed: boolean, mpos: Vector3, rz: number, rot: Quaternion, cam: Vector3) {
        const interval = 20;
        let nsteps: number = Math.ceil(duration / interval);
        if (nsteps < 1) nsteps = 1;
        this.incAnim();
        const curr = {
            mpos: this.modelGroup.position.clone(),
            rz: this.rotationGroup.position.z,
            rot: this.rotationGroup.quaternion.clone(),
            cam: this.lookingAt.clone()
        };
        if (fixed) { 
            const steps = new Array(nsteps);
            for (let i = 0; i < nsteps; i++) {
                const frac = (i + 1) / nsteps;
                const next: any = { mpos: curr.mpos, rz: curr.rz, rot: curr.rot };
                next.mpos = mpos.clone().sub(curr.mpos).multiplyScalar(frac).add(curr.mpos);
                next.rz = curr.rz + frac * (rz - curr.rz);
                next.rot = ViewerDeMol.slerp(curr.rot, rot, frac);
                next.cam = cam.clone().sub(curr.cam).multiplyScalar(frac).add(curr.cam);
                steps[i] = next;
            }
            let step = 0;
            const self = this;
            const callback = function () {
                const p = steps[step];
                step += 1;
                self.modelGroup.position = p.mpos;
                self.rotationGroup.position.z = p.rz;
                self.rotationGroup.quaternion = p.rot;
                self.camera.lookAt(p.cam);
                if (step < steps.length) {
                    setTimeout(callback, interval);
                } else {
                    self.decAnim();
                }
                self.show();
            };
            setTimeout(callback, interval);
        } else { 
            const delta: any = {};
            const frac = 1.0 / nsteps;
            if (mpos) {
                delta.mpos = mpos.clone().sub(curr.mpos).multiplyScalar(frac);
            }
            if (typeof (rz) != 'undefined' && rz != null) {
                delta.rz = frac * (rz - curr.rz);
            }
            if (rot) {
                const next = ViewerDeMol.slerp(curr.rot, rot, frac);
                delta.rot = curr.rot.clone().inverse().multiply(next);
            }
            if (cam) {
                delta.cam = cam.clone().sub(curr.cam).multiplyScalar(frac);
            }
            let step = 0.0;
            const self = this;
            const callback = function () {
                step += 1;
                if (delta.mpos) {
                    self.modelGroup.position.add(delta.mpos);
                }
                if (delta.rz) {
                    self.rotationGroup.position.z += delta.rz;
                }
                if (delta.rot) {
                    self.rotationGroup.quaternion.multiply(delta.rot);
                }
                if (delta.cam) {
                    self.lookingAt.add(delta.cam);
                    self.camera.lookAt(self.lookingAt);
                }
                if (step < nsteps) {
                    setTimeout(callback, interval);
                } else {
                    self.decAnim();
                }
                self.show();
            };
            setTimeout(callback, interval);
        }
    }
    public rotate(angle: number, axis: any = "y", animationDuration: number = 0, fixedPath: boolean = false) {
        if (axis == "x") {
            axis = { x: 1, y: 0, z: 0 };
        } else if (axis == "y") {
            axis = { x: 0, y: 1, z: 0 };
        } else if (axis == "z") {
            axis = { x: 0, y: 0, z: 1 };
        }
        if (axis == "vx") {
            axis = { vx: 1, vy: 0, vz: 0 };
        } else if (axis == "vy") {
            axis = { vx: 0, vy: 1, vz: 0 };
        } else if (axis == "vz") {
            axis = { vx: 0, vy: 0, vz: 1 };
        }
        if (typeof (axis.vx) !== 'undefined') {
            const vaxis = new Vector3(axis.vx, axis.vy, axis.vz);
            vaxis.applyQuaternion(this.rotationGroup.quaternion);
            axis = { x: vaxis.x, y: vaxis.y, z: vaxis.z };
        }
        const qFromAngle = function (rangle) {
            const s = Math.sin(rangle / 2.0);
            const c = Math.cos(rangle / 2.0);
            let i = 0, j = 0, k = 0;
            i = axis.x * s;
            j = axis.y * s;
            k = axis.z * s;
            return new Quaternion(i, j, k, c).normalize();
        };
        const rangle = Math.PI * angle / 180.0;
        const q = qFromAngle(rangle);
        if (animationDuration) {
            const final = new Quaternion().copy(this.rotationGroup.quaternion).multiply(q);
            this.animateMotion(animationDuration, fixedPath,
                this.modelGroup.position,
                this.rotationGroup.position.z,
                final,
                this.lookingAt);
        } else { 
            this.rotationGroup.quaternion.multiply(q);
            this.show();
        }
        return this;
    }
    public surfacesFinished() {
        for (const key in this.surfaces) {
            if (!this.surfaces[key][0].done) {
                return false;
            }
        }
        return true;
    }
    public getView() {
        if (!this.modelGroup)
            return [0, 0, 0, 0, 0, 0, 0, 1];
        const pos = this.modelGroup.position;
        const q = this.rotationGroup.quaternion;
        return [pos.x, pos.y, pos.z, this.rotationGroup.position.z, q.x, q.y,
        q.z, q.w];
    }
    public setView(arg, nolink?) {
        if (arg === undefined ||
            !(arg instanceof Array || arg.length !== 8))
            return this;
        if (!this.modelGroup || !this.rotationGroup)
            return this;
        this.modelGroup.position.x = arg[0];
        this.modelGroup.position.y = arg[1];
        this.modelGroup.position.z = arg[2];
        this.rotationGroup.position.z = arg[3];
        this.rotationGroup.quaternion.x = arg[4];
        this.rotationGroup.quaternion.y = arg[5];
        this.rotationGroup.quaternion.z = arg[6];
        this.rotationGroup.quaternion.w = arg[7];
        if (typeof (arg[8]) != "undefined") {
            this.rotationGroup.position.x = arg[8];
            this.rotationGroup.position.y = arg[9];
        }
        this.show(nolink);
        return this;
    }
    public render(callback?, exts?) {
        this.renderer.setViewport();
        this.updateClickables(); 
        const view = this.getView();
        if (this.stateChangeCallback) {
            this.stateChangeCallback(this.getInternalState());
        }
        let i, n;
        if (!exts) exts = this.renderer.supportedExtensions();
        for (i = 0; i < this.models.length; i++) {
            if (this.models[i]) {
                this.models[i].globj(this.modelGroup, exts);
            }
        }
        for (i = 0; i < this.shapes.length; i++) {
            if (this.shapes[i]) { 
                if ((typeof (this.shapes[i].frame) === 'undefined' || this.viewer_frame < 0 ||
                    this.shapes[i].frame < 0 || this.shapes[i].frame == this.viewer_frame)) {
                    this.shapes[i].globj(this.modelGroup, exts);
                } else { 
                    this.shapes[i].removegl(this.modelGroup);
                }
            }
        }
        for (i = 0; i < this.labels.length; i++) {
            if (exts.regen) {
                this.labels[i].dispose();
                this.modelGroup.remove(this.labels[i].sprite);
                this.labels[i].setContext();
                this.modelGroup.add(this.labels[i].sprite);
            }
            if (this.labels[i] && typeof (this.labels[i].frame) != 'undefined' && this.labels[i].frame >= 0) { 
                this.modelGroup.remove(this.labels[i].sprite);
                if (this.viewer_frame < 0 || this.labels[i].frame == this.viewer_frame) {
                    this.modelGroup.add(this.labels[i].sprite);
                }
            }
        }
        for (i in this.surfaces) { 
            if (!this.surfaces.hasOwnProperty(i)) continue;
            const surfArr = this.surfaces[i];
            for (n = 0; n < surfArr.length; n++) {
                if (surfArr.hasOwnProperty(n)) {
                    const geo = surfArr[n].geo;
                    if (!surfArr[n].finished || exts.regen) {
                        geo.verticesNeedUpdate = true;
                        geo.elementsNeedUpdate = true;
                        geo.normalsNeedUpdate = true;
                        geo.colorsNeedUpdate = true;
                        geo.buffersNeedUpdate = true;
                        surfArr[n].mat.needsUpdate = true;
                        if (surfArr[n].done)
                            surfArr[n].finished = true;
                        if (surfArr[n].lastGL)
                            this.modelGroup.remove(surfArr[n].lastGL);
                        let smesh = null;
                        if (surfArr[n].mat instanceof LineBasicMaterial) {
                            smesh = new Line(geo, surfArr[n].mat);
                        }
                        else {
                            smesh = new Mesh(geo, surfArr[n].mat);
                        }
                        if (surfArr[n].mat.transparent && surfArr[n].mat.opacity == 0) {
                            smesh.visible = false;
                        } else {
                            smesh.visible = true;
                        }
                        if (surfArr[n].symmetries.length > 1 ||
                            (surfArr[n].symmetries.length == 1 &&
                                !(surfArr[n].symmetries[n].isIdentity()))) {
                            var j;
                            const tmeshes = new Object3D(); 
                            for (j = 0; j < surfArr[n].symmetries.length; j++) {
                                const tmesh = smesh.clone();
                                tmesh.matrix = surfArr[n].symmetries[j];
                                tmesh.matrixAutoUpdate = false;
                                tmeshes.add(tmesh);
                            }
                            surfArr[n].lastGL = tmeshes;
                            this.modelGroup.add(tmeshes);
                        }
                        else {
                            surfArr[n].lastGL = smesh;
                            this.modelGroup.add(smesh);
                        }
                    } 
                }
            }
        }
        this.setView(view); 
        if (typeof callback === 'function') {
            callback(this);
        }
        return this;
    }
    private getModelList(sel: any): Model3D[] {
        const ms: Model3D[] = [];
        if (typeof sel === 'undefined' || typeof sel.model === "undefined") {
            for (let i = 0; i < this.models.length; i++) {
                if (this.models[i])
                    ms.push(this.models[i]);
            }
        } else { 
            let selm: any = sel.model;
            if (!Array.isArray(selm))
                selm = [selm];
            for (let i = 0; i < selm.length; i++) {
                if (typeof selm[i] === 'number') {
                    let index = selm[i];
                    if (index < 0) index += this.models.length;
                    ms.push(this.models[index]);
                } else {
                    ms.push(selm[i]);
                }
            }
        }
        return ms;
    }
    private getAtomsFromSel(sel: AtomSelectionSpec): AtomSpec[] {
        let atoms = [];
        if (typeof (sel) === "undefined")
            sel = {};
        const ms = this.getModelList(sel);
        for (let i = 0; i < ms.length; i++) {
            atoms = atoms.concat(ms[i].selectedAtoms(sel));
        }
        return atoms;
    }
    private atomIsSelected(atom: AtomSpec, sel: AtomSelectionSpec) {
        if (typeof (sel) === "undefined")
            sel = {};
        const ms = this.getModelList(sel);
        for (let i = 0; i < ms.length; i++) {
            if (ms[i].atomIsSelected(atom, sel))
                return true;
        }
        return false;
    }
    public selectedAtoms(sel: AtomSelectionSpec): AtomSpec[] {
        return this.getAtomsFromSel(sel);
    }
    public getUniqueValues(attribute: string, sel?: AtomSelectionSpec) {
        if (typeof (sel) === "undefined")
            sel = {};
        const atoms = this.getAtomsFromSel(sel);
        const values = {};
        for (const atom in atoms) {
            if (atoms[atom].hasOwnProperty(attribute)) {
                const value = atoms[atom][attribute];
                values[value] = true;
            }
        }
        return Object.keys(values);
    }
    public pdbData(sel: AtomSelectionSpec) {
        const atoms = this.getAtomsFromSel(sel);
        let ret = "";
        for (let i = 0, n = atoms.length; i < n; ++i) {
            ret += atoms[i].pdbline + "\n";
        }
        return ret;
    }
    public zoom(factor: number = 2, animationDuration: number = 0, fixedPath: boolean = false) {
        const scale = (this.CAMERA_Z - this.rotationGroup.position.z) / factor;
        const final_z = this.CAMERA_Z - scale;
        if (animationDuration > 0) {
            this.animateMotion(animationDuration, fixedPath,
                this.modelGroup.position,
                this.adjustZoomToLimits(final_z),
                this.rotationGroup.quaternion,
                this.lookingAt);
        } else { 
            this.rotationGroup.position.z = this.adjustZoomToLimits(final_z);
            this.show();
        }
        return this;
    }
    public translate(x: number, y: number, animationDuration: number = 0, fixedPath: boolean = false) {
        const dx = x / this.WIDTH;
        const dy = y / this.HEIGHT;
        const v = new Vector3(0, 0, -this.CAMERA_Z);
        this.projector.projectVector(v, this.camera);
        v.x -= dx;
        v.y -= dy;
        this.projector.unprojectVector(v, this.camera);
        v.z = 0;
        const final_position = this.lookingAt.clone().add(v);
        if (animationDuration > 0) {
            this.animateMotion(animationDuration, fixedPath,
                this.modelGroup.position,
                this.rotationGroup.position.z,
                this.rotationGroup.quaternion,
                final_position);
        } else { 
            this.lookingAt = final_position;
            this.camera.lookAt(this.lookingAt);
            this.show();
        }
        return this;
    }
    public translateScene(x: number, y: number, animationDuration: number = 0, fixedPath = false) {
        const t = this.screenOffsetToModel(x, y);
        const final_position = this.modelGroup.position.clone().add(t);
        if (animationDuration > 0) {
            this.animateMotion(animationDuration, fixedPath,
                this.modelGroup.position,
                this.rotationGroup.position.z,
                this.rotationGroup.quaternion,
                this.lookingAt);
        } else { 
            this.modelGroup.position = final_position;
            this.show();
        }
        return this;
    }
    public fitSlab(sel: AtomSelectionSpec) {
        sel = sel || {};
        const atoms = this.getAtomsFromSel(sel);
        const tmp = getExtent(atoms);
        const x = tmp[1][0] - tmp[0][0],
            y = tmp[1][1] - tmp[0][1],
            z = tmp[1][2] - tmp[0][2];
        let maxD = Math.hypot(x, y, z);
        if (maxD < 5)
            maxD = 5;
        this.slabNear = -maxD / 1.9;
        this.slabFar = maxD / 2;
        return this;
    }
    public center(sel: AtomSelectionSpec = {}, animationDuration: number = 0, fixedPath: boolean = false) {
        let allatoms, alltmp;
        const atoms = this.getAtomsFromSel(sel);
        let tmp = getExtent(atoms);
        if (isEmptyObject(sel)) {
            this.shapes.forEach((shape) => {
                if (shape && shape.boundingSphere && shape.boundingSphere.center) {
                    const c = shape.boundingSphere.center;
                    const r = shape.boundingSphere.radius;
                    if (r > 0) {
                        atoms.push(new Vector3(c.x + r, c.y, c.z));
                        atoms.push(new Vector3(c.x - r, c.y, c.z));
                        atoms.push(new Vector3(c.x, c.y + r, c.z));
                        atoms.push(new Vector3(c.x, c.y - r, c.z));
                        atoms.push(new Vector3(c.x, c.y, c.z + r));
                        atoms.push(new Vector3(c.x, c.y, c.z - r));
                    } else {
                        atoms.push(c);
                    }
                }
            });
            tmp = getExtent(atoms);
            allatoms = atoms;
            alltmp = tmp;
        }
        else {
            allatoms = this.getAtomsFromSel({});
            alltmp = getExtent(allatoms);
        }
        const center = new Vector3(tmp[2][0], tmp[2][1], tmp[2][2]);
        let x = alltmp[1][0] - alltmp[0][0], y = alltmp[1][1] -
            alltmp[0][1], z = alltmp[1][2] - alltmp[0][2];
        let maxD = Math.hypot(x, y, z);
        if (maxD < 5)
            maxD = 5;
        this.slabNear = -maxD / 1.9;
        this.slabFar = maxD / 2;
        x = tmp[1][0] - tmp[0][0];
        y = tmp[1][1] - tmp[0][1];
        z = tmp[1][2] - tmp[0][2];
        maxD = Math.hypot(x, y, z);
        if (maxD < 5)
            maxD = 5;
        let maxDsq = 25;
        for (let i = 0; i < atoms.length; i++) {
            if (atoms[i]) {
                const dsq = center.distanceToSquared(atoms[i] as XYZ);
                if (dsq > maxDsq)
                    maxDsq = dsq;
            }
        }
        maxD = Math.sqrt(maxDsq) * 2;
        const finalpos = center.clone().multiplyScalar(-1);
        if (animationDuration > 0) {
            this.animateMotion(animationDuration, fixedPath,
                finalpos,
                this.rotationGroup.position.z,
                this.rotationGroup.quaternion,
                this.lookingAt);
        } else { 
            this.modelGroup.position = finalpos;
            this.show();
        }
        return this;
    }
    public zoomTo(sel: AtomSelectionSpec = {}, animationDuration: number = 0, fixedPath: boolean = false) {
        const atoms = this.getAtomsFromSel(sel);
        const atombox = getExtent(atoms);
        let allbox = atombox;
        if (isEmptyObject(sel)) {
            const natoms = atoms && atoms.length;
            this.shapes.forEach((shape) => {
                if (shape && shape.boundingSphere) {
                    if (shape.boundingSphere.box) {
                        const box = shape.boundingSphere.box;
                        atoms.push(new Vector3(box.min.x, box.min.y, box.min.z));
                        atoms.push(new Vector3(box.max.x, box.max.y, box.max.z));
                    } else if (shape.boundingSphere.center) {
                        const c = shape.boundingSphere.center;
                        const r = shape.boundingSphere.radius;
                        if (r > 0) {
                            atoms.push(new Vector3(c.x + r, c.y, c.z));
                            atoms.push(new Vector3(c.x - r, c.y, c.z));
                            atoms.push(new Vector3(c.x, c.y + r, c.z));
                            atoms.push(new Vector3(c.x, c.y - r, c.z));
                            atoms.push(new Vector3(c.x, c.y, c.z + r));
                            atoms.push(new Vector3(c.x, c.y, c.z - r));
                        } else {
                            atoms.push(c);
                        }
                    }
                }
            });
            allbox = getExtent(atoms);
            if (!natoms) { 
                for (let i = 0; i < 3; i++) { 
                    atombox[2][i] = (allbox[0][i] + allbox[1][i]) / 2;
                }
            }
        } else { 
            const allatoms = this.getAtomsFromSel({});
            allbox = getExtent(allatoms);
        }
        const center = new Vector3(atombox[2][0], atombox[2][1], atombox[2][2]);
        let x = allbox[1][0] - allbox[0][0], y = allbox[1][1]
            - allbox[0][1], z = allbox[1][2] - allbox[0][2];
        let maxD = Math.hypot(x, y, z);
        if (maxD < 5)
            maxD = 5;
        this.slabNear = -maxD / 1.9;
        this.slabFar = maxD / 2;
        if (Object.keys(sel).length === 0) {
            this.slabNear = Math.min(-maxD * 2, -50);
            this.slabFar = Math.max(maxD * 2, 50);
        }
        const MAXD = this.config.minimumZoomToDistance || 5;
        x = atombox[1][0] - atombox[0][0];
        y = atombox[1][1] - atombox[0][1];
        z = atombox[1][2] - atombox[0][2];
        maxD = Math.hypot(x, y, z);
        if (maxD < MAXD)
            maxD = MAXD;
        let maxDsq = MAXD * MAXD;
        for (let i = 0; i < atoms.length; i++) {
            if (atoms[i]) {
                const dsq = center.distanceToSquared(atoms[i] as XYZ);
                if (dsq > maxDsq)
                    maxDsq = dsq;
            }
        }
        maxD = Math.sqrt(maxDsq) * 2;
        const finalpos = center.clone().multiplyScalar(-1);
        let finalz = -(maxD * 0.5
            / Math.tan(Math.PI / 180.0 * this.camera.fov / 2) - this.CAMERA_Z);
        finalz = this.adjustZoomToLimits(finalz);
        if (animationDuration > 0) {
            this.animateMotion(animationDuration, fixedPath,
                finalpos,
                finalz,
                this.rotationGroup.quaternion,
                this.lookingAt);
        } else {
            this.modelGroup.position = finalpos;
            this.rotationGroup.position.z = finalz;
            this.show();
        }
        return this;
    }
    public setSlab(near: number, far: number) {
        this.slabNear = near;
        this.slabFar = far;
    }
    public getSlab() {
        return { near: this.slabNear, far: this.slabFar };
    }
    public addLabel(text: string, options: LabelSpec = {}, sel?: AtomSelectionSpec, noshow: boolean = false) {
        if (sel) {
            const extent = getExtent(this.getAtomsFromSel(sel));
            options.position = { x: extent[2][0], y: extent[2][1], z: extent[2][2] };
        }
        const label = new Label(text, options);
        label.setContext();
        this.modelGroup.add(label.sprite);
        this.labels.push(label);
        if (!noshow) this.show();
        return label;
    }
    public addResLabels(sel: AtomSelectionSpec, style: LabelSpec, byframe: boolean = false) {
        const start = this.labels.length;
        this.applyToModels("addResLabels", sel, this, style, byframe);
        this.show();
        return this.labels.slice(start);
    }
    public addPropertyLabels(prop: string, sel: AtomSelectionSpec, style: LabelSpec) {
        this.applyToModels("addPropertyLabels", prop, sel, this, style);
        this.show();
        return this;
    }
    public removeLabel(label: Label) {
        for (let i = 0; i < this.labels.length; i++) {
            if (this.labels[i] == label) {
                this.labels.splice(i, 1);
                label.dispose();
                this.modelGroup.remove(label.sprite);
                break;
            }
        }
        this.show();
        return this;
    }
    public removeAllLabels() {
        for (let i = 0; i < this.labels.length; i++) {
            if (this.labels[i] && this.labels[i].sprite) {
                this.modelGroup.remove(this.labels[i].sprite);
            }
        }
        this.labels.splice(0, this.labels.length); 
        this.show();
        return this;
    }
    public hideAllLabels() {
        for (let i = 0; i < this.labels.length; i++) {
            if (this.labels[i]) {
                this.labels[i].hide();
            }
        }
        this.show();
        return this;
    }    
    public showAllLabels() {
        for (let i = 0; i < this.labels.length; i++) {
            if (this.labels[i]) {
                this.labels[i].show();
            }
        }
        this.show();
        return this;
    }        
    public setLabelStyle(label: Label, stylespec: LabelSpec) {
        this.modelGroup.remove(label.sprite);
        label.dispose();
        label.stylespec = stylespec;
        label.setContext();
        this.modelGroup.add(label.sprite);
        this.show();
        return label;
    }
    public setLabelText(label: Label, text: string) {
        this.modelGroup.remove(label.sprite);
        label.dispose();
        label.text = text;
        label.setContext();
        this.modelGroup.add(label.sprite);
        this.show();
        return label;
    }
    public addShape(shapeSpec: ShapeSpec) {
        shapeSpec = shapeSpec || {};
        const shape = new Shape3D(shapeSpec);
        shape.shapePosition = this.shapes.length;
        this.shapes.push(shape);
        return shape;
    }
    public removeShape(shape: Shape3D) {
        if (!shape)
            return this;
        shape.removegl(this.modelGroup);
        delete this.shapes[shape.shapePosition];
        while (this.shapes.length > 0
            && typeof (this.shapes[this.shapes.length - 1]) === "undefined")
            this.shapes.pop();
        return this;
    }
    public removeAllShapes() {
        for (let i = 0; i < this.shapes.length; i++) {
            const shape = this.shapes[i];
            if (shape) shape.removegl(this.modelGroup);
        }
        this.shapes.splice(0, this.shapes.length);
        return this;
    }
    private getSelectionCenter(spec: AtomSelectionSpec): XYZ {
        if (spec.hasOwnProperty("x") && spec.hasOwnProperty("y") && spec.hasOwnProperty("z"))
            return spec as XYZ;
        const atoms = this.getAtomsFromSel(spec);
        if (atoms.length == 0)
            return { x: 0, y: 0, z: 0 };
        const extent = getExtent(atoms);
        return { x: extent[0][0] + (extent[1][0] - extent[0][0]) / 2, y: extent[0][1] + (extent[1][1] - extent[0][1]) / 2, z: extent[0][2] + (extent[1][2] - extent[0][2]) / 2 };
    }
    public addSphere(spec: SphereSpec) {
        spec = spec || {};
        spec.center = this.getSelectionCenter(spec.center);
        const s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        s.addSphere(spec);
        this.shapes.push(s);
        s.finalize(); 
        return s;
    }
    public addBox(spec: BoxSpec = {}) {
        if (spec.corner != undefined) {
            spec.corner = this.getSelectionCenter(spec.corner);
        }
        if (spec.center != undefined) {
            spec.center = this.getSelectionCenter(spec.center);
        }
        const s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        s.addBox(spec);
        this.shapes.push(s);
        s.finalize(); 
        return s;
    }
    public addArrow(spec: ArrowSpec = {}) {
        spec.start = this.getSelectionCenter(spec.start);
        spec.end = this.getSelectionCenter(spec.end);
        const s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        s.addArrow(spec);
        this.shapes.push(s);
        s.finalize(); 
        return s;
    }
    public addCylinder(spec: CylinderSpec = {}) {
        spec.start = this.getSelectionCenter(spec.start);
        spec.end = this.getSelectionCenter(spec.end);
        const s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        if (spec.dashed)
            s.addDashedCylinder(spec);
        else
            s.addCylinder(spec);
        this.shapes.push(s);
        s.finalize(); 
        return s;
    }
    public addCurve(spec: CurveSpec = {}) {
        const s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        s.addCurve(spec);
        this.shapes.push(s);
        s.finalize(); 
        return s;
    }
    public addLine(spec: LineSpec = {}) {
        spec.start = this.getSelectionCenter(spec.start);
        spec.end = this.getSelectionCenter(spec.end);
        spec.wireframe = true;
        let s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        if (spec.dashed)
            s = this.addLineDashed(spec, s);
        else
            s.addLine(spec);
        this.shapes.push(s);
        s.finalize(); 
        return s;
    }
    public addUnitCell(model?: Model3D | number, spec?: UnitCellStyleSpec) {
        model = this.getModel(model);
        spec = spec || { alabel: 'a', blabel: 'b', clabel: 'c' };
        spec.box = spec.box || {};
        spec.astyle = spec.astyle || { color: 'red', radius: 0.1, midpos: -1 };
        spec.bstyle = spec.bstyle || { color: 'green', radius: 0.1, midpos: -1 };
        spec.cstyle = spec.cstyle || { color: 'blue', radius: 0.1, midpos: -1 };
        spec.alabelstyle = spec.alabelstyle || { fontColor: 'red', showBackground: false, alignment: 'center', inFront: false };
        spec.blabelstyle = spec.blabelstyle || { fontColor: 'green', showBackground: false, alignment: 'center', inFront: false };
        spec.clabelstyle = spec.clabelstyle || { fontColor: 'blue', showBackground: false, alignment: 'center', inFront: false };
        if (model.unitCellObjects) {
            this.removeUnitCell(model);
        }
        model.unitCellObjects = { shapes: [], labels: [] };
        const data = model.getCrystData();
        let matrix = null;
        if (data) {
            if (data.matrix) {
                matrix = data.matrix;
            } else {
                let a = data.a, b = data.b, c = data.c, alpha = data.alpha, beta = data.beta, gamma = data.gamma;
                alpha = alpha * Math.PI / 180.0;
                beta = beta * Math.PI / 180.0;
                gamma = gamma * Math.PI / 180.0;
                let u, v, w;
                u = Math.cos(beta);
                v = (Math.cos(alpha) - Math.cos(beta) * Math.cos(gamma)) / Math.sin(gamma);
                w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
                matrix = new Matrix3(a, b * Math.cos(gamma), c * u,
                    0, b * Math.sin(gamma), c * v,
                    0, 0, c * w);
            }
            const points = [new Vector3(0, 0, 0),
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1),
            new Vector3(1, 1, 0),
            new Vector3(0, 1, 1),
            new Vector3(1, 0, 1),
            new Vector3(1, 1, 1)];
            if (data.matrix4) {
                for (let i = 0; i < points.length; i++) {
                    if (data.size) points[i].multiplyVectors(points[i], data.size); 
                    points[i] = points[i].applyMatrix4(data.matrix4);
                }
            } else {
                for (let i = 0; i < points.length; i++) {
                    points[i] = points[i].applyMatrix3(matrix);
                }
            }
            if (spec.box && !spec.box.hidden) {
                spec.box.wireframe = true;
                const s = new Shape3D(spec.box);
                s.shapePosition = this.shapes.length;
                s.addLine({ start: points[0], end: points[1] });
                s.addLine({ start: points[0], end: points[2] });
                s.addLine({ start: points[1], end: points[4] });
                s.addLine({ start: points[2], end: points[4] });
                s.addLine({ start: points[0], end: points[3] });
                s.addLine({ start: points[3], end: points[5] });
                s.addLine({ start: points[2], end: points[5] });
                s.addLine({ start: points[1], end: points[6] });
                s.addLine({ start: points[4], end: points[7] });
                s.addLine({ start: points[6], end: points[7] });
                s.addLine({ start: points[3], end: points[6] });
                s.addLine({ start: points[5], end: points[7] });
                this.shapes.push(s);
                model.unitCellObjects.shapes.push(s);
                s.finalize(); 
            }
            if (!spec.astyle.hidden) {
                spec.astyle.start = points[0];
                spec.astyle.end = points[1];
                const arrow = this.addArrow(spec.astyle);
                model.unitCellObjects.shapes.push(arrow);
            }
            if (!spec.bstyle.hidden) {
                spec.bstyle.start = points[0];
                spec.bstyle.end = points[2];
                const arrow = this.addArrow(spec.bstyle);
                model.unitCellObjects.shapes.push(arrow);
            }
            if (!spec.cstyle.hidden) {
                spec.cstyle.start = points[0];
                spec.cstyle.end = points[3];
                const arrow = this.addArrow(spec.cstyle);
                model.unitCellObjects.shapes.push(arrow);
            }
            if (spec.alabel) {
                spec.alabelstyle.position = points[1];
                const label = this.addLabel(spec.alabel, spec.alabelstyle);
                model.unitCellObjects.labels.push(label);
            }
            if (spec.blabel) {
                spec.blabelstyle.position = points[2];
                const label = this.addLabel(spec.blabel, spec.blabelstyle);
                model.unitCellObjects.labels.push(label);
            }
            if (spec.clabel) {
                spec.clabelstyle.position = points[3];
                const label = this.addLabel(spec.clabel, spec.clabelstyle);
                model.unitCellObjects.labels.push(label);
            }
        }
    }
    public removeUnitCell(model?: Model3D | number) {
        model = this.getModel(model);
        if (model.unitCellObjects) {
            const viewer = this;
            model.unitCellObjects.shapes.forEach(function (s) { viewer.removeShape(s); });
            model.unitCellObjects.labels.forEach(function (l) { viewer.removeLabel(l); });
        }
        delete model.unitCellObjects;
    }
    public replicateUnitCell(A: number = 3, B: number = A, C: number = B, model?: Model3D | number, addBonds?: boolean, prune?) {
        model = this.getModel(model);
        const cryst = model.getCrystData();
        if (cryst) {
            const atoms = model.selectedAtoms({});
            const matrix = cryst.matrix;
            const makeoff = function (I) {
                if (I % 2 == 0) return -I / 2;
                else return Math.ceil(I / 2);
            };
            if (A <= 1 && B <= 1 && C <= 1) {
                prune = true;
                A = B = C = 3;
            }
            let omitPosition = function (x, y, z) { return false; };
            if (prune) {
                const invmatrix = new Matrix3().getInverse3(matrix);
                omitPosition = function (x, y, z) {
                    const pos = new Vector3(x, y, z).applyMatrix3(invmatrix);
                    if (pos.x > -0.0001 && pos.x < 1.0001 &&
                        pos.y > -0.0001 && pos.y < 1.0001 &&
                        pos.z > -0.0001 && pos.z < 1.0001) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
            for (let i = 0; i < A; i++) {
                for (let j = 0; j < B; j++) {
                    for (let k = 0; k < C; k++) {
                        if (i == 0 && j == 0 && k == 0) continue; 
                        const offset = new Vector3(makeoff(i), makeoff(j), makeoff(k));
                        offset.applyMatrix3(matrix);
                        const newatoms = [];
                        for (let a = 0; a < atoms.length; a++) {
                            const newx = atoms[a].x + offset.x,
                                newy = atoms[a].y + offset.y,
                                newz = atoms[a].z + offset.z;
                            if (omitPosition(newx, newy, newz)) {
                                continue;
                            }
                            const newAtom: any = {};
                            for (const p in atoms[a]) {
                                newAtom[p] = atoms[a][p];
                            }
                            newAtom.x = newx;
                            newAtom.y = newy;
                            newAtom.z = newz;
                            newatoms.push(newAtom);
                        }
                        model.addAtoms(newatoms);
                    }
                }
            }
            if (addBonds) {
                model.createConnections();
            }
        }
    }
    public addLineDashed(spec: CylinderSpec, s: Shape3D) {
        spec.dashLength = spec.dashLength || 0.5;
        spec.gapLength = spec.gapLength || 0.5;
        let p1: Vector3;
        if (!spec.start) {
            p1 = new Vector3(0, 0, 0);
        } else {
            p1 = new Vector3(spec.start.x || 0,
                spec.start.y || 0, spec.start.z || 0);
        }
        let p2: Vector3;
        if (!spec.end) p2 = new Vector3(0, 0, 0);
        else p2 = new Vector3(spec.end.x, spec.end.y || 0, spec.end.z || 0);
        const dir = new Vector3();
        let dash = new Vector3();
        let gap = new Vector3();
        let length, dashAmt, gapAmt;
        const temp = p1.clone();
        let drawn = 0;
        dir.subVectors(p2, p1);
        length = dir.length();
        dir.normalize();
        dash = dir.clone();
        gap = dir.clone();
        dash.multiplyScalar(spec.dashLength);
        gap.multiplyScalar(spec.gapLength);
        dashAmt = dash.length();
        gapAmt = gap.length();
        while (drawn < length) {
            if ((drawn + dashAmt) > length) {
                spec.start = p1;
                spec.end = p2;
                s.addLine(spec);
                break;
            }
            temp.addVectors(p1, dash);
            spec.start = p1;
            spec.end = temp;
            s.addLine(spec);
            p1 = temp.clone();
            drawn += dashAmt;
            temp.addVectors(p1, gap);
            p1 = temp.clone();
            drawn += gapAmt;
        }
        s.finalize(); 
        return s;
    }
    public addCustom(spec: CustomShapeSpec) {
        spec = spec || {};
        const s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        s.addCustom(spec);
        this.shapes.push(s);
        s.finalize(); 
        return s;
    }
    public addVolumetricData(data, format: string, spec: VolumetricRendererSpec | IsoSurfaceSpec = {}) {
        const voldata = new VolumeRender(data, format);
        if (spec.hasOwnProperty('transferfn')) { 
            return this.addVolumetricRender(voldata, spec as VolumetricRendererSpec);
        } else {
            return this.addIsosurface(voldata, spec as IsoSurfaceSpec);
        }
    }
    public addIsosurface(data, spec: IsoSurfaceSpec = {}, callback?) {
        const s = new Shape3D(spec);
        s.shapePosition = this.shapes.length;
        s.addIsosurface(data, spec, callback, this);
        this.shapes.push(s);
        return s;
    }
    public addVolumetricRender(data, spec: VolumetricRendererSpec) {
        spec = spec || {};
        const s = new GLVolumetricRender(data, spec, this);
        s.shapePosition = this.shapes.length;
        this.shapes.push(s);
        return s;
    }
    public hasVolumetricRender() {
        return this.renderer.supportsVolumetric();
    }
    public enableFog(fog: boolean) {
        if (fog) {
            this.scene.fog = new Fog(this.bgColor, 100, 200);
        } else {
            this.config.disableFog = true;
            this.show();
        }
    }
    public setFrame(framenum: number) {
        this.viewer_frame = framenum;
        const viewer = this;
        return new Promise<void>(function (resolve) {
            const modelMap = viewer.models.map(function (model) {
                return model.setFrame(framenum, viewer);
            });
            Promise.all(modelMap)
                .then(function () { resolve(); });
        });
    }
    public getFrame() {
        return this.viewer_frame;
    }
    public getNumFrames() {
        let mostFrames = 0;
        for (let i = 0; i < this.models.length; i++) {
            if (this.models[i].getNumFrames() > mostFrames) {
                mostFrames = this.models[i].getNumFrames();
            }
        }
        for (let i = 0; i < this.shapes.length; i++) {
            if (this.shapes[i].frame && this.shapes[i].frame >= mostFrames) {
                mostFrames = this.shapes[i].frame + 1;
            }
        }
        for (let i = 0; i < this.labels.length; i++) {
            if (this.labels[i].frame && this.labels[i].frame >= mostFrames) {
                mostFrames = this.labels[i].frame + 1;
            }
        }
        return mostFrames;
    }
    public animate(options) {
        this.incAnim();
        let interval = 100;
        let loop = "forward";
        let reps = Infinity;
        options = options || {};
        if (options.interval) {
            interval = options.interval;
        }
        if (options.loop) {
            loop = options.loop;
        }
        if (options.reps) {
            reps = options.reps;
        }
        const mostFrames = this.getNumFrames();
        const self = this;
        let currFrame = 0;
        if (options.startFrame) {
            currFrame = options.startFrame % mostFrames;
        }
        let inc = 1;
        if (options.step) {
            inc = options.step;
            reps /= inc;
        }
        let displayCount = 0;
        const displayMax = mostFrames * reps;
        let time = new Date();
        let resolve, timer;
        const display = function (direction) {
            time = new Date();
            if (direction == "forward") {
                self.setFrame(currFrame)
                    .then(function () {
                        currFrame = (currFrame + inc) % mostFrames;
                        resolve();
                    });
            }
            else if (direction == "backward") {
                self.setFrame((mostFrames - 1) - currFrame)
                    .then(function () {
                        currFrame = (currFrame + inc) % mostFrames;
                        resolve();
                    });
            }
            else { 
                self.setFrame(currFrame)
                    .then(function () {
                        currFrame += inc;
                        inc *= (((currFrame % (mostFrames - 1)) == 0) ? -1 : 1);
                        resolve();
                    });
            }
        };
        resolve = function () {
            self.render();
            if (!self.getCanvas().isConnected) {
                self.stopAnimate();
            }
            else if (++displayCount >= displayMax || !self.isAnimated()) {
                timer.cancel();
                self.animationTimers.delete(timer);
                self.decAnim();
            }
            else {
                let newInterval = interval - (new Date().getTime() - time.getTime());
                newInterval = (newInterval > 0) ? newInterval : 0;
                self.animationTimers.delete(timer);
                timer = new PausableTimer(display, newInterval, loop);
                self.animationTimers.add(timer);
            }
        };
        timer = new PausableTimer(display, 0, loop);
        this.animationTimers.add(timer);
        return this;
    }
    public stopAnimate() {
        this.animated = 0;
        this.animationTimers.forEach(function (timer: PausableTimer) { timer.cancel(); });
        this.animationTimers = new Set();
        return this;
    }
    public pauseAnimate() {
        this.animationTimers.forEach(function (timer) { timer.pause(); });
        return this;
    }
    public resumeAnimate() {
        this.animationTimers.forEach(function (timer) { timer.resume(); });
        return this;
    }
    public isAnimated() {
        return this.animated > 0;
    }
    private getModelOpt(options) {
        if (options && !options.defaultcolors) {
            options.defaultcolors = this.defaultcolors;
            options.cartoonQuality = options.cartoonQuality || this.config.cartoonQuality;
        } else if (typeof (options) === 'undefined') {
            options = { defaultcolors: this.defaultcolors, cartoonQuality: this.config.cartoonQuality };
        }
        return options;
    }
    public addModel(data?, format = "", options?) {
        options = this.getModelOpt(options);
        const m = new Model3D(this.models.length, options);
        m.addMolData(data, format, options);
        this.models.push(m);
        return m;
    }
    public addModels(data, format: string, options?) {
        options = this.getModelOpt(options);
        options.multimodel = true;
        options.frames = true;
        const modelatoms = Model3D.parseMolData(data, format, options);
        for (let i = 0; i < modelatoms.length; i++) {
            const newModel = new Model3D(this.models.length, options);
            newModel.setAtomDefaults(modelatoms[i]);
            newModel.addFrame(modelatoms[i]);
            newModel.setFrame(0);
            if (modelatoms.modelData)
                newModel.setModelData(modelatoms.modelData[i]);
            newModel.setDontDuplicateAtoms(!options.duplicateAssemblyAtoms);
            this.models.push(newModel);
        }
        return this.models;
    }
    public addModelsAsFrames(data, format: string, options?) {
        options = this.getModelOpt(options);
        options.multimodel = true;
        options.frames = true;
        const m = new Model3D(this.models.length, options);
        m.addMolData(data, format, options);
        this.models.push(m);
        return m;
    }
    public addAsOneMolecule(data, format: string, options?) {
        options = this.getModelOpt(options);
        options.multimodel = true;
        options.onemol = true;
        const m = new Model3D(this.models.length, options);
        m.addMolData(data, format, options);
        this.models.push(m);
        return m;
    }
    public removeModel(model?: Model3D | number) {
        model = this.getModel(model);
        if (!model)
            return;
        model.removegl(this.modelGroup);
        delete this.models[model.getID()];
        while (this.models.length > 0
            && typeof (this.models[this.models.length - 1]) === "undefined")
            this.models.pop();
        return this;
    }
    public removeAllModels() {
        for (let i = 0; i < this.models.length; i++) {
            const model = this.models[i];
            if (model) model.removegl(this.modelGroup);
        }
        this.models.splice(0, this.models.length); 
        return this;
    }
    public exportJSON(includeStyles: boolean, modelID: number) {
        const object: any = {};
        if (modelID === undefined) {
            object.m = this.models.map(function (model) {
                return model.toCDObject(includeStyles);
            });
        } else {
            object.m = [this.models[modelID].toCDObject()];
        }
        return JSON.stringify(object);
    }
    public exportVRML() {
        const savedmodelGroup = this.modelGroup;
        this.applyToModels("removegl", this.modelGroup); 
        this.modelGroup = new Object3D();
        this.render(null, { supportsImposters: false, supportsAIA: false, regen: true });
        const ret = '#VRML V2.0 utf8\n' + this.modelGroup.vrml() + '\n';
        this.applyToModels("removegl", this.modelGroup); 
        this.modelGroup = savedmodelGroup;
        return ret;
    }
    public createModelFrom(sel: AtomSelectionSpec, extract: boolean = false) {
        const m = new Model3D(this.models.length, this.defaultcolors);
        for (let i = 0; i < this.models.length; i++) {
            if (this.models[i]) {
                const atoms = this.models[i].selectedAtoms(sel);
                m.addAtoms(atoms);
                if (extract)
                    this.models[i].removeAtoms(atoms);
            }
        }
        this.models.push(m);
        return m;
    }
    private applyToModels(func: string, sel: any, value1?, value2?, value3?, value4?, value5?) {
        const ms = this.getModelList(sel);
        for (let i = 0; i < ms.length; i++) {
            ms[i][func](sel, value1, value2, value3, value4, value5);
        }
    }
    public setStyle(sel: AtomSelectionSpec, style: AtomStyleSpec);
    public setStyle(sel: AtomStyleSpec);
    public setStyle(sel: unknown, style?: unknown) {
        if (typeof (style) === 'undefined') {
            style = sel as AtomStyleSpec;
            sel = {};
        }
        this.applyToModels("setStyle", sel, style, false);
        return this;
    }
    public addStyle(sel: AtomSelectionSpec, style: AtomStyleSpec);
    public addStyle(sel: AtomStyleSpec);
    public addStyle(sel: unknown, style?: unknown) {
        if (typeof (style) === 'undefined') {
            style = sel;
            sel = {};
        }
        this.applyToModels("setStyle", sel, style, true);
        return this;
    }
    public setClickable(sel: AtomSelectionSpec, clickable: boolean, callback) {
        this.applyToModels("setClickable", sel, clickable, callback);
        return this;
    }
    public setHoverable(sel: AtomSelectionSpec, hoverable: boolean, hover_callback, unhover_callback) {
        this.applyToModels("setHoverable", sel, hoverable, hover_callback, unhover_callback);
        return this;
    }
    public enableContextMenu(sel: AtomSelectionSpec, contextMenuEnabled: boolean) {
        this.applyToModels("enableContextMenu", sel, contextMenuEnabled);
        return this;
    }
    public vibrate(numFrames: number, amplitude: number, bothways: boolean, arrowSpec: ArrowSpec) {
        this.applyToModels("vibrate", numFrames, amplitude, bothways, this, arrowSpec);
        return this;
    }
    public setColorByProperty(sel: AtomSelectionSpec, prop: string, scheme: Gradient | string, range) {
        this.applyToModels("setColorByProperty", sel, prop, scheme, range);
        return this;
    }
    public setColorByElement(sel: AtomSelectionSpec, colors) {
        this.applyToModels("setColorByElement", sel, colors);
        return this;
    }
    private static getAtomsWithin(atomlist: AtomSpec[], extent) {
        const ret = [];
        for (let i = 0; i < atomlist.length; i++) {
            const atom = atomlist[i];
            if (typeof (atom) == "undefined")
                continue;
            if (atom.x < extent[0][0] || atom.x > extent[1][0])
                continue;
            if (atom.y < extent[0][1] || atom.y > extent[1][1])
                continue;
            if (atom.z < extent[0][2] || atom.z > extent[1][2])
                continue;
            ret.push(atom);
        }
        return ret;
    }
    private static volume(extent) {
        const w = extent[1][0] - extent[0][0];
        const h = extent[1][1] - extent[0][1];
        const d = extent[1][2] - extent[0][2];
        return w * h * d;
    } 
    private carveUpExtent(extent, atomlist: AtomSpec[], atomstoshow: AtomSpec[]) {
        const ret = [];
        const index2atomlist = {}; 
        for (let i = 0, n = atomlist.length; i < n; i++) {
            index2atomlist[atomlist[i].index] = i;
        }
        const atomsToListIndex = function (atoms) {
            const ret = [];
            for (let i = 0, n = atoms.length; i < n; i++) {
                if (atoms[i].index in index2atomlist)
                    ret.push(index2atomlist[atoms[i].index]);
            }
            return ret;
        };
        const copyExtent = function (extent) {
            const ret = [];
            ret[0] = [extent[0][0], extent[0][1], extent[0][2]];
            ret[1] = [extent[1][0], extent[1][1], extent[1][2]];
            return ret;
        }; 
        const splitExtentR = function (extent) {
            if (ViewerDeMol.volume(extent) < ViewerDeMol.maxVolume) {
                return [extent];
            } else {
                const w = extent[1][0] - extent[0][0];
                const h = extent[1][1] - extent[0][1];
                const d = extent[1][2] - extent[0][2];
                let index;
                if (w > h && w > d) {
                    index = 0;
                } else if (h > w && h > d) {
                    index = 1;
                } else {
                    index = 2;
                }
                const a = copyExtent(extent);
                const b = copyExtent(extent);
                const mid = (extent[1][index] - extent[0][index]) / 2
                    + extent[0][index];
                a[1][index] = mid;
                b[0][index] = mid;
                const alist = splitExtentR(a);
                const blist = splitExtentR(b);
                return alist.concat(blist);
            }
        }; 
        const splits = splitExtentR(extent);
        const off = 6; 
        for (let i = 0, n = splits.length; i < n; i++) {
            const e = copyExtent(splits[i]);
            e[0][0] -= off;
            e[0][1] -= off;
            e[0][2] -= off;
            e[1][0] += off;
            e[1][1] += off;
            e[1][2] += off;
            const atoms = ViewerDeMol.getAtomsWithin(atomlist, e);
            const toshow = ViewerDeMol.getAtomsWithin(atomstoshow, splits[i]);
            ret.push({
                extent: splits[i],
                atoms: atomsToListIndex(atoms),
                toshow: atomsToListIndex(toshow)
            });
        }
        return ret;
    }
    private static generateSurfaceMesh(atoms: AtomSpec[], VandF, mat: MeshLambertMaterial) {
        const geo = new Geometry(true);
        const geoGroup = geo.updateGeoGroup(0);
        const colors = [];
        for (let i = 0, il = atoms.length; i < il; i++) {
            const atom = atoms[i];
            if (atom) {
                if (typeof (atom.surfaceColor) != "undefined") {
                    colors[i] = atom.surfaceColor;
                } else if (atom.color) 
                    colors[i] = CC.color(atom.color);
            }
        }
        const vertexArray = geoGroup.vertexArray;
        const v = VandF.vertices;
        for (let i = 0, il = v.length; i < il; i++) {
            const offset = geoGroup.vertices * 3;
            vertexArray[offset] = v[i].x;
            vertexArray[offset + 1] = v[i].y;
            vertexArray[offset + 2] = v[i].z;
            geoGroup.vertices++;
        }
        const colorArray = geoGroup.colorArray;
        const atomArray = geoGroup.atomArray;
        if (mat.voldata && mat.volscheme) {
            const scheme = mat.volscheme;
            const voldata = mat.voldata;
            const range = scheme.range() || [-1, 1];
            for (let i = 0, il = v.length; i < il; i++) {
                const A = v[i].atomid;
                const val = voldata.getVal(v[i].x, v[i].y, v[i].z);
                const col = CC.color(scheme.valueToHex(val, range));
                const offset = i * 3;
                colorArray[offset] = col.r;
                colorArray[offset + 1] = col.g;
                colorArray[offset + 2] = col.b;
                atomArray[i] = atoms[A];
            }
        }
        else if (colors.length > 0) { 
            for (let i = 0, il = v.length; i < il; i++) {
                const A = v[i].atomid;
                const offsetA = i * 3;
                colorArray[offsetA] = colors[A].r;
                colorArray[offsetA + 1] = colors[A].g;
                colorArray[offsetA + 2] = colors[A].b;
                atomArray[i] = atoms[A];
            }
        }
        const faces = VandF.faces;
        geoGroup.faceidx = faces.length;
        geo.initTypedArrays();
        const verts = geoGroup.vertexArray;
        const normalArray = geoGroup.normalArray;
        let vA, vB, vC, norm;
        for (let i = 0, il = faces.length; i < il; i += 3) {
            const a = faces[i], b = faces[i + 1], c = faces[i + 2];
            const offsetA = a * 3, offsetB = b * 3, offsetC = c * 3;
            vA = new Vector3(verts[offsetA], verts[offsetA + 1],
                verts[offsetA + 2]);
            vB = new Vector3(verts[offsetB], verts[offsetB + 1],
                verts[offsetB + 2]);
            vC = new Vector3(verts[offsetC], verts[offsetC + 1],
                verts[offsetC + 2]);
            vC.subVectors(vC, vB);
            vA.subVectors(vA, vB);
            vC.cross(vA);
            norm = vC;
            norm.normalize();
            normalArray[offsetA] += norm.x;
            normalArray[offsetB] += norm.x;
            normalArray[offsetC] += norm.x;
            normalArray[offsetA + 1] += norm.y;
            normalArray[offsetB + 1] += norm.y;
            normalArray[offsetC + 1] += norm.y;
            normalArray[offsetA + 2] += norm.z;
            normalArray[offsetB + 2] += norm.z;
            normalArray[offsetC + 2] += norm.z;
        }
        geoGroup.faceArray = new Uint16Array(faces);
        const mesh = new Mesh(geo, mat as Material);
        return mesh;
    }
    private static generateMeshSyncHelper(type: SurfaceType, expandedExtent,
        extendedAtoms: AtomSpec[], atomsToShow: AtomSpec[], atoms: AtomSpec[], vol: number) {
        const ps = new Surface3D();
        ps.initparm(expandedExtent, (type === 1) ? false : true, vol);
        ps.fillvoxels(atoms, extendedAtoms);
        ps.buildboundary();
        if (type == SurfaceType.SES || type == SurfaceType.MS) {
            ps.fastdistancemap();
            ps.boundingatom(false);
            ps.fillvoxelswaals(atoms, extendedAtoms);
        }
        ps.marchingcube(type);
        return ps.getFacesAndVertices(atomsToShow);
    }
    private static getMatWithStyle(style: SurfaceStyleSpec) {
        let mat = null;
        if (style.onesided) {
            mat = new MeshLambertMaterial();
        } else {
            mat = new MeshDoubleLambertMaterial();
        }
        mat.vertexColors = Coloring.VertexColors;
        for (const prop in style) {
            if (prop === "color" || prop === "map") {
            } else if (style.hasOwnProperty(prop))
                mat[prop] = style[prop];
        }
        if (style.opacity !== undefined) {
            if (style.opacity === 1)
                mat.transparent = false;
            else
                mat.transparent = true;
        }
        return mat;
    }
    public addMesh(mesh: Mesh) {
        const surfobj = {
            geo: mesh.geometry,
            mat: mesh.material,
            done: true,
            finished: false 
        };
        const surfid = this.nextSurfID();
        this.surfaces[surfid] = [surfobj];
        return surfid;
    }
    private static shallowCopy(l) {
        const ret = [];
        const length = l.length;
        for (let i = 0; i < length; i++) {
            ret[i] = extend({}, l[i]);
        }
        return ret;
    }
    public addSurface(stype: SurfaceType | string, style: SurfaceStyleSpec = {}, atomsel: AtomSelectionSpec = {},
        allsel?: AtomSelectionSpec, focus?: AtomSelectionSpec, surfacecallback?) {
        const surfid = this.nextSurfID();
        let mat = null;
        const self = this;
        let type: SurfaceType | 0 = SurfaceType.VDW;
        if (typeof stype == "string") {
            if (ViewerDeMol.surfaceTypeMap[stype.toUpperCase()] !== undefined)
                type = ViewerDeMol.surfaceTypeMap[stype];
            else {
                console.log("Surface type : " + stype + " is not recognized");
            }
        } else if (typeof stype == "number") {
            type = stype;
        }
        let atomlist = null, focusSele = null;
        const atomsToShow = ViewerDeMol.shallowCopy(this.getAtomsFromSel(atomsel));
        if (!allsel) {
            atomlist = atomsToShow;
        }
        else {
            atomlist = ViewerDeMol.shallowCopy(this.getAtomsFromSel(allsel));
        }
        adjustVolumeStyle(style);
        let symmetries = false;
        let n;
        for (n = 0; n < this.models.length; n++) {
            if (this.models[n]) {
                const symMatrices = this.models[n].getSymmetries();
                if (symMatrices.length > 1 || (symMatrices.length == 1 && !(symMatrices[0].isIdentity()))) {
                    symmetries = true;
                    break;
                }
            }
        }
        const addSurfaceHelper = function addSurfaceHelper(surfobj, atomlist: AtomSpec[], atomsToShow: AtomSpec[]) {
            if (!focus) {
                focusSele = atomsToShow;
            } else {
                focusSele = ViewerDeMol.shallowCopy(self.getAtomsFromSel(focus));
            }
            let atom;
            const extent = getExtent(atomsToShow, true);
            if (style.map && style.map.prop) {
                const prop = style.map.prop;
                const scheme = getGradient(style.map.scheme || style.map.gradient || new Gradient.RWB());
                let range = scheme.range();
                if (!range) {
                    range = getPropertyRange(atomsToShow, prop);
                }
                style.colorscheme = { prop: prop as string, gradient: scheme };
            }
            for (let i = 0, il = atomlist.length; i < il; i++) {
                atom = atomlist[i];
                atom.surfaceColor = getColorFromStyle(atom, style);
            }
            const totalVol = ViewerDeMol.volume(extent); 
            const extents = self.carveUpExtent(extent, atomlist, atomsToShow);
            if (focusSele && focusSele.length && focusSele.length > 0) {
                const seleExtent = getExtent(focusSele, true);
                const sortFunc = function (a, b) {
                    const distSq = function (ex, sele) {
                        const e = ex.extent;
                        const x = e[1][0] - e[0][0];
                        const y = e[1][1] - e[0][1];
                        const z = e[1][2] - e[0][2];
                        let dx = (x - sele[2][0]);
                        dx *= dx;
                        let dy = (y - sele[2][1]);
                        dy *= dy;
                        let dz = (z - sele[2][2]);
                        dz *= dz;
                        return dx + dy + dz;
                    };
                    const d1 = distSq(a, seleExtent);
                    const d2 = distSq(b, seleExtent);
                    return d1 - d2;
                };
                extents.sort(sortFunc);
            }
            const reducedAtoms = [];
            for (let i = 0, il = atomlist.length; i < il; i++) {
                atom = atomlist[i];
                reducedAtoms[i] = {
                    x: atom.x,
                    y: atom.y,
                    z: atom.z,
                    serial: i,
                    elem: atom.elem
                };
            }
            const sync = !!(syncSurface);
            if (sync) { 
                const callSyncHelper = function callSyncHelper(i) {
                    return new Promise<void>(function (resolve) {
                        let VandF = ViewerDeMol.generateMeshSyncHelper(type as SurfaceType, extents[i].extent,
                            extents[i].atoms, extents[i].toshow, reducedAtoms,
                            totalVol);
                        const VandFs = splitMesh({ vertexArr: VandF.vertices, faceArr: VandF.faces });
                        for (let vi = 0, vl = VandFs.length; vi < vl; vi++) {
                            VandF = {
                                vertices: VandFs[vi].vertexArr,
                                faces: VandFs[vi].faceArr
                            };
                            const mesh = ViewerDeMol.generateSurfaceMesh(atomlist, VandF, mat);
                            mergeGeos(surfobj.geo, mesh);
                        }
                        self.render();
                        resolve();
                    });
                };
                const promises = [];
                for (let i = 0; i < extents.length; i++) {
                    promises.push(callSyncHelper(i));
                }
                return Promise.all(promises)
                    .then(function () {
                        surfobj.done = true;
                        return Promise.resolve(surfid);
                    });
            } else { 
                const workers = [];
                if (type < 0)
                    type = 0; 
                for (let i = 0, il = ViewerDeMol.numWorkers; i < il; i++) {
                    const w = new Worker($DeMol.SurfaceWorker);
                    workers.push(w);
                    w.postMessage({
                        'type': -1,
                        'atoms': reducedAtoms,
                        'volume': totalVol
                    });
                }
                return new Promise(function (resolve, reject) {
                    let cnt = 0;
                    const releaseMemory = function () {
                        if (!workers || !workers.length) return;
                        workers.forEach(function (worker) {
                            if (worker && worker.terminate) {
                                worker.terminate();
                            }
                        });
                    };
                    const rfunction = function (event) {
                        const VandFs = splitMesh({
                            vertexArr: event.data.vertices,
                            faceArr: event.data.faces
                        });
                        for (let i = 0, vl = VandFs.length; i < vl; i++) {
                            const VandF = {
                                vertices: VandFs[i].vertexArr,
                                faces: VandFs[i].faceArr
                            };
                            const mesh = ViewerDeMol.generateSurfaceMesh(atomlist, VandF, mat);
                            mergeGeos(surfobj.geo, mesh);
                        }
                        self.render();
                        cnt++;
                        if (cnt == extents.length) {
                            surfobj.done = true;
                            releaseMemory();
                            resolve(surfid); 
                        }
                    };
                    const efunction = function (event) {
                        releaseMemory();
                        console.log(event.message + " (" + event.filename + ":" + event.lineno + ")");
                        reject(event);
                    };
                    for (let i = 0; i < extents.length; i++) {
                        const worker = workers[i % workers.length];
                        worker.onmessage = rfunction;
                        worker.onerror = efunction;
                        worker.postMessage({
                            'type': type,
                            'expandedExtent': extents[i].extent,
                            'extendedAtoms': extents[i].atoms,
                            'atomsToShow': extents[i].toshow
                        });
                    }
                });
            }
        };
        style = style || {};
        mat = ViewerDeMol.getMatWithStyle(style);
        const surfobj: any = [];
        surfobj.style = style;
        surfobj.atomsel = atomsel;
        surfobj.allsel = allsel;
        surfobj.focus = focus;
        let promise = null;
        if (symmetries) { 
            const modelsAtomList = {};
            const modelsAtomsToShow = {};
            for (n = 0; n < this.models.length; n++) {
                modelsAtomList[n] = [];
                modelsAtomsToShow[n] = [];
            }
            for (n = 0; n < atomlist.length; n++) {
                modelsAtomList[atomlist[n].model].push(atomlist[n]);
            }
            for (n = 0; n < atomsToShow.length; n++) {
                modelsAtomsToShow[atomsToShow[n].model].push(atomsToShow[n]);
            }
            const promises = [];
            for (n = 0; n < this.models.length; n++) {
                if (modelsAtomsToShow[n].length > 0) {
                    surfobj.push({
                        geo: new Geometry(true),
                        mat: mat,
                        done: false,
                        finished: false,
                        symmetries: this.models[n].getSymmetries()
                    });
                    promises.push(addSurfaceHelper(surfobj[surfobj.length - 1], modelsAtomList[n], modelsAtomsToShow[n]));
                }
            }
            promise = Promise.all(promises);
        }
        else {
            surfobj.push({
                geo: new Geometry(true),
                mat: mat,
                done: false,
                finished: false,
                symmetries: [new Matrix4()]
            });
            promise = addSurfaceHelper(surfobj[surfobj.length - 1], atomlist, atomsToShow);
        }
        this.surfaces[surfid] = surfobj;
        promise.surfid = surfid;
        if (surfacecallback && typeof (surfacecallback) == "function") {
            promise.then(function (surfid) {
                surfacecallback(surfid);
            });
            return surfid;
        }
        else {
            return promise;
        }
    }
    public setSurfaceMaterialStyle(surf: number, style: SurfaceStyleSpec) {
        adjustVolumeStyle(style);
        if (this.surfaces[surf]) {
            const surfArr = this.surfaces[surf];
            for (let i = 0; i < surfArr.length; i++) {
                const mat = surfArr[i].mat = ViewerDeMol.getMatWithStyle(style);
                surfArr[i].mat.side = FrontSide;
                if (style.color) {
                    surfArr[i].mat.color = CC.color(style.color);
                    surfArr[i].geo.colorsNeedUpdate = true;
                    const c = CC.color(style.color);
                    surfArr[i].geo.setColor(c);
                }
                else if (mat.voldata && mat.volscheme) {
                    const scheme = mat.volscheme;
                    const voldata = mat.voldata;
                    const cc = CC;
                    const range = scheme.range() || [-1, 1];
                    surfArr[i].geo.setColors(function (x, y, z) {
                        const val = voldata.getVal(x, y, z);
                        const col = cc.color(scheme.valueToHex(val, range));
                        return col;
                    });
                } else {
                    surfArr[i].geo.colorsNeedUpdate = true;
                    for(const geo of  surfArr[i].geo.geometryGroups ) {
                        for(let j = 0; j < geo.vertices; j++) {
                            const c = getColorFromStyle(geo.atomArray[j],style);
                            const off = 3*j;
                            geo.colorArray[off] = c.r;
                            geo.colorArray[off+1] = c.g;
                            geo.colorArray[off+2] = c.b;
                        }
                    }
                }
                surfArr[i].finished = false; 
            }
        }
        return this;
    }
    public getSurface(surf: number) {
        return this.surfaces[surf];
    }
    public removeSurface(surf: number) {
        const surfArr = this.surfaces[surf];
        for (let i = 0; i < surfArr.length; i++) {
            if (surfArr[i] && surfArr[i].lastGL) {
                if (surfArr[i].geo !== undefined)
                    surfArr[i].geo.dispose();
                if (surfArr[i].mat !== undefined)
                    surfArr[i].mat.dispose();
                this.modelGroup.remove(surfArr[i].lastGL); 
            }
        }
        delete this.surfaces[surf];
        this.show();
        return this;
    }
    public removeAllSurfaces() {
        for (const n in this.surfaces) {
            if (!this.surfaces.hasOwnProperty(n)) continue;
            const surfArr = this.surfaces[n];
            for (let i = 0; i < surfArr.length; i++) {
                if (surfArr[i] && surfArr[i].lastGL) {
                    if (surfArr[i].geo !== undefined)
                        surfArr[i].geo.dispose();
                    if (surfArr[i].mat !== undefined)
                        surfArr[i].mat.dispose();
                    this.modelGroup.remove(surfArr[i].lastGL); 
                }
            }
            delete this.surfaces[n];
        }
        this.show();
        return this;
    }
    public jmolMoveTo() {
        const pos = this.modelGroup.position;
        let ret = "center { " + (-pos.x) + " " + (-pos.y) + " " + (-pos.z)
            + " }; ";
        const q = this.rotationGroup.quaternion;
        ret += "moveto .5 quaternion { " + q.x + " " + q.y + " " + q.z
            + " " + q.w + " };";
        return ret;
    }
    public clear() {
        this.removeAllSurfaces();
        this.removeAllModels();
        this.removeAllLabels();
        this.removeAllShapes();
        this.show();
        return this;
    }
    public mapAtomProperties(props, sel: AtomSelectionSpec) {
        sel = sel || {};
        const atoms = this.getAtomsFromSel(sel);
        if (typeof (props) == "function") {
            for (let a = 0, numa = atoms.length; a < numa; a++) {
                const atom = atoms[a];
                props(atom);
            }
        }
        else {
            for (let a = 0, numa = atoms.length; a < numa; a++) {
                const atom = atoms[a];
                for (let i = 0, n = props.length; i < n; i++) {
                    const prop = props[i];
                    if (prop.props) {
                        for (const p in prop.props) {
                            if (prop.props.hasOwnProperty(p)) {
                                if (this.atomIsSelected(atom, prop)) {
                                    if (!atom.properties)
                                        atom.properties = {};
                                    atom.properties[p] = prop.props[p];
                                }
                            }
                        }
                    }
                }
            }
        }
        return this;
    }
    public linkViewer(otherviewer: ViewerDeMol) {
        this.linkedViewers.push(otherviewer);
        return this;
    }
    public getPerceivedDistance() {
        return this.CAMERA_Z - this.rotationGroup.position.z;
    }
    public setPerceivedDistance(dist: number) {
        this.rotationGroup.position.z = this.CAMERA_Z - dist;
    }
    public setAutoEyeSeparation(isright: boolean, x: number) {
        const dist = this.getPerceivedDistance();
        if (!x) x = 5.0;
        if (isright || this.camera.position.x > 0) 
            this.camera.position.x = dist * Math.tan(Math.PI / 180.0 * x);
        else
            this.camera.position.x = -dist * Math.tan(Math.PI / 180.0 * x);
        this.camera.lookAt(new Vector3(0, 0, this.rotationGroup.position.z));
        return this.camera.position.x;
    }
    public setDefaultCartoonQuality(val: number) {
        this.config.cartoonQuality = val;
    }
}
export function createViewer(element, config?: ViewerSpec) {
    element = getElement(element);
    if (!element) return;
    config = config || {};
    try {
        const viewer = new ViewerDeMol(element, config);
        return viewer;
    }
    catch (e) {
        throw "error creating viewer: " + e;
    }
}
export function createViewerGrid(element, config: ViewerGridSpec = {}, viewer_config: ViewerSpec = {}) {
    element = getElement(element);
    if (!element) return;
    const viewers = [];
    const canvas = document.createElement('canvas');
    viewer_config.rows = config.rows;
    viewer_config.cols = config.cols;
    viewer_config.control_all = config.control_all != undefined ? config.control_all : false;
    element.appendChild(canvas);
    try {
        for (let r = 0; r < config.rows; r++) {
            const row = [];
            for (let c = 0; c < config.cols; c++) {
                viewer_config.row = r;
                viewer_config.col = c;
                viewer_config.canvas = canvas;
                viewer_config.viewers = viewers;
                viewer_config.control_all = config.control_all;
                const viewer = createViewer(element, extend({}, viewer_config));
                row.push(viewer);
            }
            viewers.unshift(row); 
        }
    } catch (e) {
        throw "error creating viewer grid: " + e;
    }
    return viewers;
}
export function createStereoViewer(element) {
    const that = this;
    element = getElement(element);
    if (!element) return;
    const viewers = createViewerGrid(element, { rows: 1, cols: 2, control_all: true });
    this.glviewer1 = viewers[0][0];
    this.glviewer2 = viewers[0][1];
    this.glviewer1.setAutoEyeSeparation(false);
    this.glviewer2.setAutoEyeSeparation(true);
    this.glviewer1.linkViewer(this.glviewer2);
    this.glviewer2.linkViewer(this.glviewer1);
    const methods = Object.getOwnPropertyNames(this.glviewer1.__proto__) 
        .filter(function (property) {
            return typeof that.glviewer1[property] == 'function';
        });
    for (let i = 0; i < methods.length; i++) { 
        this[methods[i]] = (function (method) {
            return function () {
                const m1 = this.glviewer1[method].apply(this.glviewer1, arguments);
                const m2 = this.glviewer2[method].apply(this.glviewer2, arguments);
                return [m1, m2];
            };
        })(methods[i]);
    }
    this.setCoordinates = function (models, data, format) { 
        for (let i = 0; i < models.length; i++) {
            models[i].setCoordinates(data, format);
        }
    };
    this.surfacesFinished = function () {
        return this.glviewer1.surfacesFinished() && this.glviewer2.surfacesFinished();
    };
    this.isAnimated = function () {
        return this.glviewer1.isAnimated() || this.glviewer2.isAnimated();
    };
    this.render = function (callback) {
        this.glviewer1.render();
        this.glviewer2.render();
        if (callback) {
            callback(this); 
        }
    };
    this.getCanvas = function () {
        return this.glviewer1.getCanvas(); 
    };
}
export interface OutlineStyle {
    width?: number;
    color?: ColorSpec;
    maxpixels?: number;
}
export interface AmbientOcclusionStyle {
    strength?: number;
    radius?: number;
}
export interface ViewStyle  {
    style?: string;
    strength?: number;
    radius?: number;
    width?: number;
    color?: ColorSpec;    
}
export interface ViewerSpec {
    callback?: (viewer: ViewerSpec) => void;
    defaultcolors?: Record<string, ColorSpec>;
    nomouse?: boolean | string;
    backgroundColor?: string;
    backgroundAlpha?: number;
    camerax?: number|string;
    hoverDuration?: number;
    id?: string;
    cartoonQuality?: number;
    row?: number;
    col?: number;
    rows?: number;
    cols?: number;
    canvas?: HTMLCanvasElement;
    viewers?: ViewerDeMol[];
    minimumZoomToDistance?: number;
    lowerZoomLimit?: number;
    upperZoomLimit?: number;
    antialias?: boolean;
    control_all?: boolean;
    orthographic?: boolean;
    disableFog?: boolean;
    style?: string;
    outline?: OutlineStyle;
    ambientOcclusion?: AmbientOcclusionStyle;
}
export interface ViewerGridSpec {
    rows?: number;
    cols?: number;
    control_all?: boolean;
}
export interface SurfaceStyleSpec {
    onesided?: boolean;
    opacity?: number;
    colorscheme?: ColorschemeSpec;
    color?: ColorSpec;
    voldata?: VolumeRender;
    volscheme?: Gradient;
    volformat?: string;
    map?: Record<string, unknown>
}
export interface UnitCellStyleSpec {
    box?: LineStyleSpec;
    astyle?: ArrowSpec;
    bstyle?: ArrowSpec;
    cstyle?: ArrowSpec;
    alabel?: string;
    alabelstyle?: LabelSpec;
    blabel?: string;
    blabelstyle?: LabelSpec;
    clabel?: string;
    clabelstyle?: LabelSpec;
}
