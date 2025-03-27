import { Sphere } from "./WebGL/shapes";
import { Vector3, Matrix4, XYZ } from "./WebGL/math";
import { VolumetricMaterial, Mesh, Texture, Object3D, Material } from "./WebGL";
import { CC } from "./colors";
import { Shape3D } from "./Shape3D";
import { AtomSelectionSpec } from "specs";
import { Viewer3D } from "Viewer3D";
export interface VolumetricRendererSpec {
    transferfn?: { color: unknown; opacity: unknown; value: unknown }[];
    subsamples?: number;
    coords?: XYZ[];
    selection?: AtomSelectionSpec;
    seldist?: number; 
}
export class GLVolumetricRender {
    static interpolateArray(data: string | any[], fitCount: number) {
        function linearInterpolate(before: number, after: number, atPoint: number) {
            return before + (after - before) * atPoint;
        }
        const newData = [];
        const springFactor = (data.length - 1) / (fitCount - 1);
        newData[0] = data[0]; 
        for (let i = 1; i < fitCount - 1; i++) {
            const tmp = i * springFactor;
            const before = Math.floor(tmp);
            const after = Math.ceil(tmp);
            const atPoint = tmp - before;
            newData[i] = linearInterpolate(data[before], data[after], atPoint);
        }
        newData[fitCount - 1] = data[data.length - 1]; 
        return newData;
    }
    hidden = false;
    boundingSphere = new Sphere();
    shapePosition: any;
    renderedShapeObj: any = null;
    shapeObj: any = null;
    geo: any;
    subsamples = 5.0;
    data: any = null;
    transferfunctionbuffer: any = [];
    min: number = 0;
    max: number = 0;
    extent: any;
    maxdepth: number;
    texmatrix: any;
    minunit: any;
    constructor(data: { matrix: { elements: any; }; size: XYZ; 
                unit: XYZ; origin: XYZ; data: number[]; getIndex: (arg0: number, arg1: number, arg2: number) => number; }, 
        spec: VolumetricRendererSpec, viewer?: Viewer3D) {
        spec = spec || {};
        const transferfn = Object.assign([], spec.transferfn);
        this.subsamples = spec.subsamples || 5.0;
        const TRANSFER_BUFFER_SIZE = 256;
        transferfn.forEach(function (a: { value: any; }) { a.value = parseFloat(a.value); });
        transferfn.sort(function (a: { value: number; }, b: { value: number; }) { return a.value - b.value; });
        this.min = transferfn[0].value;
        if (transferfn.length == 0) transferfn.push(transferfn[0]); 
        this.max = transferfn[transferfn.length - 1].value;
        let pos1, pos2, color1, color2, R, G, B, A, alpha1, alpha2;
        for (let i = 0; i < transferfn.length - 1; i++) {
            color1 = CC.color(transferfn[i].color);
            color2 = CC.color(transferfn[i + 1].color);
            alpha1 = transferfn[i].opacity;
            alpha2 = transferfn[i + 1].opacity;
            pos1 = Math.floor((transferfn[i].value - this.min) * TRANSFER_BUFFER_SIZE / (this.max - this.min));
            pos2 = Math.floor((transferfn[i + 1].value - this.min) * TRANSFER_BUFFER_SIZE / (this.max - this.min));
            if (pos1 == pos2)
                continue;
            R = GLVolumetricRender.interpolateArray([color1.r * 255, color2.r * 255], pos2 - pos1);
            G = GLVolumetricRender.interpolateArray([color1.g * 255, color2.g * 255], pos2 - pos1);
            B = GLVolumetricRender.interpolateArray([color1.b * 255, color2.b * 255], pos2 - pos1);
            A = GLVolumetricRender.interpolateArray([alpha1 * 255, alpha2 * 255], pos2 - pos1);
            for (let j = 0; j < R.length; j++) {
                this.transferfunctionbuffer.push(R[j]);
                this.transferfunctionbuffer.push(G[j]);
                this.transferfunctionbuffer.push(B[j]);
                this.transferfunctionbuffer.push(A[j]); 
            }
        }
        this.transferfunctionbuffer = new Uint8ClampedArray(this.transferfunctionbuffer);
        if (data.matrix) {
            const start = new Vector3(0, 0, 0);
            const end = new Vector3(data.size.x, data.size.y, data.size.z);
            const unit = new Vector3(1, 1, 1);
            start.applyMatrix4(data.matrix);
            end.applyMatrix4(data.matrix);
            unit.applyMatrix4(data.matrix).sub(start);
            this.extent = [[start.x, start.y, start.z], [end.x, end.y, end.z]];
            for (let i = 1; i < 7; i++) {
                end.x = (i & 1) ? data.size.x : 0;
                end.y = (i & 2) ? data.size.y : 0;
                end.z = (i & 4) ? data.size.z : 0;
                end.applyMatrix4(data.matrix);
                this.extent[0][0] = Math.min(this.extent[0][0], end.x);
                this.extent[0][1] = Math.min(this.extent[0][1], end.y);
                this.extent[0][2] = Math.min(this.extent[0][2], end.z);
                this.extent[1][0] = Math.max(this.extent[1][0], end.x);
                this.extent[1][1] = Math.max(this.extent[1][1], end.y);
                this.extent[1][2] = Math.max(this.extent[1][2], end.z);
            }
            const xoff = end.x - start.x;
            const yoff = end.y - start.y;
            const zoff = end.z - start.z;
            this.maxdepth = Math.sqrt(xoff * xoff + yoff * yoff + zoff * zoff);
            this.minunit = Math.min(Math.min(unit.x, unit.y), unit.z);
            this.texmatrix = new Matrix4().identity().scale({ x: data.size.x, y: data.size.y, z: data.size.z });
            this.texmatrix = this.texmatrix.multiplyMatrices(data.matrix, this.texmatrix);
            this.texmatrix = this.texmatrix.getInverse(this.texmatrix);
        } else {
            this.texmatrix = new Matrix4().identity();
            const xoff = data.unit.x * data.size.x;
            const yoff = data.unit.y * data.size.y;
            const zoff = data.unit.z * data.size.z;
            this.texmatrix.makeTranslation(-data.origin.x / xoff, -data.origin.y / yoff, -data.origin.z / zoff);
            this.texmatrix.scale({ x: 1.0 / xoff, y: 1.0 / yoff, z: 1.0 / zoff });
            this.minunit = Math.min(Math.min(data.unit.x, data.unit.y), data.unit.z);
            this.extent = [[data.origin.x, data.origin.y, data.origin.z],
            [data.origin.x + xoff, data.origin.y + yoff, data.origin.z + zoff]];
            this.maxdepth = Math.sqrt(xoff * xoff + yoff * yoff + zoff * zoff);
        }
        const shape = new Shape3D({});
        shape.addBox({
            corner: { x: this.extent[0][0], y: this.extent[0][1], z: this.extent[0][2] },
            dimensions: {
                w: this.extent[1][0] - this.extent[0][0],
                h: this.extent[1][1] - this.extent[0][1],
                d: this.extent[1][2] - this.extent[0][2]
            }
        });
        this.geo = shape.finalize();
        this.boundingSphere.center = new Vector3(
            (this.extent[0][0] + this.extent[1][0]) / 2.0,
            (this.extent[0][1] + this.extent[1][1]) / 2.0,
            (this.extent[0][2] + this.extent[1][2]) / 2.0
        );
        this.boundingSphere.radius = this.maxdepth / 2;
        if (spec.coords === undefined && spec.selection !== undefined) {
            if(viewer) {
                spec.coords = viewer.selectedAtoms(spec.selection) as XYZ[];
            } else {
                console.log('Need to provide viewer to volumetric renderer if selection specified.');
            }
        }
        if (spec.coords !== undefined && spec.seldist !== undefined) {
            const mask = new Uint8Array(data.data.length);
            const d = spec.seldist;
            const d2 = d * d;
            for (let i = 0, n = spec.coords.length; i < n; i++) {
                const c = spec.coords[i];
                const minx = c.x - d, miny = c.y - d, minz = c.z - d;
                const maxx = c.x + d, maxy = c.y + d, maxz = c.z + d;
                if (data.getIndex(minx, miny, minz) >= 0 || data.getIndex(maxx, maxy, maxz) >= 0) {
                    for (let x = minx; x < maxx; x += this.minunit) {
                        for (let y = miny; y < maxy; y += this.minunit) {
                            for (let z = minz; z < maxz; z += this.minunit) {
                                const idx = data.getIndex(x, y, z);
                                if (idx >= 0 && !mask[idx]) {
                                    const distsq = (x - c.x) * (x - c.x) + (y - c.y) * (y - c.y) + (z - c.z) * (z - c.z);
                                    if (distsq < d2) {
                                        mask[idx] = 1;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            for (let i = 0, n = data.data.length; i < n; i++) {
                if (mask[i] == 0) data.data[i] = Infinity;
            }
        }
        this.data = data;
    }
    globj(group: { remove: (arg0: any) => void; add: (arg0: any) => void; }) {
        if (this.renderedShapeObj) {
            group.remove(this.renderedShapeObj);
            this.renderedShapeObj = null;
        }
        if (this.hidden)
            return;
        this.shapeObj = new Object3D();
        let material = null;
        const texture = new Texture(this.data, true);
        const transfertexture = new Texture(this.transferfunctionbuffer, false);
        texture.needsUpdate = true;
        transfertexture.needsUpdate = true;
        transfertexture.flipY = false;
        material = new VolumetricMaterial({
            transferfn: transfertexture,
            transfermin: this.min,
            transfermax: this.max,
            map: texture,
            extent: this.extent,
            maxdepth: this.maxdepth,
            texmatrix: this.texmatrix,
            unit: this.minunit,
            subsamples: this.subsamples,
        });
        const mesh = new Mesh(this.geo, (material as Material));
        this.shapeObj.add(mesh);
        this.renderedShapeObj = this.shapeObj.clone();
        group.add(this.renderedShapeObj);
    }
    removegl(group: { remove: (arg0: any) => void; }) {
        if (this.renderedShapeObj) {
            if (this.renderedShapeObj.geometry !== undefined)
                this.renderedShapeObj.geometry.dispose();
            if (this.renderedShapeObj.material !== undefined)
                this.renderedShapeObj.material.dispose();
            group.remove(this.renderedShapeObj);
            this.renderedShapeObj = null;
        }
        this.shapeObj = null;
    }
    get position() {
        return this.boundingSphere.center;
    }
    get x() {
        return this.boundingSphere.center.x;
    }
    get y() {
        return this.boundingSphere.center.y;
    }
    get z() {
        return this.boundingSphere.center.z;
    }
}
