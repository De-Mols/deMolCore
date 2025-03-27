import { Geometry, Material } from "./WebGL";
import { Sphere, Cylinder, Triangle } from "./WebGL/shapes";
import { Vector3, XYZ } from "./WebGL/math";
import { clamp } from "./WebGL/math";
import { DoubleSide } from "./WebGL";
import { Color, CC, ColorSpec, Colored } from "./colors";
import { MarchingCube } from "./Surface3D4";
import { VolumeRender } from "./VolumeRender";
import { MeshDoubleLambertMaterial, MeshLambertMaterial, Object3D, Coloring, Mesh, LineBasicMaterial, Line, LineStyle } from "./WebGL";
import { CAP, GLDraw } from "./GLDraw"
import { subdivide_spline } from "./glcartoon";
import { adjustVolumeStyle, extend, Func, makeFunction } from "./utilities";
import { GradientType } from "./Gradient";
import { AtomSelectionSpec } from "specs";
import { Viewer3D } from "Viewer3D";
export class ShapeDeMol {
    private static ISDONE = 2;
    private static finalizeGeo(geo) {
        const geoGroup = geo.updateGeoGroup(0);
        if (geoGroup.vertices > 0) {
            geoGroup.truncateArrayBuffers(true, true);
        }
    }
    static updateColor(geo: Geometry, color) {
        color = color || CC.color(color);
        geo.colorsNeedUpdate = true;
        let r, g, b;
        if (color.constructor !== Array) {
            r = color.r;
            g = color.g;
            b = color.b;
        }
        for (const gg in geo.geometryGroups) {
            const geoGroup = geo.geometryGroups[gg];
            const colorArr = geoGroup.colorArray;
            for (let i = 0, il = geoGroup.vertices; i < il; ++i) {
                if (color.constructor === Array) {
                    const c = color[i];
                    r = c.r;
                    g = c.g;
                    b = c.b;
                }
                colorArr[i * 3] = r;
                colorArr[i * 3 + 1] = g;
                colorArr[i * 3 + 2] = b;
            }
        }
    }
    static drawArrow(shape: ShapeDeMol, geo: Geometry, spec: ArrowSpec) {
        let from = spec.start, end = spec.end, radius = spec.radius,
            radiusRatio = spec.radiusRatio, mid = spec.mid, midoffset = spec.midpos;
        if (!(from && end))
            return;
        const geoGroup = geo.updateGeoGroup(51);
        const dir = new Vector3(end.x, end.y, end.z).sub(from);
        if (midoffset) { 
            const length = dir.length();
            if (midoffset > 0) mid = midoffset / length;
            else mid = (length + midoffset) / length;
        }
        dir.multiplyScalar(mid);
        const to = new Vector3(from.x, from.y, from.z).add(dir);
        const negDir = dir.clone().negate();
        const fromv = new Vector3(from.x, from.y, from.z);
        shape.intersectionShape.cylinder.push(new Cylinder(fromv, to.clone(), radius));
        shape.intersectionShape.sphere.push(new Sphere(fromv, radius));
        const nvecs = [];
        nvecs[0] = dir.clone();
        if (Math.abs(nvecs[0].x) > 0.0001)
            nvecs[0].y += 1;
        else
            nvecs[0].x += 1;
        nvecs[0].cross(dir);
        nvecs[0].normalize();
        nvecs[4] = nvecs[0].clone();
        nvecs[4].crossVectors(nvecs[0], dir);
        nvecs[4].normalize();
        nvecs[8] = nvecs[0].clone().negate();
        nvecs[12] = nvecs[4].clone().negate();
        nvecs[2] = nvecs[0].clone().add(nvecs[4]).normalize();
        nvecs[6] = nvecs[4].clone().add(nvecs[8]).normalize();
        nvecs[10] = nvecs[8].clone().add(nvecs[12]).normalize();
        nvecs[14] = nvecs[12].clone().add(nvecs[0]).normalize();
        nvecs[1] = nvecs[0].clone().add(nvecs[2]).normalize();
        nvecs[3] = nvecs[2].clone().add(nvecs[4]).normalize();
        nvecs[5] = nvecs[4].clone().add(nvecs[6]).normalize();
        nvecs[7] = nvecs[6].clone().add(nvecs[8]).normalize();
        nvecs[9] = nvecs[8].clone().add(nvecs[10]).normalize();
        nvecs[11] = nvecs[10].clone().add(nvecs[12]).normalize();
        nvecs[13] = nvecs[12].clone().add(nvecs[14]).normalize();
        nvecs[15] = nvecs[14].clone().add(nvecs[0]).normalize();
        const start = geoGroup.vertices;
        const vertexArray = geoGroup.vertexArray;
        const faceArray = geoGroup.faceArray;
        const normalArray = geoGroup.normalArray;
        const lineArray = geoGroup.lineArray;
        let offset, i, n;
        for (i = 0, n = nvecs.length; i < n; ++i) {
            offset = 3 * (start + 3 * i);
            const bottom = nvecs[i].clone().multiplyScalar(radius).add(from);
            const top = nvecs[i].clone().multiplyScalar(radius).add(to);
            const conebase = nvecs[i].clone()
                .multiplyScalar(radius * radiusRatio).add(to);
            vertexArray[offset] = bottom.x;
            vertexArray[offset + 1] = bottom.y;
            vertexArray[offset + 2] = bottom.z;
            vertexArray[offset + 3] = top.x;
            vertexArray[offset + 4] = top.y;
            vertexArray[offset + 5] = top.z;
            vertexArray[offset + 6] = conebase.x;
            vertexArray[offset + 7] = conebase.y;
            vertexArray[offset + 8] = conebase.z;
            if (i > 0) {
                const prev_x = vertexArray[offset - 3];
                const prev_y = vertexArray[offset - 2];
                const prev_z = vertexArray[offset - 1];
                const c = new Vector3(prev_x, prev_y, prev_z);
                const b = new Vector3(end.x, end.y, end.z), b2 = to.clone();
                const a = new Vector3(conebase.x, conebase.y, conebase.z);
                shape.intersectionShape.triangle.push(new Triangle(a, b, c));
                shape.intersectionShape.triangle.push(new Triangle(c.clone(), b2, a.clone()));
            }
        }
        geoGroup.vertices += 48;
        offset = geoGroup.vertices * 3;
        vertexArray[offset] = from.x;
        vertexArray[offset + 1] = from.y;
        vertexArray[offset + 2] = from.z;
        vertexArray[offset + 3] = to.x;
        vertexArray[offset + 4] = to.y;
        vertexArray[offset + 5] = to.z;
        vertexArray[offset + 6] = end.x;
        vertexArray[offset + 7] = end.y;
        vertexArray[offset + 8] = end.z;
        geoGroup.vertices += 3;
        let face, faceoffset, lineoffset;
        let t1, t2, t2b, t3, t3b, t4, t1offset, t2offset, t2boffset, t3offset, t3boffset, t4offset;
        let n1, n2, n3, n4;
        const fromi = geoGroup.vertices - 3, toi = geoGroup.vertices - 2, endi = geoGroup.vertices - 1;
        const fromoffset = fromi * 3, tooffset = toi * 3, endoffset = endi * 3;
        for (i = 0, n = nvecs.length - 1; i < n; ++i) {
            const ti = start + 3 * i;
            offset = ti * 3;
            faceoffset = geoGroup.faceidx;
            lineoffset = geoGroup.lineidx;
            t1 = ti;
            t1offset = t1 * 3;
            t2 = ti + 1;
            t2offset = t2 * 3;
            t2b = ti + 2;
            t2boffset = t2b * 3;
            t3 = ti + 4;
            t3offset = t3 * 3;
            t3b = ti + 5;
            t3boffset = t3b * 3;
            t4 = ti + 3;
            t4offset = t4 * 3;
            n1 = n2 = nvecs[i];
            n3 = n4 = nvecs[i + 1];
            normalArray[t1offset] = n1.x;
            normalArray[t2offset] = n2.x;
            normalArray[t4offset] = n4.x;
            normalArray[t1offset + 1] = n1.y;
            normalArray[t2offset + 1] = n2.y;
            normalArray[t4offset + 1] = n4.y;
            normalArray[t1offset + 2] = n1.z;
            normalArray[t2offset + 2] = n2.z;
            normalArray[t4offset + 2] = n4.z;
            normalArray[t2offset] = n2.x;
            normalArray[t3offset] = n3.x;
            normalArray[t4offset] = n4.x;
            normalArray[t2offset + 1] = n2.y;
            normalArray[t3offset + 1] = n3.y;
            normalArray[t4offset + 1] = n4.y;
            normalArray[t2offset + 2] = n2.z;
            normalArray[t3offset + 2] = n3.z;
            normalArray[t4offset + 2] = n4.z;
            normalArray[t2boffset] = n2.x;
            normalArray[t3boffset] = n3.x;
            normalArray[t2boffset + 1] = n2.y;
            normalArray[t3boffset + 1] = n3.y;
            normalArray[t2boffset + 2] = n2.z;
            normalArray[t3boffset + 2] = n3.z;
            faceArray[faceoffset] = t1;
            faceArray[faceoffset + 1] = t2;
            faceArray[faceoffset + 2] = t4;
            faceArray[faceoffset + 3] = t2;
            faceArray[faceoffset + 4] = t3;
            faceArray[faceoffset + 5] = t4;
            faceArray[faceoffset + 6] = t1;
            faceArray[faceoffset + 7] = t4;
            faceArray[faceoffset + 8] = fromi;
            faceArray[faceoffset + 9] = t2b;
            faceArray[faceoffset + 10] = toi;
            faceArray[faceoffset + 11] = t3b;
            faceArray[faceoffset + 12] = t2b;
            faceArray[faceoffset + 13] = endi;
            faceArray[faceoffset + 14] = t3b;
            lineArray[lineoffset] = t1;
            lineArray[lineoffset + 1] = t2;
            lineArray[lineoffset + 2] = t1;
            lineArray[lineoffset + 3] = t4;
            lineArray[lineoffset + 4] = t3;
            lineArray[lineoffset + 5] = t4;
            lineArray[lineoffset + 6] = t1;
            lineArray[lineoffset + 7] = t4;
            lineArray[lineoffset + 8] = t2b;
            lineArray[lineoffset + 9] = t2; 
            lineArray[lineoffset + 10] = t2b;
            lineArray[lineoffset + 11] = t3b;
            lineArray[lineoffset + 12] = t3;
            lineArray[lineoffset + 13] = t3b; 
            lineArray[lineoffset + 14] = t2b;
            lineArray[lineoffset + 15] = endi;
            lineArray[lineoffset + 16] = t2b;
            lineArray[lineoffset + 17] = t3b;
            lineArray[lineoffset + 18] = endi;
            lineArray[lineoffset + 19] = t3b;
            geoGroup.faceidx += 15;
            geoGroup.lineidx += 20;
        }
        face = [start + 45, start + 46, start + 1, start, start + 47,
        start + 2];
        faceoffset = geoGroup.faceidx;
        lineoffset = geoGroup.lineidx;
        t1 = face[0];
        t1offset = t1 * 3;
        t2 = face[1];
        t2offset = t2 * 3;
        t2b = face[4];
        t2boffset = t2b * 3;
        t3 = face[2];
        t3offset = t3 * 3;
        t3b = face[5];
        t3boffset = t3b * 3;
        t4 = face[3];
        t4offset = t4 * 3;
        n1 = n2 = nvecs[15];
        n3 = n4 = nvecs[0];
        normalArray[t1offset] = n1.x;
        normalArray[t2offset] = n2.x;
        normalArray[t4offset] = n4.x;
        normalArray[t1offset + 1] = n1.y;
        normalArray[t2offset + 1] = n2.y;
        normalArray[t4offset + 1] = n4.y;
        normalArray[t1offset + 2] = n1.z;
        normalArray[t2offset + 2] = n2.z;
        normalArray[t4offset + 2] = n4.z;
        normalArray[t2offset] = n2.x;
        normalArray[t3offset] = n3.x;
        normalArray[t4offset] = n4.x;
        normalArray[t2offset + 1] = n2.y;
        normalArray[t3offset + 1] = n3.y;
        normalArray[t4offset + 1] = n4.y;
        normalArray[t2offset + 2] = n2.z;
        normalArray[t3offset + 2] = n3.z;
        normalArray[t4offset + 2] = n4.z;
        normalArray[t2boffset] = n2.x;
        normalArray[t3boffset] = n3.x;
        normalArray[t2boffset + 1] = n2.y;
        normalArray[t3boffset + 1] = n3.y;
        normalArray[t2boffset + 2] = n2.z;
        normalArray[t3boffset + 2] = n3.z;
        dir.normalize();
        negDir.normalize();
        normalArray[fromoffset] = negDir.x;
        normalArray[tooffset] = normalArray[endoffset] = dir.x;
        normalArray[fromoffset + 1] = negDir.y;
        normalArray[tooffset + 1] = normalArray[endoffset + 1] = dir.y;
        normalArray[fromoffset + 2] = negDir.z;
        normalArray[tooffset + 2] = normalArray[endoffset + 2] = dir.z;
        faceArray[faceoffset] = t1;
        faceArray[faceoffset + 1] = t2;
        faceArray[faceoffset + 2] = t4;
        faceArray[faceoffset + 3] = t2;
        faceArray[faceoffset + 4] = t3;
        faceArray[faceoffset + 5] = t4;
        faceArray[faceoffset + 6] = t1;
        faceArray[faceoffset + 7] = t4;
        faceArray[faceoffset + 8] = fromi;
        faceArray[faceoffset + 9] = t2b;
        faceArray[faceoffset + 10] = toi;
        faceArray[faceoffset + 11] = t3b;
        faceArray[faceoffset + 12] = t2b;
        faceArray[faceoffset + 13] = endi;
        faceArray[faceoffset + 14] = t3b;
        lineArray[lineoffset] = t1;
        lineArray[lineoffset + 1] = t2;
        lineArray[lineoffset + 2] = t1;
        lineArray[lineoffset + 3] = t4;
        lineArray[lineoffset + 4] = t3;
        lineArray[lineoffset + 5] = t4;
        lineArray[lineoffset + 6] = t1;
        lineArray[lineoffset + 7] = t4;
        lineArray[lineoffset + 8] = t2b;
        lineArray[lineoffset + 9] = t2; 
        lineArray[lineoffset + 10] = t2b;
        lineArray[lineoffset + 11] = t3b;
        lineArray[lineoffset + 12] = t3;
        lineArray[lineoffset + 13] = t3b; 
        lineArray[lineoffset + 14] = t2b;
        lineArray[lineoffset + 15] = endi;
        lineArray[lineoffset + 16] = t2b;
        lineArray[lineoffset + 17] = t3b;
        lineArray[lineoffset + 18] = endi;
        lineArray[lineoffset + 19] = t3b;
        geoGroup.faceidx += 15;
        geoGroup.lineidx += 20;
    }
    static updateBoundingFromPoints(sphere: Sphere, components, points, numPoints: number) {
        sphere.center.set(0, 0, 0);
        let xmin = Infinity, ymin = Infinity, zmin = Infinity;
        let xmax = -Infinity, ymax = -Infinity, zmax = -Infinity;
        if (sphere.box) {
            xmin = sphere.box.min.x;
            xmax = sphere.box.max.x;
            ymin = sphere.box.min.y;
            ymax = sphere.box.max.y;
            zmin = sphere.box.min.z;
            zmax = sphere.box.max.z;
        }
        for (let i = 0, il = numPoints; i < il; i++) {
            const x = points[i * 3], y = points[i * 3 + 1], z = points[i * 3 + 2];
            if (x < xmin) xmin = x;
            if (y < ymin) ymin = y;
            if (z < zmin) zmin = z;
            if (x > xmax) xmax = x;
            if (y > ymax) ymax = y;
            if (z > zmax) zmax = z;
        }
        sphere.center.set((xmax + xmin) / 2, (ymax + ymin) / 2, (zmax + zmin) / 2);
        sphere.radius = sphere.center.distanceTo({ x: xmax, y: ymax, z: zmax });
        sphere.box = { min: { x: xmin, y: ymin, z: zmin }, max: { x: xmax, y: ymax, z: zmax } };
    }
    private static addCustomGeo(shape: ShapeDeMol, geo: Geometry, mesh, color, clickable) {
        const geoGroup = geo.addGeoGroup();
        const vertexArr = mesh.vertexArr, normalArr = mesh.normalArr,
            faceArr = mesh.faceArr;
        geoGroup.vertices = vertexArr.length;
        geoGroup.faceidx = faceArr.length;
        let offset, v, a, b, c, i, il, r, g;
        const vertexArray = geoGroup.vertexArray;
        const colorArray = geoGroup.colorArray;
        if (color.constructor !== Array) {
            r = color.r;
            g = color.g;
            b = color.b;
        }
        for (i = 0, il = geoGroup.vertices; i < il; ++i) {
            offset = i * 3;
            v = vertexArr[i];
            vertexArray[offset] = v.x;
            vertexArray[offset + 1] = v.y;
            vertexArray[offset + 2] = v.z;
            if (color.constructor === Array) {
                c = color[i];
                r = c.r;
                g = c.g;
                b = c.b;
            }
            colorArray[offset] = r;
            colorArray[offset + 1] = g;
            colorArray[offset + 2] = b;
        }
        if (clickable) {
            for (i = 0, il = geoGroup.faceidx / 3; i < il; ++i) {
                offset = i * 3;
                a = faceArr[offset];
                b = faceArr[offset + 1];
                c = faceArr[offset + 2];
                const vA = new Vector3(), vB = new Vector3(), vC = new Vector3();
                shape.intersectionShape.triangle.push(new Triangle(vA.copy(vertexArr[a]),
                    vB.copy(vertexArr[b]), vC.copy(vertexArr[c])));
            }
        }
        if (clickable) {
            const center = new Vector3(0, 0, 0);
            let cnt = 0;
            for (let g = 0; g < geo.geometryGroups.length; g++) {
                center.add(geo.geometryGroups[g].getCentroid());
                cnt++;
            }
            center.divideScalar(cnt);
            ShapeDeMol.updateBoundingFromPoints(shape.boundingSphere, { centroid: center }, vertexArray, geoGroup.vertices);
        }
        geoGroup.faceArray = new Uint16Array(faceArr);
        geoGroup.truncateArrayBuffers(true, true);
        if (normalArr.length < geoGroup.vertices)
            geoGroup.setNormals();
        else {
            const normalArray = geoGroup.normalArray = new Float32Array(geoGroup.vertices * 3);
            let n;
            for (i = 0, il = geoGroup.vertices; i < il; ++i) {
                offset = i * 3;
                n = normalArr[i];
                normalArray[offset] = n.x;
                normalArray[offset + 1] = n.y;
                normalArray[offset + 2] = n.z;
            }
        }
        geoGroup.setLineIndices();
        geoGroup.lineidx = geoGroup.lineArray.length;
    }
    static drawCustom = function (shape: ShapeDeMol, geo: Geometry, customSpec: CustomShapeSpec) {
        const mesh = customSpec;
        const vertexArr = mesh.vertexArr;
        const faceArr = mesh.faceArr;
        if (vertexArr.length === 0 || faceArr.length === 0) {
            console
                .warn("Error adding custom shape component: No vertices and/or face indices supplied!");
        }
        let color = customSpec.color;
        if (typeof (color) == 'undefined') {
            color = shape.color;
        }
        color = CC.color(color);
        const splits = splitMesh(mesh);
        for (let i = 0, n = splits.length; i < n; i++) {
            ShapeDeMol.addCustomGeo(shape, geo, splits[i], splits[i].colorArr ? splits[i].colorArr : color, customSpec.clickable);
        }
    };
    static updateFromStyle(shape: ShapeDeMol, stylespec: ShapeSpec) {
        if (typeof (stylespec.color) != 'undefined') {
            shape.color = stylespec.color || new Color();
            if (!(stylespec.color instanceof Color))
                shape.color = CC.color(stylespec.color);
        } else {
            shape.color = CC.color(0);
        }
        shape.wireframe = stylespec.wireframe ? true : false;
        shape.opacity = stylespec.alpha ? clamp(stylespec.alpha, 0.0,
            1.0) : 1.0;
        if (typeof (stylespec.opacity) != 'undefined') {
            shape.opacity = clamp(stylespec.opacity, 0.0, 1.0);
        }
        shape.side = (stylespec.side !== undefined) ? stylespec.side : DoubleSide;
        shape.linewidth = typeof (stylespec.linewidth) == 'undefined' ? 1 : stylespec.linewidth;
        shape.clickable = stylespec.clickable ? true : false;
        shape.callback = makeFunction(stylespec.callback);
        shape.hoverable = stylespec.hoverable ? true : false;
        shape.hover_callback = makeFunction(stylespec.hover_callback);
        shape.unhover_callback = makeFunction(stylespec.unhover_callback);
        shape.contextMenuEnabled = !!stylespec.contextMenuEnabled;
        shape.hidden = stylespec.hidden;
        shape.frame = stylespec.frame;
    }
    boundingSphere: Sphere;
    intersectionShape: any;
    color: any = 0xffffff;
    hidden = false;
    wireframe = false;
    opacity = 1;
    linewidth = 1;
    clickable = false;
    callback: Func;
    hoverable = false;
    hover_callback: Func;
    unhover_callback: Func;
    contextMenuEnabled: boolean = false;
    frame: any;
    side = DoubleSide;
    shapePosition: any;
    private geo: Geometry;
    private linegeo: Geometry;
    private stylespec: any;
    private components: any;
    private shapeObj: any;
    private renderedShapeObj: any;
    constructor(stylespec: ShapeSpec) {
        this.stylespec = stylespec || {};
        this.boundingSphere = new Sphere();
        this.intersectionShape = {
            sphere: [],
            cylinder: [],
            line: [],
            triangle: []
        };
        ShapeDeMol.updateFromStyle(this, this.stylespec);
        this.components = [];
        this.shapeObj = null;
        this.renderedShapeObj = null;
        this.geo = new Geometry(true);
        this.linegeo = new Geometry(true);
    }
    updateStyle(newspec: ShapeSpec) {
        for (const prop in newspec) {
            this.stylespec[prop] = newspec[prop];
        }
        ShapeDeMol.updateFromStyle(this, this.stylespec);
        if (newspec.voldata && newspec.volscheme) {
            adjustVolumeStyle(newspec);
            const scheme = newspec.volscheme;
            const voldata = newspec.voldata;
            const cc = CC;
            const range = scheme.range() || [-1, 1];
            this.geo.setColors(function (x, y, z) {
                const val = voldata.getVal(x, y, z);
                const col = cc.color(scheme.valueToHex(val, range));
                return col;
            });
            delete this.color;
        }
    }
    public addCustom(customSpec: CustomShapeSpec) {
        customSpec.vertexArr = customSpec.vertexArr || [];
        customSpec.faceArr = customSpec.faceArr || [];
        customSpec.normalArr = customSpec.normalArr || [];
        ShapeDeMol.drawCustom(this, this.geo, customSpec);
    }
    public addSphere(sphereSpec: SphereSpec) {
        if (!sphereSpec.center) {
            sphereSpec.center = new Vector3(0, 0, 0);
        }
        sphereSpec.radius = sphereSpec.radius ? clamp(sphereSpec.radius, 0, Infinity) : 1.5;
        sphereSpec.color = CC.color(sphereSpec.color);
        this.intersectionShape.sphere.push(new Sphere(sphereSpec.center, sphereSpec.radius));
         GLDraw.drawSphere(this.geo, sphereSpec.center,
           sphereSpec.radius, sphereSpec.color as Colored, sphereSpec.quality);
        this.components.push({
            centroid: new Vector3(sphereSpec.center.x,
                sphereSpec.center.y, sphereSpec.center.z)
        });
        const geoGroup = this.geo.updateGeoGroup(0);
        ShapeDeMol.updateBoundingFromPoints(this.boundingSphere, this.components,
            geoGroup.vertexArray, geoGroup.vertices);
    }
    public addBox(boxSpec: BoxSpec) {
        const dim = boxSpec.dimensions || { w: 1, h: 1, d: 1 };
        let w: XYZ;
        if (typeof (dim.w) == "number") {
            w = { x: dim.w, y: 0, z: 0 };
        } else {
            w = dim.w;
        }
        let h: XYZ;
        if (typeof (dim.h) == "number") {
            h = { x: 0, y: dim.h, z: 0 };
        } else {
            h = dim.h;
        }
        let d: XYZ;
        if (typeof (dim.d) == "number") {
            d = { x: 0, y: 0, z: dim.d };
        } else {
            d = dim.d;
        }
        let c = boxSpec.corner;
        if (c == undefined) {
            if (boxSpec.center !== undefined) {
                c = {
                    x: boxSpec.center.x - 0.5 * (w.x + h.x + d.x),
                    y: boxSpec.center.y - 0.5 * (w.y + h.y + d.y),
                    z: boxSpec.center.z - 0.5 * (w.z + h.z + d.z)
                };
            } else { 
                c = { x: 0, y: 0, z: 0 };
            }
        }
        const uv =
            [{ x: c.x, y: c.y, z: c.z },
            { x: c.x + w.x, y: c.y + w.y, z: c.z + w.z },
            { x: c.x + h.x, y: c.y + h.y, z: c.z + h.z },
            { x: c.x + w.x + h.x, y: c.y + w.y + h.y, z: c.z + w.z + h.z },
            { x: c.x + d.x, y: c.y + d.y, z: c.z + d.z },
            { x: c.x + w.x + d.x, y: c.y + w.y + d.y, z: c.z + w.z + d.z },
            { x: c.x + h.x + d.x, y: c.y + h.y + d.y, z: c.z + h.z + d.z },
            { x: c.x + w.x + h.x + d.x, y: c.y + w.y + h.y + d.y, z: c.z + w.z + h.z + d.z }];
        const verts = [];
        const faces = [];
        verts.splice(verts.length, 0, uv[0], uv[1], uv[2], uv[3]);
        faces.splice(faces.length, 0, 0, 2, 1, 1, 2, 3);
        let foff = 4;
        verts.splice(verts.length, 0, uv[2], uv[3], uv[6], uv[7]);
        faces.splice(faces.length, 0, foff + 0, foff + 2, foff + 1, foff + 1, foff + 2, foff + 3);
        foff += 4;
        verts.splice(verts.length, 0, uv[4], uv[5], uv[0], uv[1]);
        faces.splice(faces.length, 0, foff + 0, foff + 2, foff + 1, foff + 1, foff + 2, foff + 3);
        foff += 4;
        verts.splice(verts.length, 0, uv[6], uv[7], uv[4], uv[5]);
        faces.splice(faces.length, 0, foff + 0, foff + 2, foff + 1, foff + 1, foff + 2, foff + 3);
        foff += 4;
        verts.splice(verts.length, 0, uv[3], uv[1], uv[7], uv[5]);
        faces.splice(faces.length, 0, foff + 0, foff + 2, foff + 1, foff + 1, foff + 2, foff + 3);
        foff += 4;
        verts.splice(verts.length, 0, uv[2], uv[6], uv[0], uv[4]); 
        faces.splice(faces.length, 0, foff + 0, foff + 2, foff + 1, foff + 1, foff + 2, foff + 3);
        foff += 4;
        const spec = extend({}, boxSpec);
        spec.vertexArr = verts;
        spec.faceArr = faces;
        spec.normalArr = [];
        ShapeDeMol.drawCustom(this, this.geo, spec);
        const centroid = new Vector3();
        this.components.push({
            centroid: centroid.addVectors(uv[0], uv[7]).multiplyScalar(0.5)
        });
        const geoGroup = this.geo.updateGeoGroup(0);
        ShapeDeMol.updateBoundingFromPoints(this.boundingSphere, this.components, geoGroup.vertexArray, geoGroup.vertices);
    }
    public addCylinder(cylinderSpec: CylinderSpec) {
        let start: Vector3;
        let end: Vector3;
        if (!cylinderSpec.start) {
            start = new Vector3(0, 0, 0);
        } else {
            start = new Vector3(cylinderSpec.start.x || 0,
                cylinderSpec.start.y || 0, cylinderSpec.start.z || 0);
        }
        if (!cylinderSpec.end) {
            end = new Vector3(0, 0, 0);
        } else {
            end = new Vector3(cylinderSpec.end.x,
                cylinderSpec.end.y || 0, cylinderSpec.end.z || 0);
            if (typeof (end.x) == 'undefined') end.x = 3; 
        }
        const radius = cylinderSpec.radius || 0.1;
        const color = CC.color(cylinderSpec.color);
        this.intersectionShape.cylinder.push(new Cylinder(start, end, radius));
        GLDraw.drawCylinder(this.geo, start, end, radius, color, cylinderSpec.fromCap, cylinderSpec.toCap);
        const centroid = new Vector3();
        this.components.push({
            centroid: centroid.addVectors(start, end).multiplyScalar(0.5)
        });
        const geoGroup = this.geo.updateGeoGroup(0);
        ShapeDeMol.updateBoundingFromPoints(this.boundingSphere, this.components,
            geoGroup.vertexArray, geoGroup.vertices);
    }
    public addDashedCylinder(cylinderSpec: CylinderSpec) {
        cylinderSpec.dashLength = cylinderSpec.dashLength || 0.25;
        cylinderSpec.gapLength = cylinderSpec.gapLength || 0.25;
        let start: Vector3;
        if (!cylinderSpec.start) start = new Vector3(0, 0, 0);
        else {
            start = new Vector3(cylinderSpec.start.x || 0,
                cylinderSpec.start.y || 0, cylinderSpec.start.z || 0);
        }
        let end: Vector3;
        if (!cylinderSpec.end) end = new Vector3(3, 0, 0);
        else {
            end = new Vector3(cylinderSpec.end.x,
                cylinderSpec.end.y || 0, cylinderSpec.end.z || 0);
            if (typeof (end.x) == 'undefined') end.x = 3; 
        }
        const radius = cylinderSpec.radius || 0.1;
        const color = CC.color(cylinderSpec.color);
        const cylinderLength = Math.sqrt(Math.pow((start.x - end.x), 2) + Math.pow((start.y - end.y), 2) + Math.pow((start.z - end.z), 2));
        const count = cylinderLength / (cylinderSpec.gapLength + cylinderSpec.dashLength);
        let new_start = new Vector3(cylinderSpec.start.x || 0,
            cylinderSpec.start.y || 0, cylinderSpec.start.z || 0);
        let new_end = new Vector3(cylinderSpec.end.x,
            cylinderSpec.end.y || 0, cylinderSpec.end.z || 0);
        const gapVector = new Vector3((end.x - start.x) / (cylinderLength / cylinderSpec.gapLength), (end.y - start.y) / (cylinderLength / cylinderSpec.gapLength), (end.z - start.z) / (cylinderLength / cylinderSpec.gapLength));
        const dashVector = new Vector3((end.x - start.x) / (cylinderLength / cylinderSpec.dashLength), (end.y - start.y) / (cylinderLength / cylinderSpec.dashLength), (end.z - start.z) / (cylinderLength / cylinderSpec.dashLength));
        for (let place = 0; place < count; place++) {
            new_end = new Vector3(new_start.x + dashVector.x, new_start.y + dashVector.y, new_start.z + dashVector.z);
            this.intersectionShape.cylinder.push(new Cylinder(new_start, new_end, radius));
            GLDraw.drawCylinder(this.geo, new_start, new_end, radius, color, cylinderSpec.fromCap, cylinderSpec.toCap);
            new_start = new Vector3(new_end.x + gapVector.x, new_end.y + gapVector.y, new_end.z + gapVector.z);
        }
        const centroid = new Vector3();
        this.components.push({
            centroid: centroid.addVectors(start, end).multiplyScalar(0.5)
        });
        const geoGroup = this.geo.updateGeoGroup(0);
        ShapeDeMol.updateBoundingFromPoints(this.boundingSphere, this.components,
            geoGroup.vertexArray, geoGroup.vertices);
    }
    public addCurve(curveSpec: CurveSpec) {
        curveSpec.points = curveSpec.points || [];
        curveSpec.smooth = curveSpec.smooth || 10;
        if (typeof (curveSpec.fromCap) == "undefined") curveSpec.fromCap = 2;
        if (typeof (curveSpec.toCap) == "undefined") curveSpec.toCap = 2;
        const points = subdivide_spline(curveSpec.points, curveSpec.smooth);
        if (points.length < 3) {
            console.log("Too few points in addCurve");
            return;
        }
        const radius = curveSpec.radius || 0.1;
        const color = CC.color(curveSpec.color);
        let start = 0;
        let end = points.length - 1;
        const segmentlen = points[0].distanceTo(points[1]);
        const npts = Math.ceil(2 * radius / segmentlen);
        if (curveSpec.toArrow) {
            end -= npts;
            const arrowspec = {
                start: points[end],
                end: points[points.length - 1],
                radius: radius,
                color: color as ColorSpec,
                mid: 0.0001
            };
            this.addArrow(arrowspec);
        }
        if (curveSpec.fromArrow) {
            start += npts;
            const arrowspec = {
                start: points[start],
                end: points[0],
                radius: radius,
                color: color as ColorSpec,
                mid: 0.0001
            };
            this.addArrow(arrowspec);
        }
        const midway = Math.ceil(points.length / 2);
        const middleSpec: any = { radius: radius, color: color, fromCap: 2, toCap: 2 };
        for (let i = start; i < end; i++) {
            middleSpec.start = points[i];
            middleSpec.end = points[i + 1];
            middleSpec.fromCap = 2;
            middleSpec.toCap = 2;
            if (i < midway) {
                middleSpec.fromCap = 2;
                middleSpec.toCap = 0;
            } else if (i > midway) {
                middleSpec.fromCap = 0;
                middleSpec.toCap = 2;
            } else {
                middleSpec.fromCap = 2;
                middleSpec.toCap = 2;
            }
            this.addCylinder(middleSpec);
        }
    }
    public addLine(lineSpec: LineSpec) {
        let start: Vector3;
        let end: Vector3;
        if (!lineSpec.start) {
            start = new Vector3(0, 0, 0);
        } else {
            start = new Vector3(lineSpec.start.x || 0,
                lineSpec.start.y || 0, lineSpec.start.z || 0);
        }
        if (!lineSpec.end) {
            end = new Vector3(3, 0, 0);
        } else {
            end = new Vector3(lineSpec.end.x,
                lineSpec.end.y || 0, lineSpec.end.z || 0);
            if (typeof (end.x) == 'undefined') end.x = 3; 
        }
        let geoGroup = this.geo.updateGeoGroup(2);
        const vstart = geoGroup.vertices;
        const i = vstart * 3;
        const vertexArray = geoGroup.vertexArray;
        vertexArray[i] = start.x;
        vertexArray[i + 1] = start.y;
        vertexArray[i + 2] = start.z;
        vertexArray[i + 3] = end.x;
        vertexArray[i + 4] = end.y;
        vertexArray[i + 5] = end.z;
        geoGroup.vertices += 2;
        const lineArray = geoGroup.lineArray;
        const li = geoGroup.lineidx;
        lineArray[li] = vstart;
        lineArray[li + 1] = vstart + 1;
        geoGroup.lineidx += 2;
        const centroid = new Vector3();
        this.components.push({
            centroid: centroid.addVectors(start, end).multiplyScalar(0.5)
        });
        geoGroup = this.geo.updateGeoGroup(0);
        ShapeDeMol.updateBoundingFromPoints(this.boundingSphere, this.components,
            geoGroup.vertexArray, geoGroup.vertices);
    }
    public addArrow(arrowSpec: ArrowSpec) {
        if (!arrowSpec.start) {
            arrowSpec.start = new Vector3(0, 0, 0);
        } else {
            arrowSpec.start = new Vector3(arrowSpec.start.x || 0,
                arrowSpec.start.y || 0, arrowSpec.start.z || 0);
        }
        if (arrowSpec.dir instanceof Vector3 && typeof (arrowSpec.length) === 'number') {
            const end = arrowSpec.dir.clone().multiplyScalar(arrowSpec.length).add(
                arrowSpec.start);
            arrowSpec.end = end;
        }
        else if (!arrowSpec.end) {
            arrowSpec.end = new Vector3(3, 0, 0);
        } else {
            arrowSpec.end = new Vector3(arrowSpec.end.x,
                arrowSpec.end.y || 0, arrowSpec.end.z || 0);
            if (typeof (arrowSpec.end.x) == 'undefined') arrowSpec.end.x = 3; 
        }
        arrowSpec.radius = arrowSpec.radius || 0.1;
        arrowSpec.radiusRatio = arrowSpec.radiusRatio || 1.618034;
        arrowSpec.mid = (0 < arrowSpec.mid && arrowSpec.mid < 1) ? arrowSpec.mid
            : 0.618034;
        ShapeDeMol.drawArrow(this, this.geo, arrowSpec);
        const centroid = new Vector3();
        this.components.push({
            centroid: centroid.addVectors(arrowSpec.start, arrowSpec.end)
                .multiplyScalar(0.5)
        });
        const geoGroup = this.geo.updateGeoGroup(0);
        ShapeDeMol.updateBoundingFromPoints(this.boundingSphere, this.components,
            geoGroup.vertexArray, geoGroup.vertices);
    }
    static distance_from(c1: XYZ, c2: XYZ) {
        return Math.sqrt(Math.pow((c1.x - c2.x), 2) + Math.pow((c1.y - c2.y), 2) + Math.pow((c1.z - c2.z), 2));
    }
    static inSelectedRegion(coordinate: XYZ, selectedRegion, radius: number) {
        for (let i = 0; i < selectedRegion.length; i++) {
            if (ShapeDeMol.distance_from(selectedRegion[i], coordinate) <= radius)
                return true;
        }
        return false;
    }
    addIsosurface(data, volSpec:IsoSurfaceSpec, callback?, viewer?: Viewer3D) {
        const isoval = (volSpec.isoval !== undefined && typeof (volSpec.isoval) === "number") ? volSpec.isoval
            : 0.0;
        const voxel = (volSpec.voxel) ? true : false;
        const smoothness = (volSpec.smoothness === undefined) ? 1 : volSpec.smoothness;
        const nX = data.size.x;
        const nY = data.size.y;
        const nZ = data.size.z;
        const vertnums = new Int16Array(nX * nY * nZ);
        const vals = data.data;
        let i, il;
        for (i = 0, il = vertnums.length; i < il; ++i)
            vertnums[i] = -1;
        const bitdata = new Uint8Array(nX * nY * nZ);
        for (i = 0, il = vals.length; i < il; ++i) {
            const val = (isoval >= 0) ? vals[i] - isoval : isoval - vals[i];
            if (val > 0)
                bitdata[i] |= ShapeDeMol.ISDONE;
        }
        let verts = [], faces = [];
        MarchingCube.march(bitdata, verts, faces, {
            fulltable: true,
            voxel: voxel,
            unitCube: data.unit,
            origin: data.origin,
            matrix: data.matrix,
            nX: nX,
            nY: nY,
            nZ: nZ
        });
        if (!voxel && smoothness > 0)
            MarchingCube.laplacianSmooth(smoothness, verts, faces);
        const vertexmapping = [];
        const newvertices = [];
        const newfaces = [];
        if (volSpec.selectedRegion && volSpec.coords === undefined) {
            volSpec.coords = volSpec.selectedRegion; 
        }
        if (volSpec.coords === undefined && volSpec.selection !== undefined) {
            if(!viewer) {
                console.log("addIsosurface needs viewer is selection provided.");
            } else {
                volSpec.coords = viewer.selectedAtoms(volSpec.selection) as XYZ[];
            }
        }
        if (volSpec.coords !== undefined) {
            let xmax = volSpec.coords[0].x,
                ymax = volSpec.coords[0].y,
                zmax = volSpec.coords[0].z,
                xmin = volSpec.coords[0].x,
                ymin = volSpec.coords[0].y,
                zmin = volSpec.coords[0].z;
            for (let i = 0; i < volSpec.coords.length; i++) {
                if (volSpec.coords[i].x > xmax)
                    xmax = volSpec.coords[i].x;
                else if (volSpec.coords[i].x < xmin)
                    xmin = volSpec.coords[i].x;
                if (volSpec.coords[i].y > ymax)
                    ymax = volSpec.coords[i].y;
                else if (volSpec.coords[i].y < ymin)
                    ymin = volSpec.coords[i].y;
                if (volSpec.coords[i].z > zmax)
                    zmax = volSpec.coords[i].z;
                else if (volSpec.coords[i].z < zmin)
                    zmin = volSpec.coords[i].z;
            }
            let rad = 2;
            if (volSpec.radius !== undefined) {
                rad = volSpec.radius; 
            }
            if (volSpec.selectedOffset !== undefined) { 
                rad = volSpec.selectedOffset;
            }
            if (volSpec.seldist !== undefined) {
                rad = volSpec.seldist;
            }
            xmin -= rad;
            xmax += rad;
            ymin -= rad;
            ymax += rad;
            zmin -= rad;
            zmax += rad;
            for (let i = 0; i < verts.length; i++) {
                if (verts[i].x > xmin &&
                    verts[i].x < xmax &&
                    verts[i].y > ymin &&
                    verts[i].y < ymax &&
                    verts[i].z > zmin &&
                    verts[i].z < zmax &&
                    ShapeDeMol.inSelectedRegion(verts[i],
                        volSpec.coords, rad)) {
                    vertexmapping.push(newvertices.length);
                    newvertices.push(verts[i]);
                } else {
                    vertexmapping.push(-1);
                }
            }
            for (let i = 0; i + 2 < faces.length; i += 3) {
                if (vertexmapping[faces[i]] !== -1 &&
                    vertexmapping[faces[i + 1]] !== -1 &&
                    vertexmapping[faces[i + 2]] !== -1) {
                    newfaces.push(faces[i] - (faces[i] - vertexmapping[faces[i]]));
                    newfaces.push(faces[i + 1] - (faces[i + 1] - vertexmapping[faces[i + 1]]));
                    newfaces.push(faces[i + 2] - (faces[i + 2] - vertexmapping[faces[i + 2]]));
                }
            }
            verts = newvertices;
            faces = newfaces;
        }
        ShapeDeMol.drawCustom(this, this.geo, {
            vertexArr: verts,
            faceArr: faces,
            normalArr: [],
            clickable: volSpec.clickable,
            hoverable: volSpec.hoverable
        });
        this.updateStyle(volSpec);
        const origin = new Vector3(data.origin.x, data.origin.y, data.origin.z);
        const size = new Vector3(data.size.x * data.unit.x, data.size.y * data.unit.y, data.size.z * data.unit.z);
        const total = new Vector3(0, 0, 0);
        const maxv = origin.clone();
        const minv = origin.clone().add(size);
        for (let i = 0; i < verts.length; i++) {
            total.add(verts[i]);
            maxv.max(verts[i]);
            minv.min(verts[i]);
        }
        total.divideScalar(verts.length);
        const len1 = total.distanceTo(minv);
        const len2 = total.distanceTo(maxv);
        this.boundingSphere.center = total;
        this.boundingSphere.radius = Math.max(len1, len2);
        if (typeof callback == "function")
            callback();
    }
    public addVolumetricData(data, fmt, volSpec: IsoSurfaceSpec) {
        data = new VolumeRender(data, fmt);
        this.addIsosurface(data, volSpec);
    }
    finalize() {
        ShapeDeMol.finalizeGeo(this.geo);
        this.geo.initTypedArrays();
        return this.geo;
    }
    globj(group) {
        if (this.renderedShapeObj) {
            group.remove(this.renderedShapeObj);
            this.renderedShapeObj = null;
        }
        if (this.hidden)
            return;
        ShapeDeMol.finalizeGeo(this.geo);
        this.geo.initTypedArrays();
        if (this.wireframe) {
            this.geo.setUpWireframe();
        }
        if (typeof (this.color) != 'undefined')
            ShapeDeMol.updateColor(this.geo, this.color);
        this.shapeObj = new Object3D();
        let material = null;
        if (this.side == DoubleSide) {
            material = new MeshDoubleLambertMaterial({
                wireframe: this.wireframe,
                side: this.side,
                transparent: (this.opacity < 1) ? true : false,
                opacity: this.opacity,
                wireframeLinewidth: this.linewidth,
                vertexColors: Coloring.VertexColors
            });
        } else {
            material = new MeshLambertMaterial({
                wireframe: this.wireframe,
                side: this.side,
                transparent: (this.opacity < 1) ? true : false,
                opacity: this.opacity,
                wireframeLinewidth: this.linewidth,
                vertexColors: Coloring.VertexColors
            });
        }
        const mesh = new Mesh(this.geo, material);
        this.shapeObj.add(mesh);
        if(this.linegeo && this.linegeo.vertices > 0) {
            const lineMaterial = new LineBasicMaterial({
                linewidth: this.linewidth,
                color: this.color
            });
            const line = new Line(this.linegeo, lineMaterial as Material, LineStyle.LinePieces);
            this.shapeObj.add(line);
        }
        this.renderedShapeObj = this.shapeObj.clone();
        group.add(this.renderedShapeObj);
    }
    removegl(group) {
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
export function splitMesh(mesh) {
    const MAXVERT = 64000; 
    if (mesh.vertexArr.length < MAXVERT) return [mesh]; 
    const slices: any = [{ vertexArr: [], normalArr: [], faceArr: [] }];
    if (mesh.colorArr) slices.colorArr = [];
    const vertSlice = []; 
    const vertIndex = []; 
    let currentSlice = 0;
    const faces = mesh.faceArr;
    for (let i = 0, nf = faces.length; i < nf; i += 3) {
        const slice = slices[currentSlice];
        for (let j = 0; j < 3; j++) {
            const v = faces[i + j];
            if (vertSlice[v] !== currentSlice) { 
                vertSlice[v] = currentSlice;
                vertIndex[v] = slice.vertexArr.length;
                slice.vertexArr.push(mesh.vertexArr[v]);
                if (mesh.normalArr && mesh.normalArr[v]) slice.normalArr.push(mesh.normalArr[v]);
                if (mesh.colorArr && mesh.colorArr[v]) slice.colorArr.push(mesh.colorArr[v]);
            }
            slice.faceArr.push(vertIndex[v]);
        }
        if (slice.vertexArr.length >= MAXVERT) {
            slices.push({ vertexArr: [], normalArr: [], faceArr: [] });
            if (mesh.colorArr) slices.colorArr = [];
            currentSlice++;
        }
    }
    return slices;
}
export interface ShapeSpec {
    color?: ColorSpec | ColorSpec[];
    alpha?: number; 
    opacity?: number;
    wireframe?: boolean;
    hidden?: boolean;
    linewidth?: number;
    clickable?: boolean;
    callback?: Func;
    hoverable?: boolean;
    hover_callback?: Func;
    unhover_callback?: Func;
    contextMenuEnabled?: boolean;
    frame?: number;
    side?: number;
    voldata?: VolumeRender;
    volscheme?: GradientType
}
export interface IsoSurfaceSpec extends ShapeSpec {
    isoval?: number;
    voxel?: boolean;
    smoothness?: number;
    coords?: XYZ[];
    selection?: AtomSelectionSpec;
    seldist?: number;
    voldata?: VolumeRender;
    volscheme?: GradientType;
    volformat?: string;
    selectedRegion?: XYZ[]; 
    selectedOffset?: number; 
    radius?: number; 
}
export interface ArrowSpec extends ShapeSpec {
    start?: XYZ;
    end?: XYZ;
    dir?: XYZ;
    length?: number;
    radius?: number;
    color?: ColorSpec;
    hidden?: boolean;
    radiusRatio?: number;
    mid?: number;
    midpos?: number;
}
export interface CylinderSpec extends ShapeSpec {
    start?: XYZ;
    end?: XYZ;
    radius?: number;
    fromCap?: CAP | string;
    toCap?: CAP | string;
    dashed?: boolean;
    dashLength?: number;
    gapLength?: number;
    hidden?: boolean;    
}
export interface CurveSpec extends ShapeSpec {
    points?: XYZ[];
    smooth?: number;
    radius?: number;
    fromArrow?: boolean;
    toArrow?: boolean;
    fromCap?: CAP;
    toCap?: CAP;
}
export interface LineSpec extends ShapeSpec {
    start?: XYZ;
    end?: XYZ;
    dashed?: boolean;
}
export interface BoxSpec extends ShapeSpec {
    corner?: XYZ;
    center?: XYZ;
    dimensions?: {
        w: number | XYZ;
        h: number | XYZ;
        d: number | XYZ;
    };
}
export interface CustomShapeSpec extends ShapeSpec {
    vertexArr?: XYZ[];
    normalArr?: XYZ[];
    faceArr?: number[];
}
export interface SphereSpec extends ShapeSpec {
    center?: XYZ;
    radius?: number;
    quality?: number;
}
