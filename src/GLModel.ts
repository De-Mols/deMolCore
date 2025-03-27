import { Geometry, Material, StickImposterMaterial } from "./WebGL";
import { Sphere, Cylinder } from "./WebGL/shapes";
import { Vector3, Matrix4, conversionMatrix3, Matrix3, XYZ } from "./WebGL/math";
import { Color, CC, ColorschemeSpec, ColorSpec } from "./colors";
import { InstancedMaterial, SphereImposterMaterial, MeshLambertMaterial, Object3D, Mesh, LineBasicMaterial, Line, LineStyle } from "./WebGL";
import { CAP, GLDraw } from "./GLDraw"
import { CartoonStyleSpec, drawCartoon } from "./glcartoon";
import { elementColors } from "./colors";
import { get, deepCopy, extend, getExtent, getAtomProperty, makeFunction, getPropertyRange, specStringToObject, getbin, getColorFromStyle, inflateString } from "./utilities";
import { Gradient } from "./Gradient";
import { Parsers } from "./parsers";
import { NetCDFReader } from "netcdfjs"
import { AtomSelectionSpec, AtomSpec } from "./specs";
import { Viewer3D } from "Viewer3D";
import { ArrowSpec } from "Shape3D";
import { ParserConfig } from "./parsers/ParserConfig";
import { LabelSpec } from "Label";
import { createConnections } from "./parsers/utils/createConnections";
export class ModelDeMol {
    static defaultAtomStyle: AtomStyleSpec = {
        line: {}
    };
    static defaultlineWidth = 1.0;
    static vdwRadii = {
        "H": 1.2,
        "He": 1.4,
        "Li": 1.82,
        "Be": 1.53,
        "B": 1.92,
        "C": 1.7,
        "N": 1.55,
        "O": 1.52,
        "F": 1.47,
        "Ne": 1.54,
        "Na": 2.27,
        "Mg": 1.73,
        "Al": 1.84,
        "Si": 2.1,
        "P": 1.8,
        "S": 1.8,
        "Cl": 1.75,
        "Ar": 1.88,
        "K": 2.75,
        "Ca": 2.31,
        "Ni": 1.63,
        "Cu": 1.4,
        "Zn": 1.39,
        "Ga": 1.87,
        "Ge": 2.11,
        "As": 1.85,
        "Se": 1.9,
        "Br": 1.85,
        "Kr": 2.02,
        "Rb": 3.03,
        "Sr": 2.49,
        "Pd": 1.63,
        "Ag": 1.72,
        "Cd": 1.58,
        "In": 1.93,
        "Sn": 2.17,
        "Sb": 2.06,
        "Te": 2.06,
        "I": 1.98,
        "Xe": 2.16,
        "Cs": 3.43,
        "Ba": 2.68,
        "Pt": 1.75,
        "Au": 1.66,
        "Hg": 1.55,
        "Tl": 1.96,
        "Pb": 2.02,
        "Bi": 2.07,
        "Po": 1.97,
        "At": 2.02,
        "Rn": 2.20,
        "Fr": 3.48,
        "Ra": 2.83,
        "U": 1.86
    };
    static sameObj(a, b) {
        if (a && b)
            return JSON.stringify(a) == JSON.stringify(b);
        else
            return a == b;
    }
    public unitCellObjects: any;
    private atoms: AtomSpec[] = [];
    private frames: any = [];
    private box: any = null;
    private atomdfs: any = null; 
    private id = 0;
    private hidden: any = false;
    private molObj: any = null;
    private renderedMolObj: any = null;
    private lastColors: any = null;
    private modelData: any = {};
    private modelDatas: any = null; 
    private idMatrix = new Matrix4();
    private dontDuplicateAtoms = true;
    private defaultColor = elementColors.defaultColor;
    private options: any;
    private ElementColors: any;
    private readonly defaultSphereRadius: number;
    private readonly defaultCartoonQuality: number;
    private readonly defaultStickRadius = 0.25;
    constructor(mid, options?) {
        this.options = options || {};
        this.ElementColors = (this.options.defaultcolors) ? this.options.defaultcolors : elementColors.defaultColors;
        this.defaultSphereRadius = (this.options.defaultSphereRadius) ? this.options.defaultSphereRadius : 1.5;
        this.defaultCartoonQuality = (this.options.cartoonQuality) ? this.options.cartoonQuality : 10;
        this.id = mid;
    }
    private getRadiusFromStyle(atom: AtomSpec, style: SphereStyleSpec | ClickSphereStyleSpec | CrossStyleSpec) {
        let r = this.defaultSphereRadius;
        if (typeof (style.radius) != "undefined")
            r = style.radius;
        else if (ModelDeMol.vdwRadii[atom.elem])
            r = ModelDeMol.vdwRadii[atom.elem];
        else if (atom.elem.length > 1) { 
            let e: string = atom.elem;
            e = e[0].toUpperCase() + e[1].toLowerCase();
            if (ModelDeMol.vdwRadii[e])
                r = ModelDeMol.vdwRadii[e];
        }
        if (typeof (style.scale) != "undefined")
            r *= style.scale;
        return r;
    }
    private drawAtomCross(atom: AtomSpec, geos: Record<number, Geometry>) {
        if (!atom.style.cross)
            return;
        const style = atom.style.cross;
        if (style.hidden)
            return;
        const linewidth = (style.linewidth || ModelDeMol.defaultlineWidth);
        if (!geos[linewidth])
            geos[linewidth] = new Geometry();
        const geoGroup = geos[linewidth].updateGeoGroup(6);
        const delta = this.getRadiusFromStyle(atom, style);
        const points = [[delta, 0, 0], [-delta, 0, 0], [0, delta, 0],
        [0, -delta, 0], [0, 0, delta], [0, 0, -delta]];
        const clickable = atom.clickable || atom.hoverable;
        if (clickable && atom.intersectionShape === undefined)
            atom.intersectionShape = { sphere: [], cylinder: [], line: [] };
        const c = getColorFromStyle(atom, style);
        const vertexArray = geoGroup.vertexArray;
        const colorArray = geoGroup.colorArray;
        for (let j = 0; j < 6; j++) {
            const offset = geoGroup.vertices * 3;
            geoGroup.vertices++;
            vertexArray[offset] = atom.x + points[j][0];
            vertexArray[offset + 1] = atom.y + points[j][1];
            vertexArray[offset + 2] = atom.z + points[j][2];
            colorArray[offset] = c.r;
            colorArray[offset + 1] = c.g;
            colorArray[offset + 2] = c.b;
            if (clickable) {
                const point = new Vector3(points[j][0], points[j][1], points[j][2]);
                point.multiplyScalar(0.1);
                point.set(point.x + atom.x, point.y + atom.y, point.z + atom.z);
                atom.intersectionShape.line.push(point);
            }
        }
    }
    private getGoodCross(atom: AtomSpec, atom2: AtomSpec, p1, dir) {
        let bestv = null;
        let bestlen = -1;
        for (let j = 0, n = atom.bonds.length; j < n; j++) {
            if (atom.bonds[j] != atom2.index) {
                const j2 = atom.bonds[j];
                const atom3 = this.atoms[j2];
                const p3 = new Vector3(atom3.x, atom3.y, atom3.z);
                const dir2 = p3.clone();
                dir2.sub(p1);
                const v = dir2.clone();
                v.cross(dir);
                const l = v.lengthSq();
                if (l > bestlen) {
                    bestlen = l;
                    bestv = v;
                    if (bestlen > 0.1) {
                        return bestv;
                    }
                }
            }
        }
        return bestv;
    }
    private getSideBondV(atom: AtomSpec, atom2: AtomSpec, i: number) {
        let i2, j2, atom3, p3, dir2;
        const p1 = new Vector3(atom.x, atom.y, atom.z);
        const p2 = new Vector3(atom2.x, atom2.y, atom2.z);
        const dir = p2.clone();
        let v = null;
        dir.sub(p1);
        if (atom.bonds.length === 1) {
            if (atom2.bonds.length === 1) {
                v = dir.clone();
                if (Math.abs(v.x) > 0.0001)
                    v.y += 1;
                else
                    v.x += 1;
            } else {
                i2 = (i + 1) % atom2.bonds.length;
                j2 = atom2.bonds[i2];
                atom3 = this.atoms[j2];
                if (atom3.index == atom.index) { 
                    i2 = (i2 + 1) % atom2.bonds.length;
                    j2 = atom2.bonds[i2];
                    atom3 = this.atoms[j2];
                }
                p3 = new Vector3(atom3.x, atom3.y, atom3.z);
                dir2 = p3.clone();
                dir2.sub(p1);
                v = dir2.clone();
                v.cross(dir);
            }
        } else {
            v = this.getGoodCross(atom, atom2, p1, dir);
            if (v.lengthSq() < 0.01) {
                const v2 = this.getGoodCross(atom2, atom, p1, dir);
                if (v2 != null) v = v2; 
            }
        }
        if (v.lengthSq() < 0.01) {
            v = dir.clone();
            if (Math.abs(v.x) > 0.0001)
                v.y += 1;
            else
                v.x += 1;
        }
        v.cross(dir);
        v.normalize();
        return v;
    }
    private addLine(vertexArray, colorArray, offset, p1: Vector3, p2: Vector3, c1: Color) {
        vertexArray[offset] = p1.x; vertexArray[offset + 1] = p1.y; vertexArray[offset + 2] = p1.z;
        colorArray[offset] = c1.r; colorArray[offset + 1] = c1.g; colorArray[offset + 2] = c1.b;
        vertexArray[offset + 3] = p2.x; vertexArray[offset + 4] = p2.y; vertexArray[offset + 5] = p2.z;
        colorArray[offset + 3] = c1.r; colorArray[offset + 4] = c1.g; colorArray[offset + 5] = c1.b;
    }
    private drawBondLines(atom: AtomSpec, atoms: AtomSpec[], geos: Record<number, Geometry>) {
        if (!atom.style.line)
            return;
        const style = atom.style.line;
        if (style.hidden)
            return;
        let p1a, p1b, p2a, p2b;
        const linewidth = (style.linewidth || ModelDeMol.defaultlineWidth);
        if (!geos[linewidth])
            geos[linewidth] = new Geometry();
        const geoGroup = geos[linewidth].updateGeoGroup(6 * atom.bonds.length); 
        const vertexArray = geoGroup.vertexArray;
        const colorArray = geoGroup.colorArray;
        for (let i = 0; i < atom.bonds.length; i++) {
            const j = atom.bonds[i]; 
            const atom2 = atoms[j];
            if (!atom2.style.line)
                continue; 
            if (atom.index >= atom2.index) 
                continue;
            const p1 = new Vector3(atom.x, atom.y, atom.z);
            const p2 = new Vector3(atom2.x, atom2.y, atom2.z);
            const mp = p1.clone().add(p2).multiplyScalar(0.5);
            let singleBond = false;
            const atomneedsi = atom.clickable || atom.hoverable;
            const atom2needsi = atom2.clickable || atom2.hoverable;
            if (atomneedsi || atom2needsi) {
                if (atomneedsi) {
                    if (atom.intersectionShape === undefined)
                        atom.intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
                    atom.intersectionShape.line.push(p1);
                    atom.intersectionShape.line.push(mp);
                }
                if (atom2needsi) {
                    if (atom2.intersectionShape === undefined)
                        atom2.intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
                    atom2.intersectionShape.line.push(mp);
                    atom2.intersectionShape.line.push(p2);
                }
            }
            let c1 = getColorFromStyle(atom, atom.style.line);
            let c2 = getColorFromStyle(atom2, atom2.style.line);
            if (atom.bondStyles && atom.bondStyles[i]) {
                const bstyle = atom.bondStyles[i];
                if (!bstyle.iswire) {
                    continue;
                }
                if (bstyle.singleBond) singleBond = true;
                if (typeof (bstyle.color1) != "undefined") {
                    c1 = CC.color(bstyle.color1);
                }
                if (typeof (bstyle.color2) != "undefined") {
                    c2 = CC.color(bstyle.color2);
                }
            }
            const offset = geoGroup.vertices * 3;
            var mpa, mpb;
            if (atom.bondOrder[i] > 1 && atom.bondOrder[i] < 4 && !singleBond) {
                const v = this.getSideBondV(atom, atom2, i);
                const dir = p2.clone();
                dir.sub(p1);
                if (atom.bondOrder[i] == 2) { 
                    v.multiplyScalar(0.1);
                    p1a = p1.clone();
                    p1a.add(v);
                    p1b = p1.clone();
                    p1b.sub(v);
                    p2a = p1a.clone();
                    p2a.add(dir);
                    p2b = p1b.clone();
                    p2b.add(dir);
                    if (c1 == c2) {
                        geoGroup.vertices += 4;
                        this.addLine(vertexArray, colorArray, offset, p1a, p2a, c1);
                        this.addLine(vertexArray, colorArray, offset + 6, p1b, p2b, c1);
                    }
                    else {
                        geoGroup.vertices += 8;
                        dir.multiplyScalar(0.5);
                        mpa = p1a.clone();
                        mpa.add(dir);
                        mpb = p1b.clone();
                        mpb.add(dir);
                        this.addLine(vertexArray, colorArray, offset, p1a, mpa, c1);
                        this.addLine(vertexArray, colorArray, offset + 6, mpa, p2a, c2);
                        this.addLine(vertexArray, colorArray, offset + 12, p1b, mpb, c1);
                        this.addLine(vertexArray, colorArray, offset + 18, mpb, p2b, c2);
                    }
                }
                else if (atom.bondOrder[i] == 3) { 
                    v.multiplyScalar(0.1);
                    p1a = p1.clone();
                    p1a.add(v);
                    p1b = p1.clone();
                    p1b.sub(v);
                    p2a = p1a.clone();
                    p2a.add(dir);
                    p2b = p1b.clone();
                    p2b.add(dir);
                    if (c1 == c2) {
                        geoGroup.vertices += 6;
                        this.addLine(vertexArray, colorArray, offset, p1, p2, c1);
                        this.addLine(vertexArray, colorArray, offset + 6, p1a, p2a, c1);
                        this.addLine(vertexArray, colorArray, offset + 12, p1b, p2b, c1);
                    }
                    else {
                        geoGroup.vertices += 12;
                        dir.multiplyScalar(0.5);
                        mpa = p1a.clone();
                        mpa.add(dir);
                        mpb = p1b.clone();
                        mpb.add(dir);
                        this.addLine(vertexArray, colorArray, offset, p1, mp, c1);
                        this.addLine(vertexArray, colorArray, offset + 6, mp, p2, c2);
                        this.addLine(vertexArray, colorArray, offset + 12, p1a, mpa, c1);
                        this.addLine(vertexArray, colorArray, offset + 18, mpa, p2a, c2);
                        this.addLine(vertexArray, colorArray, offset + 24, p1b, mpb, c1);
                        this.addLine(vertexArray, colorArray, offset + 30, mpb, p2b, c2);
                    }
                }
            }
            else { 
                if (c1 == c2) {
                    geoGroup.vertices += 2;
                    this.addLine(vertexArray, colorArray, offset, p1, p2, c1);
                } else {
                    geoGroup.vertices += 4;
                    this.addLine(vertexArray, colorArray, offset, p1, mp, c1);
                    this.addLine(vertexArray, colorArray, offset + 6, mp, p2, c2);
                }
            }
        }
    }
    private drawAtomSphere(atom: AtomSpec, geo: Geometry) {
        if (!atom.style.sphere)
            return;
        const style = atom.style.sphere;
        if (style.hidden)
            return;
        const C = getColorFromStyle(atom, style);
        const radius = this.getRadiusFromStyle(atom, style);
        if ((atom.clickable === true || atom.hoverable) && (atom.intersectionShape !== undefined)) {
            const center = new Vector3(atom.x, atom.y, atom.z);
            atom.intersectionShape.sphere.push(new Sphere(center, radius));
        }
        GLDraw.drawSphere(geo, atom, radius, C);
    }
    private drawAtomClickSphere(atom: AtomSpec) {
        if (!atom.style.clicksphere)
            return;
        const style = atom.style.clicksphere;
        if (style.hidden)
            return;
        const radius = this.getRadiusFromStyle(atom, style);
        if ((atom.clickable === true || atom.hoverable) && (atom.intersectionShape !== undefined)) {
            const center = new Vector3(atom.x, atom.y, atom.z);
            atom.intersectionShape.sphere.push(new Sphere(center, radius));
        }
    }
    private drawAtomInstanced(atom: AtomSpec, geo: Geometry) {
        if (!atom.style.sphere)
            return;
        const style = atom.style.sphere;
        if (style.hidden)
            return;
        const radius = this.getRadiusFromStyle(atom, style);
        const C = getColorFromStyle(atom, style);
        const geoGroup = geo.updateGeoGroup(1);
        const startv = geoGroup.vertices;
        const start = startv * 3;
        const vertexArray = geoGroup.vertexArray;
        const colorArray = geoGroup.colorArray;
        const radiusArray = geoGroup.radiusArray;
        vertexArray[start] = atom.x;
        vertexArray[start + 1] = atom.y;
        vertexArray[start + 2] = atom.z;
        colorArray[start] = C.r;
        colorArray[start + 1] = C.g;
        colorArray[start + 2] = C.b;
        radiusArray[startv] = radius;
        if ((atom.clickable === true || atom.hoverable) && (atom.intersectionShape !== undefined)) {
            const center = new Vector3(atom.x, atom.y, atom.z);
            atom.intersectionShape.sphere.push(new Sphere(center, radius));
        }
        geoGroup.vertices += 1;
    }
    private drawSphereImposter(geo: Geometry, center: XYZ, radius: number, C: Color) {
        const geoGroup = geo.updateGeoGroup(4);
        let i;
        const startv = geoGroup.vertices;
        const start = startv * 3;
        const vertexArray = geoGroup.vertexArray;
        const colorArray = geoGroup.colorArray;
        for (i = 0; i < 4; i++) {
            vertexArray[start + 3 * i] = center.x;
            vertexArray[start + 3 * i + 1] = center.y;
            vertexArray[start + 3 * i + 2] = center.z;
        }
        const normalArray = geoGroup.normalArray;
        for (i = 0; i < 4; i++) {
            colorArray[start + 3 * i] = C.r;
            colorArray[start + 3 * i + 1] = C.g;
            colorArray[start + 3 * i + 2] = C.b;
        }
        normalArray[start + 0] = -radius;
        normalArray[start + 1] = radius;
        normalArray[start + 2] = 0;
        normalArray[start + 3] = -radius;
        normalArray[start + 4] = -radius;
        normalArray[start + 5] = 0;
        normalArray[start + 6] = radius;
        normalArray[start + 7] = -radius;
        normalArray[start + 8] = 0;
        normalArray[start + 9] = radius;
        normalArray[start + 10] = radius;
        normalArray[start + 11] = 0;
        geoGroup.vertices += 4;
        const faceArray = geoGroup.faceArray;
        const faceoffset = geoGroup.faceidx; 
        faceArray[faceoffset + 0] = startv;
        faceArray[faceoffset + 1] = startv + 1;
        faceArray[faceoffset + 2] = startv + 2;
        faceArray[faceoffset + 3] = startv + 2;
        faceArray[faceoffset + 4] = startv + 3;
        faceArray[faceoffset + 5] = startv;
        geoGroup.faceidx += 6;
    }
    private drawAtomImposter(atom: AtomSpec, geo: Geometry) {
        if (!atom.style.sphere)
            return;
        const style = atom.style.sphere;
        if (style.hidden)
            return;
        const radius = this.getRadiusFromStyle(atom, style);
        const C = getColorFromStyle(atom, style);
        if ((atom.clickable === true || atom.hoverable) && (atom.intersectionShape !== undefined)) {
            const center = new Vector3(atom.x, atom.y, atom.z);
            atom.intersectionShape.sphere.push(new Sphere(center, radius));
        }
        this.drawSphereImposter(geo, atom as XYZ, radius, C);
    }
    private calculateDashes(from: XYZ, to: XYZ, radius: number, dashLength: number, gapLength: number) {
        const cylinderLength = Math.sqrt(
            Math.pow((from.x - to.x), 2) +
            Math.pow((from.y - to.y), 2) +
            Math.pow((from.z - to.z), 2)
        );
        radius = Math.max(radius, 0);
        gapLength = Math.max(gapLength, 0) + 2 * radius;
        dashLength = Math.max(dashLength, 0.001);
        if (dashLength + gapLength > cylinderLength) {
            dashLength = cylinderLength;
            gapLength = 0; 
        }
        const totalSegments = Math.floor((cylinderLength - dashLength) / (dashLength + gapLength)) + 1;
        const totalDashLength = totalSegments * dashLength;
        gapLength = (cylinderLength - totalDashLength) / totalSegments;
        let new_to;
        let new_from = new Vector3(from.x, from.y, from.z);
        const gapVector = new Vector3((to.x - from.x) / (cylinderLength / gapLength), (to.y - from.y) / (cylinderLength / gapLength), (to.z - from.z) / (cylinderLength / gapLength));
        const dashVector = new Vector3((to.x - from.x) / (cylinderLength / dashLength), (to.y - from.y) / (cylinderLength / dashLength), (to.z - from.z) / (cylinderLength / dashLength));
        const segments = [];
        for (let place = 0; place < totalSegments; place++) {
            new_to = new Vector3(new_from.x + dashVector.x, new_from.y + dashVector.y, new_from.z + dashVector.z);
            segments.push({ from: new_from, to: new_to });
            new_from = new Vector3(new_to.x + gapVector.x, new_to.y + gapVector.y, new_to.z + gapVector.z);
        }
        return segments;
    }
    static drawStickImposter(geo: Geometry, from: XYZ, to: XYZ, radius: number, color: Color, fromCap: CAP = 0, toCap: CAP = 0) {
        const geoGroup = geo.updateGeoGroup(4);
        const startv = geoGroup.vertices;
        const start = startv * 3;
        const vertexArray = geoGroup.vertexArray;
        const colorArray = geoGroup.colorArray;
        const radiusArray = geoGroup.radiusArray;
        const normalArray = geoGroup.normalArray;
        const r = color.r;
        const g = color.g;
        const b = color.b;
        const negateColor = function (c) {
            let n = -c;
            if (n == 0) n = -0.0001;
            return n;
        };
        let pos = start;
        for (let i = 0; i < 4; i++) {
            vertexArray[pos] = from.x;
            normalArray[pos] = to.x;
            colorArray[pos] = r;
            pos++;
            vertexArray[pos] = from.y;
            normalArray[pos] = to.y;
            colorArray[pos] = g;
            pos++;
            vertexArray[pos] = from.z;
            normalArray[pos] = to.z;
            if (i < 2)
                colorArray[pos] = b;
            else
                colorArray[pos] = negateColor(b);
            pos++;
        }
        geoGroup.vertices += 4;
        radiusArray[startv] = -radius;
        radiusArray[startv + 1] = radius;
        radiusArray[startv + 2] = -radius;
        radiusArray[startv + 3] = radius;
        const faceArray = geoGroup.faceArray;
        const faceoffset = geoGroup.faceidx; 
        faceArray[faceoffset + 0] = startv;
        faceArray[faceoffset + 1] = startv + 1;
        faceArray[faceoffset + 2] = startv + 2;
        faceArray[faceoffset + 3] = startv + 2;
        faceArray[faceoffset + 4] = startv + 3;
        faceArray[faceoffset + 5] = startv;
        geoGroup.faceidx += 6;
    }
    private drawBondSticks(atom: AtomSpec, atoms: AtomSpec[], geo: Geometry) {
        if (!atom.style.stick)
            return;
        const style = atom.style.stick;
        if (style.hidden)
            return;
        const atomBondR = style.radius || this.defaultStickRadius;
        const doubleBondScale = style.doubleBondScaling || 0.4;
        const tripleBondScale = style.tripleBondScaling || 0.25;
        const bondDashLength = style.dashedBondConfig?.dashLength || 0.1;
        const bondGapLength = style.dashedBondConfig?.gapLength || 0.25;
        let bondR = atomBondR;
        const atomSingleBond = style.singleBonds || false;
        const atomDashedBonds = style.dashedBonds || false;
        let fromCap = 0, toCap = 0;
        let atomneedsi, atom2needsi, i, singleBond, bstyle;
        let cylinder1a, cylinder1b, cylinder1c, cylinder2a, cylinder2b, cylinder2c;
        let C1 = getColorFromStyle(atom, style);
        let mp, mp2, mp3;
        if (!atom.capDrawn && atom.bonds.length < 4)
            fromCap = 2;
        const selectCylDrawMethod = (bondOrder) => {
            const drawMethod = geo.imposter ? ModelDeMol.drawStickImposter : GLDraw.drawCylinder;
            if (!atomDashedBonds && bondOrder >= 1) {
                return drawMethod;
            }
            return (geo, from, to, radius, color, fromCap = 0, toCap = 0, dashLength = 0.1, gapLength = 0.25) => {
                const segments = this.calculateDashes(from, to, radius, dashLength, gapLength);
                segments.forEach(segment => {
                    drawMethod(geo, segment.from, segment.to, radius, color, fromCap, toCap);
                });
            };
        };
        for (i = 0; i < atom.bonds.length; i++) {
            const drawCyl = selectCylDrawMethod(atom.bondOrder[i]);
            const j = atom.bonds[i]; 
            const atom2 = atoms[j]; 
            mp = mp2 = mp3 = null;
            if (atom.index < atom2.index) {
                const style2 = atom2.style;
                if (!style2.stick || style2.stick.hidden)
                    continue; 
                let C2 = getColorFromStyle(atom2, style2.stick);
                bondR = atomBondR;
                singleBond = atomSingleBond;
                if (atom.bondStyles && atom.bondStyles[i]) {
                    bstyle = atom.bondStyles[i];
                    if (bstyle.iswire) {
                        continue;
                    }
                    if (bstyle.radius) bondR = bstyle.radius;
                    if (bstyle.singleBond) singleBond = true;
                    if (typeof (bstyle.color1) != "undefined") {
                        C1 = CC.color(bstyle.color1);
                    }
                    if (typeof (bstyle.color2) != "undefined") {
                        C2 = CC.color(bstyle.color2);
                    }
                }
                const p1 = new Vector3(atom.x, atom.y, atom.z);
                const p2 = new Vector3(atom2.x, atom2.y, atom2.z);
                if (atom.bondOrder[i] <= 1 || singleBond || atom.bondOrder[i] > 3) { 
                    if (atom.bondOrder[i] < 1) bondR *= atom.bondOrder[i];
                    if (!atom2.capDrawn && atom2.bonds.length < 4)
                        toCap = 2;
                    if (C1 != C2) {
                        mp = new Vector3().addVectors(p1, p2)
                            .multiplyScalar(0.5);
                        drawCyl(geo, p1, mp, bondR, C1, fromCap, 0, bondDashLength, bondGapLength);
                        drawCyl(geo, mp, p2, bondR, C2, 0, toCap, bondDashLength, bondGapLength);
                    } else {
                        drawCyl(geo, p1, p2, bondR, C1, fromCap, toCap, bondDashLength, bondGapLength);
                    }
                    atomneedsi = atom.clickable || atom.hoverable;
                    atom2needsi = atom2.clickable || atom2.hoverable;
                    if (atomneedsi || atom2needsi) {
                        if (!mp) mp = new Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                        if (atomneedsi) {
                            const cylinder1 = new Cylinder(p1, mp, bondR);
                            const sphere1 = new Sphere(p1, bondR);
                            atom.intersectionShape.cylinder.push(cylinder1);
                            atom.intersectionShape.sphere.push(sphere1);
                        }
                        if (atom2needsi) {
                            const cylinder2 = new Cylinder(p2, mp, bondR);
                            const sphere2 = new Sphere(p2, bondR);
                            atom2.intersectionShape.cylinder.push(cylinder2);
                            atom2.intersectionShape.sphere.push(sphere2);
                        }
                    }
                }
                else if (atom.bondOrder[i] > 1) {
                    let mfromCap = 0;
                    let mtoCap = 0;
                    if (bondR != atomBondR) {
                        mfromCap = 2;
                        mtoCap = 2;
                    }
                    const dir = p2.clone();
                    let v = null;
                    dir.sub(p1);
                    var r, p1a, p1b, p2a, p2b;
                    v = this.getSideBondV(atom, atom2, i);
                    if (atom.bondOrder[i] == 2) {
                        r = bondR * doubleBondScale;
                        v.multiplyScalar(r * 1.5);
                        p1a = p1.clone();
                        p1a.add(v);
                        p1b = p1.clone();
                        p1b.sub(v);
                        p2a = p1a.clone();
                        p2a.add(dir);
                        p2b = p1b.clone();
                        p2b.add(dir);
                        if (C1 != C2) {
                            mp = new Vector3().addVectors(p1a, p2a)
                                .multiplyScalar(0.5);
                            mp2 = new Vector3().addVectors(p1b, p2b)
                                .multiplyScalar(0.5);
                            drawCyl(geo, p1a, mp, r, C1, mfromCap, 0);
                            drawCyl(geo, mp, p2a, r, C2, 0, mtoCap);
                            drawCyl(geo, p1b, mp2, r, C1, mfromCap, 0);
                            drawCyl(geo, mp2, p2b, r, C2, 0, mtoCap);
                        } else {
                            drawCyl(geo, p1a, p2a, r, C1, mfromCap, mtoCap);
                            drawCyl(geo, p1b, p2b, r, C1, mfromCap, mtoCap);
                        }
                        atomneedsi = atom.clickable || atom.hoverable;
                        atom2needsi = atom2.clickable || atom2.hoverable;
                        if (atomneedsi || atom2needsi) {
                            if (!mp) mp = new Vector3().addVectors(p1a, p2a)
                                .multiplyScalar(0.5);
                            if (!mp2) mp2 = new Vector3().addVectors(p1b, p2b)
                                .multiplyScalar(0.5);
                            if (atomneedsi) {
                                cylinder1a = new Cylinder(p1a, mp, r);
                                cylinder1b = new Cylinder(p1b, mp2, r);
                                atom.intersectionShape.cylinder.push(cylinder1a);
                                atom.intersectionShape.cylinder.push(cylinder1b);
                            }
                            if (atom2needsi) {
                                cylinder2a = new Cylinder(p2a, mp, r);
                                cylinder2b = new Cylinder(p2b, mp2, r);
                                atom2.intersectionShape.cylinder.push(cylinder2a);
                                atom2.intersectionShape.cylinder.push(cylinder2b);
                            }
                        }
                    }
                    else if (atom.bondOrder[i] == 3) {
                        r = bondR * tripleBondScale;
                        v.cross(dir);
                        v.normalize();
                        v.multiplyScalar(r * 3);
                        p1a = p1.clone();
                        p1a.add(v);
                        p1b = p1.clone();
                        p1b.sub(v);
                        p2a = p1a.clone();
                        p2a.add(dir);
                        p2b = p1b.clone();
                        p2b.add(dir);
                        if (C1 != C2) {
                            mp = new Vector3().addVectors(p1a, p2a)
                                .multiplyScalar(0.5);
                            mp2 = new Vector3().addVectors(p1b, p2b)
                                .multiplyScalar(0.5);
                            mp3 = new Vector3().addVectors(p1, p2)
                                .multiplyScalar(0.5);
                            drawCyl(geo, p1a, mp, r, C1, mfromCap, 0);
                            drawCyl(geo, mp, p2a, r, C2, 0, mtoCap);
                            drawCyl(geo, p1, mp3, r, C1, fromCap, 0);
                            drawCyl(geo, mp3, p2, r, C2, 0, toCap);
                            drawCyl(geo, p1b, mp2, r, C1, mfromCap, 0);
                            drawCyl(geo, mp2, p2b, r, C2, 0, mtoCap);
                        } else {
                            drawCyl(geo, p1a, p2a, r, C1, mfromCap, mtoCap);
                            drawCyl(geo, p1, p2, r, C1, fromCap, toCap);
                            drawCyl(geo, p1b, p2b, r, C1, mfromCap, mtoCap);
                        }
                        atomneedsi = atom.clickable || atom.hoverable;
                        atom2needsi = atom2.clickable || atom2.hoverable;
                        if (atomneedsi || atom2needsi) {
                            if (!mp) mp = new Vector3().addVectors(p1a, p2a)
                                .multiplyScalar(0.5);
                            if (!mp2) mp2 = new Vector3().addVectors(p1b, p2b)
                                .multiplyScalar(0.5);
                            if (!mp3) mp3 = new Vector3().addVectors(p1, p2)
                                .multiplyScalar(0.5);
                            if (atomneedsi) {
                                cylinder1a = new Cylinder(p1a.clone(), mp.clone(), r);
                                cylinder1b = new Cylinder(p1b.clone(), mp2.clone(), r);
                                cylinder1c = new Cylinder(p1.clone(), mp3.clone(), r);
                                atom.intersectionShape.cylinder.push(cylinder1a);
                                atom.intersectionShape.cylinder.push(cylinder1b);
                                atom.intersectionShape.cylinder.push(cylinder1c);
                            }
                            if (atom2needsi) {
                                cylinder2a = new Cylinder(p2a.clone(), mp.clone(), r);
                                cylinder2b = new Cylinder(p2b.clone(), mp2.clone(), r);
                                cylinder2c = new Cylinder(p2.clone(), mp3.clone(), r);
                                atom2.intersectionShape.cylinder.push(cylinder2a);
                                atom2.intersectionShape.cylinder.push(cylinder2b);
                                atom2.intersectionShape.cylinder.push(cylinder2c);
                            }
                        }
                    }
                }
            }
        }
        let drawSphere = false;
        let numsinglebonds = 0;
        let differentradii = false;
        for (i = 0; i < atom.bonds.length; i++) {
            singleBond = atomSingleBond;
            if (atom.bondStyles && atom.bondStyles[i]) {
                bstyle = atom.bondStyles[i];
                if (bstyle.singleBond) singleBond = true;
                if (bstyle.radius && bstyle.radius != atomBondR) {
                    differentradii = true;
                }
            }
            if (singleBond || atom.bondOrder[i] == 1) {
                numsinglebonds++;
            }
        }
        if (differentradii) { 
            if (numsinglebonds > 0) drawSphere = true; 
        }
        else if (numsinglebonds == 0 && (atom.bonds.length > 0 || style.showNonBonded)) {
            drawSphere = true;
        }
        if (drawSphere) {
            bondR = atomBondR;
            if (geo.imposter) {
                this.drawSphereImposter(geo.sphereGeometry, atom as XYZ, bondR, C1);
            }
            else {
                GLDraw.drawSphere(geo, atom, bondR, C1);
            }
        }
    }
    private createMolObj(atoms: AtomSpec[], options?) {
        options = options || {};
        const ret = new Object3D();
        const cartoonAtoms = [];
        const lineGeometries: Record<number, Geometry> = {};
        const crossGeometries: Record<number, Geometry> = {};
        let drawSphereFunc = this.drawAtomSphere;
        let sphereGeometry: Geometry = null;
        let stickGeometry: Geometry = null;
        if (options.supportsImposters) {
            drawSphereFunc = this.drawAtomImposter;
            sphereGeometry = new Geometry(true);
            sphereGeometry.imposter = true;
            stickGeometry = new Geometry(true, true);
            stickGeometry.imposter = true;
            stickGeometry.sphereGeometry = new Geometry(true); 
            stickGeometry.sphereGeometry.imposter = true;
            stickGeometry.drawnCaps = {};
        }
        else if (options.supportsAIA) {
            drawSphereFunc = this.drawAtomInstanced;
            sphereGeometry = new Geometry(false, true, true);
            sphereGeometry.instanced = true;
            stickGeometry = new Geometry(true); 
        } else {
            sphereGeometry = new Geometry(true);
            stickGeometry = new Geometry(true);
        }
        let i, j, n, testOpacities;
        const opacities: any = {};
        const range = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
        for (i = 0, n = atoms.length; i < n; i++) {
            const atom = atoms[i];
            if (atom && atom.style) {
                if ((atom.clickable || atom.hoverable) && atom.intersectionShape === undefined)
                    atom.intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
                testOpacities = { line: undefined, cross: undefined, stick: undefined, sphere: undefined };
                for (j in testOpacities) {
                    if (atom.style[j]) {
                        if (atom.style[j].opacity)
                            testOpacities[j] = parseFloat(atom.style[j].opacity);
                        else
                            testOpacities[j] = 1;
                    } else testOpacities[j] = undefined;
                    if (opacities[j]) {
                        if (testOpacities[j] != undefined && opacities[j] != testOpacities[j]) {
                            console.log("Warning: " + j + " opacity is ambiguous");
                            opacities[j] = 1;
                        }
                    } else opacities[j] = testOpacities[j];
                }
                drawSphereFunc.call(this, atom, sphereGeometry);
                this.drawAtomClickSphere(atom);
                this.drawAtomCross(atom, crossGeometries);
                this.drawBondLines(atom, atoms, lineGeometries);
                this.drawBondSticks(atom, atoms, stickGeometry);
                if (typeof (atom.style.cartoon) !== "undefined" && !atom.style.cartoon.hidden) {
                    if (atom.style.cartoon.color === "spectrum" && typeof (atom.resi) === "number" && !atom.hetflag) {
                        if (atom.resi < range[0])
                            range[0] = atom.resi;
                        if (atom.resi > range[1])
                            range[1] = atom.resi;
                    }
                    cartoonAtoms.push(atom);
                }
            }
        }
        if (cartoonAtoms.length > 0) {
            drawCartoon(ret, cartoonAtoms, range, this.defaultCartoonQuality);
        }
        if (sphereGeometry && sphereGeometry.vertices > 0) {
            sphereGeometry.initTypedArrays();
            let sphereMaterial = null;
            let sphere = null;
            if (sphereGeometry.imposter) {
                sphereMaterial = new SphereImposterMaterial({
                    ambient: 0x000000,
                    vertexColors: true,
                    reflectivity: 0
                });
            }
            else if (sphereGeometry.instanced) {
                sphere = new Geometry(true);
                GLDraw.drawSphere(sphere, { x: 0, y: 0, z: 0 }, 1, new Color(0.5, 0.5, 0.5));
                sphere.initTypedArrays();
                sphereMaterial = new InstancedMaterial({
                    sphereMaterial: new MeshLambertMaterial({
                        ambient: 0x000000,
                        vertexColors: true,
                        reflectivity: 0,
                    }),
                    sphere: sphere
                });
            }
            else { 
                sphereMaterial = new MeshLambertMaterial({
                    ambient: 0x000000,
                    vertexColors: true,
                    reflectivity: 0,
                });
            }
            if (opacities.sphere < 1 && opacities.sphere >= 0) {
                sphereMaterial.transparent = true;
                sphereMaterial.opacity = opacities.sphere;
            }
            sphere = new Mesh(sphereGeometry, sphereMaterial);
            ret.add(sphere);
        }
        if (stickGeometry.vertices > 0) {
            let stickMaterial = null;
            let ballMaterial = null;
            let balls = stickGeometry.sphereGeometry;
            if (!balls || typeof (balls.vertices) === 'undefined' || balls.vertices == 0) balls = null; 
            stickGeometry.initTypedArrays();
            if (balls) balls.initTypedArrays();
            const matvals = { ambient: 0x000000, vertexColors: true, reflectivity: 0 };
            if (stickGeometry.imposter) {
                stickMaterial = new StickImposterMaterial(matvals);
                ballMaterial = new SphereImposterMaterial(matvals);
            } else {
                stickMaterial = new MeshLambertMaterial(matvals);
                ballMaterial = new MeshLambertMaterial(matvals);
                if (stickMaterial.wireframe) {
                    stickGeometry.setUpWireframe();
                    if (balls) balls.setUpWireframe();
                }
            }
            if (opacities.stick < 1 && opacities.stick >= 0) {
                stickMaterial.transparent = true;
                stickMaterial.opacity = opacities.stick;
                ballMaterial.transparent = true;
                ballMaterial.opacity = opacities.stick;
            }
            const sticks = new Mesh(stickGeometry, stickMaterial);
            ret.add(sticks);
            if (balls) {
                const stickspheres = new Mesh(balls, ballMaterial);
                ret.add(stickspheres);
            }
        }
        let linewidth;
        for (i in lineGeometries) {
            if (lineGeometries.hasOwnProperty(i)) {
                linewidth = i;
                const lineMaterial = new LineBasicMaterial({
                    linewidth: linewidth,
                    vertexColors: true
                });
                if (opacities.line < 1 && opacities.line >= 0) {
                    lineMaterial.transparent = true;
                    lineMaterial.opacity = opacities.line;
                }
                lineGeometries[i].initTypedArrays();
                const line = new Line(lineGeometries[i], lineMaterial as Material, LineStyle.LinePieces);
                ret.add(line);
            }
        }
        for (i in crossGeometries) {
            if (crossGeometries.hasOwnProperty(i)) {
                linewidth = i;
                const crossMaterial = new LineBasicMaterial({
                    linewidth: linewidth,
                    vertexColors: true
                });
                if (opacities.cross < 1 && opacities.cross >= 0) {
                    crossMaterial.transparent = true;
                    crossMaterial.opacity = opacities.cross;
                }
                crossGeometries[i].initTypedArrays();
                const cross = new Line(crossGeometries[i], crossMaterial as Material, LineStyle.LinePieces);
                ret.add(cross);
            }
        }
        if (this.dontDuplicateAtoms && this.modelData.symmetries && this.modelData.symmetries.length > 0) {
            const finalRet = new Object3D();
            let t;
            for (t = 0; t < this.modelData.symmetries.length; t++) {
                let transformedRet = new Object3D();
                transformedRet = ret.clone();
                transformedRet.matrix.copy(this.modelData.symmetries[t]);
                transformedRet.matrixAutoUpdate = false;
                finalRet.add(transformedRet);
            }
            return finalRet;
        }
        return ret;
    }
    public getInternalState() {
        return {
            'atoms': this.atoms,
            'frames': this.frames
        };
    }
    public setInternalState(state) {
        this.atoms = state.atoms;
        this.frames = state.frames;
        this.molObj = null;
    }
    public getCrystData() {
        if (this.modelData.cryst) {
            if (!this.modelData.cryst.matrix) {
                const cryst = this.modelData.cryst;
                this.modelData.cryst.matrix = conversionMatrix3(
                    cryst.a, cryst.b, cryst.c,
                    cryst.alpha, cryst.beta, cryst.gamma
                );
            }
            return this.modelData.cryst;
        } else {
            return null;
        }
    }
    public setCrystData(a?: number, b?: number, c?: number, alpha?: number, beta?: number, gamma?: number) {
        a = a || 1.0;
        b = b || 1.0;
        c = c || 1.0;
        alpha = alpha || 90;
        beta = beta || 90;
        gamma = gamma || 90;
        const matrix = conversionMatrix3(a, b, c, alpha, beta, gamma);
        this.modelData.cryst = {
            'a': a, 'b': b, 'c': c,
            'alpha': alpha, 'beta': beta, 'gamma': gamma,
            'matrix': matrix
        };
    }
    public setCrystMatrix(matrix: Matrix3) {
        matrix = matrix || new Matrix3(
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        );
        this.modelData.cryst = {
            'matrix': matrix
        };
    }
    public getSymmetries() {
        if (typeof (this.modelData.symmetries) == 'undefined') {
            this.modelData.symmetries = [this.idMatrix];
        }
        return this.modelData.symmetries;
    }
    public setSymmetries(list) {
        if (typeof (list) == "undefined") { 
            this.modelData.symmetries = [this.idMatrix];
        }
        else {
            this.modelData.symmetries = list;
        }
    }
    public getID() {
        return this.id;
    }
    public getNumFrames() {
        return (this.frames.numFrames != undefined) ? this.frames.numFrames : this.frames.length;
    }
    private adjustCoord(x1: number, x2: number, margin: number, adjust: number) {
        const dist = x2 - x1;
        if (dist < -margin) {
            return x2 + adjust;
        } else if (dist > margin) {
            return x2 - adjust;
        }
        return x2;
    }
    private adjustCoordinatesToBox() {
        if (!this.box) return;
        if (!this.atomdfs) return;
        const bx = this.box[0];
        const by = this.box[1];
        const bz = this.box[2];
        const mx = bx * 0.9;
        const my = by * 0.9;
        const mz = bz * 0.9;
        for (let c = 0; c < this.atomdfs.length; c++) {
            const component = this.atomdfs[c];
            for (let i = 1; i < component.length; i++) {
                const atom = this.atoms[component[i][0]];
                const prev = this.atoms[component[i][1]];
                atom.x = this.adjustCoord(prev.x, atom.x, mx, bx);
                atom.y = this.adjustCoord(prev.y, atom.y, my, by);
                atom.z = this.adjustCoord(prev.z, atom.z, mz, bz);
            }
        }
    }
    public setFrame(framenum: number, viewer?: Viewer3D) { 
        const numFrames = this.getNumFrames();
        const model = this;
        return new Promise<void>(function (resolve, reject) {
            if (numFrames == 0) {
                resolve();
            }
            if (framenum < 0 || framenum >= numFrames) {
                framenum = numFrames - 1;
            }
            if (model.frames.url != undefined) {
                const url = model.frames.url;
                getbin(url + "/traj/frame/" + framenum + "/" + model.frames.path, undefined, 'POST', undefined).then(function (buffer) {
                    const values = new Float32Array(buffer, 44);
                    let count = 0;
                    for (let i = 0; i < model.atoms.length; i++) {
                        model.atoms[i].x = values[count++];
                        model.atoms[i].y = values[count++];
                        model.atoms[i].z = values[count++];
                    }
                    if (model.box && model.atomdfs) {
                        model.adjustCoordinatesToBox();
                    }
                    resolve();
                }).catch(reject);
            }
            else {
                model.atoms = model.frames[framenum];
                resolve();
            }
            model.molObj = null;
            if (model.modelDatas && framenum < model.modelDatas.length) {
                model.modelData = model.modelDatas[framenum];
                if (model.unitCellObjects && viewer) {
                    viewer.removeUnitCell(model);
                    viewer.addUnitCell(model);
                }
            }
        });
    }
    public addFrame(atoms: AtomSpec[]) {
        this.frames.push(atoms);
    }
    public vibrate(numFrames: number = 10, amplitude: number = 1, bothWays: boolean = false, viewer?: Viewer3D, arrowSpec?: ArrowSpec) {
        let start = 0;
        let end = numFrames;
        if (bothWays) {
            start = -numFrames;
            end = numFrames;
        }
        if (this.frames !== undefined && this.frames.origIndex !== undefined) {
            this.setFrame(this.frames.origIndex);
        } else {
            this.setFrame(0);
        }
        if (start < end) this.frames = []; 
        if (bothWays) this.frames.origIndex = numFrames;
        for (let i = start; i < end; i++) {
            const newAtoms = [];
            const currframe = this.frames.length;
            if (i == 0 && !arrowSpec) { 
                this.frames.push(this.atoms);
                continue;
            }
            for (let j = 0; j < this.atoms.length; j++) {
                const dx = getAtomProperty(this.atoms[j], 'dx');
                const dy = getAtomProperty(this.atoms[j], 'dy');
                const dz = getAtomProperty(this.atoms[j], 'dz');
                const newVector = new Vector3(dx, dy, dz);
                const starting = new Vector3(this.atoms[j].x, this.atoms[j].y, this.atoms[j].z);
                const mult = (i * amplitude) / numFrames;
                newVector.multiplyScalar(mult);
                starting.add(newVector);
                const newAtom: any = {};
                for (const k in this.atoms[j]) {
                    newAtom[k] = this.atoms[j][k];
                }
                newAtom.x = starting.x;
                newAtom.y = starting.y;
                newAtom.z = starting.z;
                newAtoms.push(newAtom);
                if (viewer && arrowSpec) {
                    const spec = extend({}, arrowSpec);
                    const arrowend = new Vector3(dx, dy, dz);
                    arrowend.multiplyScalar(amplitude);
                    arrowend.add(starting);
                    spec.start = starting;
                    spec.end = arrowend;
                    spec.frame = currframe;
                    if (!spec.color) {
                        let s = newAtom.style.sphere;
                        if (!s) s = newAtom.style.stick;
                        if (!s) s = newAtom.style.line;
                        spec.color = getColorFromStyle(newAtom, s);
                    }
                    viewer.addArrow(spec);
                }
            }
            this.frames.push(newAtoms);
        }
    }
    public setAtomDefaults(atoms: AtomSpec[]) {
        for (let i = 0; i < atoms.length; i++) {
            const atom = atoms[i];
            if (atom) {
                atom.style = atom.style || deepCopy(ModelDeMol.defaultAtomStyle);
                atom.color = atom.color || this.ElementColors[atom.elem] || this.defaultColor;
                atom.model = this.id;
                if (atom.clickable || atom.hoverable)
                    atom.intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
            }
        }
    }
    public addMolData(data: string | ArrayBuffer, format: string, options: ParserConfig = {}) {
        const parsedAtoms = ModelDeMol.parseMolData(data, format, options);
        this.dontDuplicateAtoms = !options.duplicateAssemblyAtoms;
        const mData = parsedAtoms.modelData;
        if (mData) {
            if (Array.isArray(mData)) {
                this.modelData = mData[0];
                if (options.frames) {
                    this.modelDatas = mData;
                }
            } else {
                this.modelData = mData;
            }
        }
        if (parsedAtoms.box) {
            this.box = parsedAtoms.box;
        } else {
            this.box = null;
        }
        if (this.frames.length == 0) { 
            for (let i = 0; i < parsedAtoms.length; i++) {
                if (parsedAtoms[i].length != 0)
                    this.frames.push(parsedAtoms[i]);
            }
            if (this.frames[0])
                this.atoms = this.frames[0];
        }
        else { 
            if (options.frames) { 
                for (let i = 0; i < parsedAtoms.length; i++) {
                    this.frames.push(parsedAtoms[i]);
                }
            }
            else { 
                for (let i = 0; i < parsedAtoms.length; i++) {
                    this.addAtoms(parsedAtoms[i]);
                }
            }
        }
        for (let i = 0; i < this.frames.length; i++) {
            this.setAtomDefaults(this.frames[i]);
        }
        if (options.vibrate && options.vibrate.frames && options.vibrate.amplitude) {
            this.vibrate(options.vibrate.frames, options.vibrate.amplitude);
        }
        if (options.style) {
            this.setStyle({}, options.style);
        }
    }
    public setDontDuplicateAtoms(dup: boolean) {
        this.dontDuplicateAtoms = dup;
    }
    public setModelData(mData) {
        this.modelData = mData;
    }
    private propertyMatches(atomval, val) {
        if (atomval == val) {
            return true;
        } else if (typeof (val) == 'string' && typeof (atomval) == 'number') {
            const match = val.match(/(-?\d+)\s*-\s*(-?\d+)/);
            if (match) {
                const lo = parseInt(match[1]);
                const hi = parseInt(match[2]);
                if (match && atomval >= lo && atomval <= hi) {
                    return true;
                }
            }
        }
        return false;
    }
    private static deepCopyAndCache(selobject, model) {
        if (typeof selobject != 'object' || selobject == null) return selobject;
        if (selobject.__cache_created) return selobject; 
        const copy: any = {};
        for (const key in selobject) {
            const item = selobject[key];
            if (Array.isArray(item)) {
                copy[key] = [];
                for (let i = 0; i < item.length; i++) {
                    copy[key].push(ModelDeMol.deepCopyAndCache(item[i], model));
                }
            } else if (typeof item === "object" && key != "properties" && key != "model") {
                copy[key] = ModelDeMol.deepCopyAndCache(item, model);
            } else {
                copy[key] = item;
            }
            if (key == "and" || key == "or") {
                const results = [];
                for (const subSelection of copy[key]) {
                    const set = new Set();
                    for (const match of model.selectedAtoms(subSelection)) {
                        set.add(match.index);
                    }
                    results.push(set);
                }
                if (key == "and") {
                    const intersect = function (first, other) {
                        const result = new Set();
                        for (const elem of other) {
                            if (first.has(elem)) {
                                result.add(elem);
                            }
                        }
                        return result;
                    };
                    let intersection = new Set(results[0]);
                    for (const set of results.splice(1)) {
                        intersection = intersect(intersection, set);
                    }
                    copy[key].__cached_results = intersection;
                } else if (key == "or") {
                    const union = new Set();
                    for (const set of results) {
                        for (const elem of set) {
                            union.add(elem);
                        }
                    }
                    copy[key].__cached_results = union;
                }
            }
        }
        copy.__cache_created = true;
        return copy;
    }
    private static readonly ignoredKeys = new Set<string>(["props", "invert", "model", "frame", "byres", "expand", "within", "and", "or", "not"]);
    public atomIsSelected(atom: AtomSpec, sel?: AtomSelectionSpec) {
        if (typeof (sel) === "undefined")
            return true; 
        const invert = !!sel.invert;
        let ret = true;
        for (const key in sel) {
            if (key == "and" || key == "or" || key == "not") {  
                if (key == "not") {
                    if (this.atomIsSelected(atom, sel[key])) {
                        ret = false;
                        break;
                    }
                } else { 
                    if (sel[key].__cached_results === undefined) {
                        sel = ModelDeMol.deepCopyAndCache(sel, this);
                    }
                    ret = sel[key].__cached_results.has(atom.index);
                    if (!ret) {
                        break;
                    }
                }
            } else if (key === 'predicate') { 
                if (!sel.predicate(atom)) {
                    ret = false;
                    break;
                }
            }
            else if (key == "properties" && atom[key]) {
                for (const propkey in sel.properties) {
                    if (propkey.startsWith("__cache")) continue;
                    if (typeof (atom.properties[propkey]) === 'undefined') {
                        ret = false;
                        break;
                    }
                    if (atom.properties[propkey] != sel.properties[propkey]) {
                        ret = false;
                        break;
                    }
                }
            }
            else if (sel.hasOwnProperty(key) && !ModelDeMol.ignoredKeys.has(key) && !key.startsWith('__cache')) {
                if (typeof (atom[key]) === "undefined") {
                    ret = false;
                    break;
                }
                let isokay = false;
                if (key === "bonds") {
                    const val = sel[key];
                    if (val != atom.bonds.length) {
                        ret = false;
                        break;
                    }
                }
                else if (Array.isArray(sel[key])) {
                    const valarr = sel[key];
                    const atomval = atom[key];
                    for (let i = 0; i < valarr.length; i++) {
                        if (this.propertyMatches(atomval, valarr[i])) {
                            isokay = true;
                            break;
                        }
                    }
                    if (!isokay) {
                        ret = false;
                        break;
                    }
                } else { 
                    const val = sel[key];
                    if (!this.propertyMatches(atom[key], val)) {
                        ret = false;
                        break;
                    }
                }
            }
        }
        return invert ? !ret : ret;
    }
    private static squaredDistance(atom1: XYZ | AtomSpec, atom2: XYZ | AtomSpec) {
        const xd = atom2.x - atom1.x;
        const yd = atom2.y - atom1.y;
        const zd = atom2.z - atom1.z;
        return xd * xd + yd * yd + zd * zd;
    }
    private expandAtomList(atomList: AtomSpec[], amt: number) {
        if (amt <= 0) return atomList;
        const pb = getExtent(atomList, undefined); 
        const nb = [[], [], []]; 
        for (let i = 0; i < 3; i++) {
            nb[0][i] = pb[0][i] - amt;
            nb[1][i] = pb[1][i] + amt;
            nb[2][i] = pb[2][i];
        }
        const expand = [];
        for (let i = 0; i < this.atoms.length; i++) {
            const x = this.atoms[i].x;
            const y = this.atoms[i].y;
            const z = this.atoms[i].z;
            if (x >= nb[0][0] && x <= nb[1][0] && y >= nb[0][1] && y <= nb[1][1] && z >= nb[0][2] && z <= nb[1][2]) {
                if (!(x >= pb[0][0] && x <= pb[1][0] && y >= pb[0][1] && y <= pb[1][1] && z >= pb[0][2] && z <= pb[1][2])) {
                    expand.push(this.atoms[i]);
                }
            }
        }
        return expand;
    }
    private static getFloat(val: string | number): number {
        if (typeof (val) === 'number')
            return val;
        else
            return parseFloat(val);
    }
    public selectedAtoms(sel: AtomSelectionSpec, from?: AtomSpec[]): AtomSpec[] {
        let ret = [];
        sel = ModelDeMol.deepCopyAndCache(sel || {}, this);
        if (!from) from = this.atoms;
        const aLength = from.length;
        for (let i = 0; i < aLength; i++) {
            const atom = from[i];
            if (atom) {
                if (this.atomIsSelected(atom, sel))
                    ret.push(atom);
            }
        }
        if (sel.hasOwnProperty("expand")) {
            const exdist: number = ModelDeMol.getFloat(sel.expand);
            const expand = this.expandAtomList(ret, exdist);
            const retlen = ret.length;
            const thresh = exdist * exdist;
            for (let i = 0; i < expand.length; i++) {
                for (let j = 0; j < retlen; j++) {
                    const dist = ModelDeMol.squaredDistance(expand[i], ret[j]);
                    if (dist < thresh && dist > 0) {
                        ret.push(expand[i]);
                    }
                }
            }
        }
        if (sel.hasOwnProperty("within") && sel.within.hasOwnProperty("sel") &&
            sel.within.hasOwnProperty("distance")) {
            const sel2 = this.selectedAtoms(sel.within.sel, this.atoms);
            const within = {};
            const dist = ModelDeMol.getFloat(sel.within.distance);
            const thresh = dist * dist;
            for (let i = 0; i < sel2.length; i++) {
                for (let j = 0; j < ret.length; j++) {
                    const dist = ModelDeMol.squaredDistance(sel2[i], ret[j]);
                    if (dist < thresh && dist > 0) {
                        within[j] = 1;
                    }
                }
            }
            const newret = [];
            if (sel.within.invert) {
                for (let j = 0; j < ret.length; j++) {
                    if (!within[j]) newret.push(ret[j]);
                }
            } else {
                for (const j in within) {
                    newret.push(ret[j]);
                }
            }
            ret = newret;
        }
        if (sel.hasOwnProperty("byres")) {
            const vResis = {};
            const vAtoms = [];
            const stack = [];
            for (let i = 0; i < ret.length; i++) {
                let atom = ret[i];
                let c = atom.chain;
                let r = atom.resi;
                if (vResis[c] === undefined) vResis[c] = {};
                if (atom.hasOwnProperty("resi") && vResis[c][r] === undefined) {
                    vResis[c][r] = true;
                    stack.push(atom);
                    while (stack.length > 0) {
                        atom = stack.pop();
                        c = atom.chain;
                        r = atom.resi;
                        if (vAtoms[atom.index] === undefined) {
                            vAtoms[atom.index] = true;
                            for (let j = 0; j < atom.bonds.length; j++) {
                                const atom2 = this.atoms[atom.bonds[j]];
                                if (vAtoms[atom2.index] === undefined && atom2.hasOwnProperty("resi") && atom2.chain == c && atom2.resi == r) {
                                    stack.push(atom2);
                                    ret.push(atom2);
                                }
                            }
                        }
                    }
                }
            }
        }
        return ret;
    }
    public addAtoms(newatoms: AtomSpec[]) {
        this.molObj = null;
        const start = this.atoms.length;
        const indexmap = [];
        let i;
        for (i = 0; i < newatoms.length; i++) {
            if (typeof (newatoms[i].index) == "undefined")
                newatoms[i].index = i;
            if (typeof (newatoms[i].serial) == "undefined")
                newatoms[i].serial = i;
            indexmap[newatoms[i].index] = start + i;
        }
        for (i = 0; i < newatoms.length; i++) {
            const olda = newatoms[i];
            const nindex = indexmap[olda.index];
            const a = extend({}, olda);
            a.index = nindex;
            a.bonds = [];
            a.bondOrder = [];
            a.model = this.id;
            a.style = a.style || deepCopy(ModelDeMol.defaultAtomStyle);
            if (typeof (a.color) == "undefined")
                a.color = this.ElementColors[a.elem] || this.defaultColor;
            const nbonds = olda.bonds ? olda.bonds.length : 0;
            for (let j = 0; j < nbonds; j++) {
                const neigh = indexmap[olda.bonds[j]];
                if (typeof (neigh) != "undefined") {
                    a.bonds.push(neigh);
                    a.bondOrder.push(olda.bondOrder ? olda.bondOrder[j] : 1);
                }
            }
            this.atoms.push(a);
        }
    }
    public createConnections() {
        createConnections(this.atoms, { createConnections: true });
    }
    public removeAtoms(badatoms: AtomSpec[]) {
        this.molObj = null;
        const baddies = [];
        let i;
        for (i = 0; i < badatoms.length; i++) {
            baddies[badatoms[i].index] = true;
        }
        const newatoms = [];
        for (i = 0; i < this.atoms.length; i++) {
            const a = this.atoms[i];
            if (!baddies[a.index])
                newatoms.push(a);
        }
        this.atoms = [];
        this.addAtoms(newatoms);
    }
    public setStyle(sel: AtomSelectionSpec | AtomStyleSpec | string, style?: AtomStyleSpec | string, add?) {
        if (typeof (style) === 'undefined' && typeof (add) == 'undefined') {
            style = sel as AtomStyleSpec | string;
            sel = {};
        }
        sel = sel as AtomSelectionSpec;
        if (typeof (style) === 'string') {
            style = specStringToObject(style);
        }
        let changedAtoms = false;
        const that = this;
        const setStyleHelper = function (atomArr) {
            const selected = that.selectedAtoms(sel, atomArr);
            for (let i = 0; i < atomArr.length; i++) {
                if (atomArr[i]) atomArr[i].capDrawn = false; 
            }
            for (let i = 0; i < selected.length; i++) {
                changedAtoms = true;
                if (selected[i].clickable || selected[i].hoverable)
                    selected[i].intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
                if (!add) selected[i].style = {};
                for (const s in style as AtomStyleSpec) {
                    if (style.hasOwnProperty(s)) {
                        selected[i].style[s] = selected[i].style[s] || {}; 
                        Object.assign(selected[i].style[s], style[s]);
                    }
                }
            }
        };
        if (sel.frame !== undefined && sel.frame < this.frames.length) { 
            let frame = sel.frame;
            if (frame < 0) frame = this.frames.length + frame;
            setStyleHelper(this.frames[frame]);
        } else {
            setStyleHelper(this.atoms);
            for (let i = 0; i < this.frames.length; i++) {
                if (this.frames[i] !== this.atoms) setStyleHelper(this.frames[i]);
            }
        }
        if (changedAtoms)
            this.molObj = null; 
    }
    public setClickable(sel: AtomSelectionSpec, clickable: boolean, callback) {
        clickable = !!clickable;
        callback = makeFunction(callback);
        if (callback === null) {
            console.log("Callback is not a function");
            return;
        }
        const selected = this.selectedAtoms(sel, this.atoms);
        const len = selected.length;
        for (let i = 0; i < len; i++) {
            selected[i].intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
            selected[i].clickable = clickable;
            if (callback) selected[i].callback = callback;
        }
        if (len > 0) this.molObj = null; 
    }
    public setHoverable(sel: AtomSelectionSpec, hoverable: boolean, hover_callback, unhover_callback) {
        hoverable = !!hoverable;
        hover_callback = makeFunction(hover_callback);
        unhover_callback = makeFunction(unhover_callback);
        if (hover_callback === null) {
            console.log("Hover_callback is not a function");
            return;
        }
        if (unhover_callback === null) {
            console.log("Unhover_callback is not a function");
            return;
        }
        const selected = this.selectedAtoms(sel, this.atoms);
        const len = selected.length;
        for (let i = 0; i < len; i++) {
            selected[i].intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
            selected[i].hoverable = hoverable;
            if (hover_callback) selected[i].hover_callback = hover_callback;
            if (unhover_callback) selected[i].unhover_callback = unhover_callback;
        }
        if (len > 0) this.molObj = null; 
    }
    public enableContextMenu(sel: AtomSelectionSpec, contextMenuEnabled) {
        contextMenuEnabled = !!contextMenuEnabled;
        let i;
        const selected = this.selectedAtoms(sel, this.atoms);
        const len = selected.length;
        for (i = 0; i < len; i++) {
            selected[i].intersectionShape = { sphere: [], cylinder: [], line: [], triangle: [] };
            selected[i].contextMenuEnabled = contextMenuEnabled;
        }
        if (len > 0) this.molObj = null; 
    }
    public setColorByElement(sel: AtomSelectionSpec, colors) {
        if (this.molObj !== null && ModelDeMol.sameObj(colors, this.lastColors))
            return; 
        this.lastColors = colors;
        var atoms = this.selectedAtoms(sel, atoms);
        if (atoms.length > 0)
            this.molObj = null; 
        for (let i = 0; i < atoms.length; i++) {
            const a = atoms[i];
            if (typeof (colors[a.elem]) !== "undefined") {
                a.color = colors[a.elem];
            }
        }
    }
    public setColorByProperty(sel: AtomSelectionSpec, prop: string, scheme: Gradient | string, range?) {
        let i, a;
        var atoms = this.selectedAtoms(sel, atoms);
        this.lastColors = null; 
        if (atoms.length > 0)
            this.molObj = null; 
        if (typeof scheme === 'string' && typeof (Gradient.builtinGradients[scheme]) != "undefined") {
            scheme = new Gradient.builtinGradients[scheme]();
        }
        scheme = scheme as Gradient;
        if (!range) { 
            range = scheme.range();
        }
        if (!range) { 
            range = getPropertyRange(atoms, prop);
        }
        for (i = 0; i < atoms.length; i++) {
            a = atoms[i];
            const val = getAtomProperty(a, prop);
            if (val != null) {
                a.color = scheme.valueToHex(parseFloat(a.properties[prop]), range);
            }
        }
    }
    public setColorByFunction(sel: AtomSelectionSpec, colorfun) {
        var atoms = this.selectedAtoms(sel, atoms);
        if (typeof (colorfun) !== 'function')
            return;
        this.lastColors = null; 
        if (atoms.length > 0)
            this.molObj = null; 
        for (let i = 0; i < atoms.length; i++) {
            const a = atoms[i];
            a.color = colorfun(a);
        }
    }
    public toCDObject(includeStyles: boolean = false) {
        const out: any = { a: [], b: [] };
        if (includeStyles) {
            out.s = [];
        }
        for (let i = 0; i < this.atoms.length; i++) {
            const atomJSON: any = {};
            const atom = this.atoms[i];
            atomJSON.x = atom.x;
            atomJSON.y = atom.y;
            atomJSON.z = atom.z;
            if (atom.elem != "C") {
                atomJSON.l = atom.elem;
            }
            if (includeStyles) {
                let s = 0;
                while (s < out.s.length &&
                    (JSON.stringify(atom.style) !== JSON.stringify(out.s[s]))) {
                    s++;
                }
                if (s === out.s.length) {
                    out.s.push(atom.style);
                }
                if (s !== 0) {
                    atomJSON.s = s;
                }
            }
            out.a.push(atomJSON);
            for (let b = 0; b < atom.bonds.length; b++) {
                const firstAtom = i;
                const secondAtom = atom.bonds[b];
                if (firstAtom >= secondAtom)
                    continue;
                const bond: any = {
                    b: firstAtom,
                    e: secondAtom
                };
                const bondOrder = atom.bondOrder[b];
                if (bondOrder != 1) {
                    bond.o = bondOrder;
                }
                out.b.push(bond);
            }
        }
        return out;
    }
    public globj(group, options) {
        if (this.molObj === null || options.regen) { 
            this.molObj = this.createMolObj(this.atoms, options);
            if (this.renderedMolObj) { 
                group.remove(this.renderedMolObj);
                this.renderedMolObj = null;
            }
            this.renderedMolObj = this.molObj.clone();
            if (this.hidden) {
                this.renderedMolObj.setVisible(false);
                this.molObj.setVisible(false);
            }
            group.add(this.renderedMolObj);
        }
    }
    public exportVRML() {
        const tmpobj = this.createMolObj(this.atoms, { supportsImposters: false, supportsAIA: false });
        return tmpobj.vrml();
    }
    public removegl(group) {
        if (this.renderedMolObj) {
            if (this.renderedMolObj.geometry !== undefined) this.renderedMolObj.geometry.dispose();
            if (this.renderedMolObj.material !== undefined) this.renderedMolObj.material.dispose();
            group.remove(this.renderedMolObj);
            this.renderedMolObj = null;
        }
        this.molObj = null;
    }
    public hide() {
        this.hidden = true;
        if (this.renderedMolObj) this.renderedMolObj.setVisible(false);
        if (this.molObj) this.molObj.setVisible(false);
    }
    public show() {
        this.hidden = false;
        if (this.renderedMolObj) this.renderedMolObj.setVisible(true);
        if (this.molObj) this.molObj.setVisible(true);
    }
    public addPropertyLabels(prop: string, sel: AtomSelectionSpec, viewer: Viewer3D, style: LabelSpec) {
        var atoms = this.selectedAtoms(sel, atoms);
        const mystyle = deepCopy(style);
        for (let i = 0; i < atoms.length; i++) {
            const a = atoms[i];
            let label = null;
            if (typeof (a[prop]) != 'undefined') {
                label = String(a[prop]);
            } else if (typeof (a.properties[prop]) != 'undefined') {
                label = String(a.properties[prop]);
            }
            if (label != null) {
                mystyle.position = a;
                viewer.addLabel(label, mystyle);
            }
        }
    }
    public addResLabels(sel: AtomSelectionSpec, viewer: Viewer3D, style: LabelSpec, byframe: boolean = false) {
        const created_labels = [];
        const helper = function (model, framenum?) {
            var atoms = model.selectedAtoms(sel, atoms);
            const bylabel = {};
            for (let i = 0; i < atoms.length; i++) {
                const a = atoms[i];
                const c = a.chain;
                const resn = a.resn;
                const resi = a.resi;
                const label = resn + '' + resi;
                if (!bylabel[c]) bylabel[c] = {};
                if (!bylabel[c][label]) bylabel[c][label] = [];
                bylabel[c][label].push(a);
            }
            const mystyle = deepCopy(style);
            for (const c in bylabel) {
                if (bylabel.hasOwnProperty(c)) {
                    const labels = bylabel[c];
                    for (const label in labels) {
                        if (labels.hasOwnProperty(label)) {
                            const atoms = labels[label];
                            const sum = new Vector3(0, 0, 0);
                            for (let i = 0; i < atoms.length; i++) {
                                const a = atoms[i];
                                sum.x += a.x;
                                sum.y += a.y;
                                sum.z += a.z;
                            }
                            sum.divideScalar(atoms.length);
                            mystyle.position = sum;
                            mystyle.frame = framenum;
                            const l = viewer.addLabel(label, mystyle, undefined, true);
                            created_labels.push(l);
                        }
                    }
                }
            }
        };
        if (byframe) {
            const n = this.getNumFrames();
            const savedatoms = this.atoms;
            for (let i = 0; i < n; i++) {
                if (this.frames[i]) {
                    this.atoms = this.frames[i];
                    helper(this, i);
                }
            }
            this.atoms = savedatoms;
        } else {
            helper(this);
        }
        return created_labels;
    }
    private setupDFS() {
        this.atomdfs = [];
        const self = this;
        const visited = new Int8Array(this.atoms.length);
        visited.fill(0);
        const search = function (i, prev, component) {
            component.push([i, prev]);
            const atom = self.atoms[i];
            visited[i] = 1;
            for (let b = 0; b < atom.bonds.length; b++) {
                const nexti = atom.bonds[b];
                if (self.atoms[nexti] && !visited[nexti]) {
                    search(nexti, i, component);
                }
            }
        };
        for (let i = 0; i < this.atoms.length; i++) {
            const atom = this.atoms[i];
            if (atom && !visited[i]) {
                const component = [];
                search(i, -1, component);
                this.atomdfs.push(component);
            }
        }
    }
    public setCoordinatesFromURL(url: string, path: string) {
        this.frames = [];
        const self = this;
        if (this.box) this.setupDFS();
        if (!url.startsWith('http'))
            url = 'http:
        return get(url + "/traj/numframes/" + path, function (numFrames) {
            if (!isNaN(parseInt(numFrames))) {
                self.frames.push(self.atoms);
                self.frames.numFrames = numFrames;
                self.frames.url = url;
                self.frames.path = path;
                return self.setFrame(0);
            }
        });
    }
    public setCoordinates(str: string | ArrayBuffer, format: string) {
        format = format || "";
        if (!str)
            return []; 
        if (/\.gz$/.test(format)) {
            format = format.replace(/\.gz$/, '');
            try {
                str = inflateString(str)
            } catch (err) {
                console.log(err);
            }
        }
        const supportedFormats = { "mdcrd": "", "inpcrd": "", "pdb": "", "netcdf": "", "array": "" };
        if (supportedFormats.hasOwnProperty(format)) {
            this.frames = [];
            const atomCount = this.atoms.length;
            const values = ModelDeMol.parseCrd(str, format);
            let count = 0;
            while (count < values.length) {
                const temp = [];
                for (let i = 0; i < atomCount; i++) {
                    const newAtom = {};
                    for (const k in this.atoms[i]) {
                        newAtom[k] = this.atoms[i][k];
                    }
                    temp[i] = newAtom;
                    temp[i].x = values[count++];
                    temp[i].y = values[count++];
                    temp[i].z = values[count++];
                }
                this.frames.push(temp);
            }
            this.atoms = this.frames[0];
            return this.frames;
        }
        return [];
    }
    public addAtomSpecs(customAtomSpecs) {
    }
    static parseCrd(data, format: string) {
        let values = []; 
        let counter = 0;
        if (format == "pdb") {
            let index = data.indexOf("\nATOM");
            while (index != -1) {
                while (data.slice(index, index + 5) == "\nATOM" ||
                    data.slice(index, index + 7) == "\nHETATM") {
                    values[counter++] = parseFloat(data.slice(index + 31,
                        index + 39));
                    values[counter++] = parseFloat(data.slice(index + 39,
                        index + 47));
                    values[counter++] = parseFloat(data.slice(index + 47,
                        index + 55));
                    index = data.indexOf("\n", index + 54);
                    if (data.slice(index, index + 4) == "\nTER")
                        index = data.indexOf("\n", index + 5);
                }
                index = data.indexOf("\nATOM", index);
            }
        } else if (format == "netcdf") {
            const reader = new NetCDFReader(data);
            values = [].concat.apply([], reader.getDataVariable('coordinates'));
        } else if (format == "array" || Array.isArray(data)) {
            return data.flat(2);
        } else {
            let index = data.indexOf("\n"); 
            if (format == 'inpcrd') {
                index = data.indexOf("\n", index + 1); 
            }
            data = data.slice(index + 1);
            values = data.match(/\S+/g).map(parseFloat);
        }
        return values;
    }
    static parseMolData(data?: string | ArrayBuffer, format: string = "", options?: ParserConfig) {
        if (!data)
            return []; 
        if (/\.gz$/.test(format)) {
            format = format.replace(/\.gz$/, '');
            try {
                if (format.match(/bcif/i)) {
                    data = inflateString(data, false);
                } else {
                    data = inflateString(data);
                }
            } catch (err) {
                console.log(err);
            }
        }
        if (typeof (Parsers[format]) == "undefined") {
            format = format.split('.').pop();
            if (typeof (Parsers[format]) == "undefined") {
                console.log("Unknown format: " + format);
                if (data instanceof Uint8Array) {
                    format = "bcif"; 
                } else if ((data as string).match(/^@<TRIPOS>MOLECULE/gm)) {
                    format = "mol2";
                } else if ((data as string).match(/^data_/gm) && (data as string).match(/^loop_/gm)) {
                    format = "cif";
                } else if ((data as string).match(/^HETATM/gm) || (data as string).match(/^ATOM/gm)) {
                    format = "pdb";
                } else if ((data as string).match(/ITEM: TIMESTEP/gm)) {
                    format = "lammpstrj";
                } else if ((data as string).match(/^.*\n.*\n.\s*(\d+)\s+(\d+)/gm)) {
                    format = "sdf"; 
                } else if ((data as string).match(/^%VERSION\s+VERSION_STAMP/gm)) {
                    format = "prmtop";
                } else {
                    format = "xyz";
                }
                console.log("Best guess: " + format);
            }
        }
        const parse = Parsers[format];
        const parsedAtoms = parse((data as string), options);
        return parsedAtoms;
    }
}
export interface AtomStyleSpec {
    line?: LineStyleSpec;
    cross?: CrossStyleSpec;
    stick?: StickStyleSpec;
    sphere?: SphereStyleSpec;
    cartoon?: CartoonStyleSpec;
    clicksphere?: ClickSphereStyleSpec;
}
export interface LineStyleSpec {
    hidden?: boolean;
    linewidth?: number;
    colorscheme?: ColorschemeSpec;
    color?: ColorSpec;
    colorfunc?: Function;
    opacity?: number;
    wireframe?: boolean;
}
export interface CrossStyleSpec {
    hidden?: boolean;
    linewidth?: number;
    radius?: number;
    scale?: number;
    colorscheme?: ColorschemeSpec;
    color?: ColorSpec;
    colorfunc?: Function;
    opacity?: number;
}
export interface DashedBondSpec {
    dashLength?: number;
    gapLength?: number;
}
export interface StickStyleSpec {
    hidden?: boolean;
    radius?: number;
    doubleBondScaling?: number;
    tripleBondScaling?: number;
    dashedBondConfig?: DashedBondSpec;
    dashedBonds?: boolean;
    singleBonds?: boolean;
    colorscheme?: ColorschemeSpec;
    color?: ColorSpec;
    colorfunc?: Function;
    opacity?: number;
    showNonBonded?: boolean;
}
export interface SphereStyleSpec {
    hidden?: boolean;
    radius?: number;
    scale?: number;
    colorscheme?: ColorschemeSpec;
    color?: ColorSpec;
    colorfunc?: Function;
    opacity?: number;
}
export interface ClickSphereStyleSpec {
    hidden?: boolean;
    radius?: number;
    scale?: number;
}
export interface BondStyle {
    iswire?: boolean;
    singleBond?: boolean;
    radius?: number;
    color1?: ColorSpec;
    color2?: ColorSpec;
}
