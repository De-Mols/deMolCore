import { Vector3 } from "./WebGL/math";
import { Geometry } from "./WebGL";
import { Color, Colored } from "colors";
export enum CAP {
    NONE = 0,
    FLAT = 1,
    ROUND = 2
}
export interface Point {
    x: number;
    y: number;
    z: number;
}
export namespace GLDraw {
    function getRotationMatrix(dx: number, dy: number, dz: number) {
        const dxy = Math.hypot(dx, dy);
        let dyz;
        let sinA, cosA, sinB, cosB;
        if (dxy < 0.0001) {
            sinA = 0;
            cosA = 1;
        }
        else {
            sinA = -dx / dxy;
            cosA = dy / dxy;
        }
        dy = -sinA * dx + cosA * dy;
        dyz = Math.hypot(dy, dz);
        if (dyz < 0.0001) {
            sinB = 0;
            cosB = 1;
        }
        else {
            sinB = dz / dyz;
            cosB = dy / dyz;
        }
        const rot = new Float32Array(9);
        rot[0] = cosA;
        rot[1] = sinA;
        rot[2] = 0;
        rot[3] = -sinA * cosB;
        rot[4] = cosA * cosB;
        rot[5] = sinB;
        rot[6] = sinA * sinB;
        rot[7] = -cosA * sinB;
        rot[8] = cosB;
        return rot;
    }
    class CylVertexCache {
        cache: any = {};
        basisVectors: any;
        constructor() {
            const nvecs = [];
            const subdivisions = 4; 
            const N = Math.pow(2, subdivisions);  
            let i = 2;  
            let M = Math.pow(2, i); 
            let spacing = N / M;  
            let j: number;
            nvecs[0] = new Vector3(-1, 0, 0);
            nvecs[spacing] = new Vector3(0, 0, 1);
            nvecs[spacing * 2] = new Vector3(1, 0, 0);
            nvecs[spacing * 3] = new Vector3(0, 0, -1);
            for (i = 3; i <= subdivisions; i++) {
                M = Math.pow(2, (i - 1));
                spacing = N / M;
                for (j = 0; j < (M - 1); j++) {
                    nvecs[spacing / 2 + j * spacing] = nvecs[j * spacing].clone().add(nvecs[(j + 1) * spacing]).normalize();
                }
                j = M - 1;
                nvecs[spacing / 2 + j * spacing] = nvecs[j * spacing].clone().add(nvecs[0]).normalize();
            }
            this.basisVectors = nvecs;
        }
        getVerticesForRadius(radius: any, cap: CAP, capType: any) {
            if (typeof (this.cache) !== "undefined" && this.cache[radius] !== undefined)
                if (this.cache[radius][cap + capType] !== undefined)
                    return this.cache[radius][cap + capType];
            const w = this.basisVectors.length;
            const nvecs = [], norms = [];
            let n;
            for (let i = 0; i < w; i++) {
                nvecs.push(this.basisVectors[i].clone().multiplyScalar(radius));
                nvecs.push(this.basisVectors[i].clone().multiplyScalar(radius));
                n = this.basisVectors[i].clone().normalize();
                norms.push(n);
                norms.push(n);
            }
            const verticesRows = [];
            const heightSegments = 10, widthSegments = w; 
            if (heightSegments % 2 !== 0 || !heightSegments) {
                console.error("heightSegments must be even");
                return null;
            }
            const phiStart = 0;
            const phiLength = Math.PI * 2;
            const thetaStart = 0;
            const thetaLength = Math.PI;
            let x: number, y:number;
            let polar = false, equator = false;
            for (y = 0; y <= heightSegments; y++) {
                polar = (y === 0 || y === heightSegments) ? true : false;
                equator = (y === heightSegments / 2) ? true : false;
                const verticesRow = [], toRow = [];
                for (x = 0; x <= widthSegments; x++) {
                    if (equator) {
                        const xi = (x < widthSegments) ? 2 * x : 0;
                        toRow.push(xi + 1);
                        verticesRow.push(xi);
                        continue;
                    }
                    const u = x / widthSegments;
                    const v = y / heightSegments;
                    if (!polar || x === 0) {
                        if (x < widthSegments) {
                            const vertex = new Vector3();
                            vertex.x = -radius *
                                Math.cos(phiStart + u * phiLength) *
                                Math.sin(thetaStart + v * thetaLength);
                            if (cap == 1)
                                vertex.y = 0;
                            else
                                vertex.y = radius * Math.cos(thetaStart + v * thetaLength);
                            vertex.z = radius *
                                Math.sin(phiStart + u * phiLength) *
                                Math.sin(thetaStart + v * thetaLength);
                            if (Math.abs(vertex.x) < 1e-5)
                                vertex.x = 0;
                            if (Math.abs(vertex.y) < 1e-5)
                                vertex.y = 0;
                            if (Math.abs(vertex.z) < 1e-5)
                                vertex.z = 0;
                            if (cap == CAP.FLAT) {
                                n = new Vector3(0, Math.cos(thetaStart + v * thetaLength), 0);
                                n.normalize();
                            }
                            else {
                                n = new Vector3(vertex.x, vertex.y, vertex.z);
                                n.normalize();
                            }
                            nvecs.push(vertex);
                            norms.push(n);
                            verticesRow.push(nvecs.length - 1);
                        }
                        else {
                            verticesRow.push(nvecs.length - widthSegments);
                        }
                    }
                    else if (polar)
                        verticesRow.push(nvecs.length - 1);
                }
                if (equator)
                    verticesRows.push(toRow);
                verticesRows.push(verticesRow);
            }
            const obj = {
                vertices: nvecs,
                normals: norms,
                verticesRows: verticesRows,
                w: widthSegments,
                h: heightSegments
            };
            if (!(radius in this.cache)) this.cache[radius] = {};
            this.cache[radius][cap + capType] = obj;
            return obj;
        }
    }
    var cylVertexCache = new CylVertexCache();
    export function drawCylinder(geo: Geometry, from: any, to: any, radius: number, color: Color | Color[], fromCap:CAP|string = 0, toCap:CAP|string = 0) {
        if (!from || !to)
            return;
        const getcap = function(c: CAP|string): CAP {
            if(typeof c === "string") {
                const s = c;
                if(s.toLowerCase() == 'flat') {
                    return CAP.FLAT;
                } else if(s.toLowerCase() == 'round') {
                    return CAP.ROUND;
                } else {
                    return CAP.NONE;
                }
            } else {
                return c;
            }
        }
        fromCap = getcap(fromCap);
        toCap = getcap(toCap);
        const drawcaps = toCap || fromCap;
        color = color || ({ r: 0, g: 0, b: 0 } as Color);
        const e = getRotationMatrix(to.x-from.x, to.y-from.y, to.z-from.z);
        const vobj = cylVertexCache.getVerticesForRadius(radius, toCap, "to");
        const n = vobj.w, h = vobj.h;
        const n_verts = (drawcaps) ? h * n + 2 : 2 * n;
        const geoGroup = geo.updateGeoGroup(n_verts);
        let vertices = vobj.vertices, normals = vobj.normals, verticesRows = vobj.verticesRows;
        const toRow = verticesRows[h / 2], fromRow = verticesRows[h / 2 + 1];
        const start = geoGroup.vertices;
        let offset, faceoffset;
        let i, x, y, z;
        const vertexArray = geoGroup.vertexArray;
        const normalArray = geoGroup.normalArray;
        const colorArray = geoGroup.colorArray;
        const faceArray = geoGroup.faceArray;
        for (i = 0; i < n; ++i) {
            const vi = 2 * i;
            x = e[0] * vertices[vi].x + e[3] * vertices[vi].y + e[6] * vertices[vi].z;
            y = e[1] * vertices[vi].x + e[4] * vertices[vi].y + e[7] * vertices[vi].z;
            z = e[5] * vertices[vi].y + e[8] * vertices[vi].z;
            offset = 3 * (start + vi);
            faceoffset = geoGroup.faceidx;
            vertexArray[offset] = x + from.x;
            vertexArray[offset + 1] = y + from.y;
            vertexArray[offset + 2] = z + from.z;
            vertexArray[offset + 3] = x + to.x;
            vertexArray[offset + 4] = y + to.y;
            vertexArray[offset + 5] = z + to.z;
            normalArray[offset] = x;
            normalArray[offset + 3] = x;
            normalArray[offset + 1] = y;
            normalArray[offset + 4] = y;
            normalArray[offset + 2] = z;
            normalArray[offset + 5] = z;
            colorArray[offset] = (color as Color).r;
            colorArray[offset + 3] = (color as Color).r;
            colorArray[offset + 1] = (color as Color).g;
            colorArray[offset + 4] = (color as Color).g;
            colorArray[offset + 2] = (color as Color).b;
            colorArray[offset + 5] = (color as Color).b;
            faceArray[faceoffset] = fromRow[i] + start;
            faceArray[faceoffset + 1] = fromRow[i + 1] + start;
            faceArray[faceoffset + 2] = toRow[i] + start;
            faceArray[faceoffset + 3] = toRow[i] + start;
            faceArray[faceoffset + 4] = fromRow[i + 1] + start;
            faceArray[faceoffset + 5] = toRow[i + 1] + start;
            geoGroup.faceidx += 6;
        }
        if (drawcaps) {
            const ystart = (toCap) ? 0 : h / 2;
            const yend = (fromCap) ? h + 1 : h / 2 + 1;
            let v1, v2, v3, v4, x1, x2, x3, x4, y1, y2, y3, y4, z1, z2, z3, z4, nx1, nx2, nx3, nx4, ny1, ny2, ny3, ny4, nz1, nz2, nz3, nz4, v1offset, v2offset, v3offset, v4offset;
            for (y = ystart; y < yend; y++) {
                if (y === h / 2)
                    continue;
                const cap = (y <= h / 2) ? to : from;
                const toObj = cylVertexCache.getVerticesForRadius(radius, toCap, "to");
                const fromObj = cylVertexCache.getVerticesForRadius(radius, fromCap, "from");
                if (cap === to) {
                    vertices = toObj.vertices;
                    normals = toObj.normals;
                    verticesRows = toObj.verticesRows;
                } else if (cap == from) {
                    vertices = fromObj.vertices;
                    normals = fromObj.normals;
                    verticesRows = fromObj.verticesRows;
                }
                for (x = 0; x < n; x++) {
                    faceoffset = geoGroup.faceidx;
                    v1 = verticesRows[y][x + 1];
                    v1offset = (v1 + start) * 3;
                    v2 = verticesRows[y][x];
                    v2offset = (v2 + start) * 3;
                    v3 = verticesRows[y + 1][x];
                    v3offset = (v3 + start) * 3;
                    v4 = verticesRows[y + 1][x + 1];
                    v4offset = (v4 + start) * 3;
                    x1 = e[0] * vertices[v1].x + e[3] * vertices[v1].y + e[6] * vertices[v1].z;
                    x2 = e[0] * vertices[v2].x + e[3] * vertices[v2].y + e[6] * vertices[v2].z;
                    x3 = e[0] * vertices[v3].x + e[3] * vertices[v3].y + e[6] * vertices[v3].z;
                    x4 = e[0] * vertices[v4].x + e[3] * vertices[v4].y + e[6] * vertices[v4].z;
                    y1 = e[1] * vertices[v1].x + e[4] * vertices[v1].y + e[7] * vertices[v1].z;
                    y2 = e[1] * vertices[v2].x + e[4] * vertices[v2].y + e[7] * vertices[v2].z;
                    y3 = e[1] * vertices[v3].x + e[4] * vertices[v3].y + e[7] * vertices[v3].z;
                    y4 = e[1] * vertices[v4].x + e[4] * vertices[v4].y + e[7] * vertices[v4].z;
                    z1 = e[5] * vertices[v1].y + e[8] * vertices[v1].z;
                    z2 = e[5] * vertices[v2].y + e[8] * vertices[v2].z;
                    z3 = e[5] * vertices[v3].y + e[8] * vertices[v3].z;
                    z4 = e[5] * vertices[v4].y + e[8] * vertices[v4].z;
                    vertexArray[v1offset] = x1 + cap.x;
                    vertexArray[v2offset] = x2 + cap.x;
                    vertexArray[v3offset] = x3 + cap.x;
                    vertexArray[v4offset] = x4 + cap.x;
                    vertexArray[v1offset + 1] = y1 + cap.y;
                    vertexArray[v2offset + 1] = y2 + cap.y;
                    vertexArray[v3offset + 1] = y3 + cap.y;
                    vertexArray[v4offset + 1] = y4 + cap.y;
                    vertexArray[v1offset + 2] = z1 + cap.z;
                    vertexArray[v2offset + 2] = z2 + cap.z;
                    vertexArray[v3offset + 2] = z3 + cap.z;
                    vertexArray[v4offset + 2] = z4 + cap.z;
                    colorArray[v1offset] = (color as Color).r;
                    colorArray[v2offset] = (color as Color).r;
                    colorArray[v3offset] = (color as Color).r;
                    colorArray[v4offset] = (color as Color).r;
                    colorArray[v1offset + 1] = (color as Color).g;
                    colorArray[v2offset + 1] = (color as Color).g;
                    colorArray[v3offset + 1] = (color as Color).g;
                    colorArray[v4offset + 1] = (color as Color).g;
                    colorArray[v1offset + 2] = (color as Color).b;
                    colorArray[v2offset + 2] = (color as Color).b;
                    colorArray[v3offset + 2] = (color as Color).b;
                    colorArray[v4offset + 2] = (color as Color).b;
                    nx1 = e[0] * normals[v1].x + e[3] * normals[v1].y + e[6] * normals[v1].z;
                    nx2 = e[0] * normals[v2].x + e[3] * normals[v2].y + e[6] * normals[v2].z;
                    nx3 = e[0] * normals[v3].x + e[3] * normals[v3].y + e[6] * normals[v3].z;
                    nx4 = e[0] * normals[v4].x + e[3] * normals[v4].y + e[6] * normals[v4].z;
                    ny1 = e[1] * normals[v1].x + e[4] * normals[v1].y + e[7] * normals[v1].z;
                    ny2 = e[1] * normals[v2].x + e[4] * normals[v2].y + e[7] * normals[v2].z;
                    ny3 = e[1] * normals[v3].x + e[4] * normals[v3].y + e[7] * normals[v3].z;
                    ny4 = e[1] * normals[v4].x + e[4] * normals[v4].y + e[7] * normals[v4].z;
                    nz1 = e[5] * normals[v1].y + e[8] * normals[v1].z;
                    nz2 = e[5] * normals[v2].y + e[8] * normals[v2].z;
                    nz3 = e[5] * normals[v3].y + e[8] * normals[v3].z;
                    nz4 = e[5] * normals[v4].y + e[8] * normals[v4].z;
                    if (y === 0) {
                        normalArray[v1offset] = nx1;
                        normalArray[v3offset] = nx3;
                        normalArray[v4offset] = nx4;
                        normalArray[v1offset + 1] = ny1;
                        normalArray[v3offset + 1] = ny3;
                        normalArray[v4offset + 1] = ny4;
                        normalArray[v1offset + 2] = nz1;
                        normalArray[v3offset + 2] = nz3;
                        normalArray[v4offset + 2] = nz4;
                        faceArray[faceoffset] = v1 + start;
                        faceArray[faceoffset + 1] = v3 + start;
                        faceArray[faceoffset + 2] = v4 + start;
                        geoGroup.faceidx += 3;
                    }
                    else if (y === yend - 1) {
                        normalArray[v1offset] = nx1;
                        normalArray[v2offset] = nx2;
                        normalArray[v3offset] = nx3;
                        normalArray[v1offset + 1] = ny1;
                        normalArray[v2offset + 1] = ny2;
                        normalArray[v3offset + 1] = ny3;
                        normalArray[v1offset + 2] = nz1;
                        normalArray[v2offset + 2] = nz2;
                        normalArray[v3offset + 2] = nz3;
                        faceArray[faceoffset] = v1 + start;
                        faceArray[faceoffset + 1] = v2 + start;
                        faceArray[faceoffset + 2] = v3 + start;
                        geoGroup.faceidx += 3;
                    }
                    else { 
                        normalArray[v1offset] = nx1;
                        normalArray[v2offset] = nx2;
                        normalArray[v4offset] = nx4;
                        normalArray[v1offset + 1] = ny1;
                        normalArray[v2offset + 1] = ny2;
                        normalArray[v4offset + 1] = ny4;
                        normalArray[v1offset + 2] = nz1;
                        normalArray[v2offset + 2] = nz2;
                        normalArray[v4offset + 2] = nz4;
                        normalArray[v2offset] = nx2;
                        normalArray[v3offset] = nx3;
                        normalArray[v4offset] = nx4;
                        normalArray[v2offset + 1] = ny2;
                        normalArray[v3offset + 1] = ny3;
                        normalArray[v4offset + 1] = ny4;
                        normalArray[v2offset + 2] = nz2;
                        normalArray[v3offset + 2] = nz3;
                        normalArray[v4offset + 2] = nz4;
                        faceArray[faceoffset] = v1 + start;
                        faceArray[faceoffset + 1] = v2 + start;
                        faceArray[faceoffset + 2] = v4 + start;
                        faceArray[faceoffset + 3] = v2 + start;
                        faceArray[faceoffset + 4] = v3 + start;
                        faceArray[faceoffset + 5] = v4 + start;
                        geoGroup.faceidx += 6;
                    }
                }
            }
        }
        geoGroup.vertices += n_verts;
    }
    export function drawCone (geo: Geometry, from: any, to: any, radius: number, color?: Color) {
        if (!from || !to)
            return;
        color = color || ({ r: 0, g: 0, b: 0 } as Color);
        let ndir = new Vector3(to.x-from.x, to.y-from.y, to.z-from.z);
        const e = getRotationMatrix(ndir.x, ndir.y, ndir.z);
        ndir = ndir.normalize();
        const n = cylVertexCache.basisVectors.length;
        const basis = cylVertexCache.basisVectors;
        const n_verts = n + 2;
        const geoGroup = geo.updateGeoGroup(n_verts);
        const start = geoGroup.vertices;
        let offset, faceoffset;
        let i, x, y, z;
        const vertexArray = geoGroup.vertexArray;
        const normalArray = geoGroup.normalArray;
        const colorArray = geoGroup.colorArray;
        const faceArray = geoGroup.faceArray;
        offset = start * 3;
        vertexArray[offset] = from.x;
        vertexArray[offset + 1] = from.y;
        vertexArray[offset + 2] = from.z;
        normalArray[offset] = -ndir.x;
        normalArray[offset + 1] = -ndir.y;
        normalArray[offset + 2] = -ndir.z;
        colorArray[offset] = color.r;
        colorArray[offset + 1] = color.g;
        colorArray[offset + 2] = color.b;
        vertexArray[offset + 3] = to.x;
        vertexArray[offset + 4] = to.y;
        vertexArray[offset + 5] = to.z;
        normalArray[offset + 3] = ndir.x;
        normalArray[offset + 4] = ndir.y;
        normalArray[offset + 5] = ndir.z;
        colorArray[offset + 3] = color.r;
        colorArray[offset + 4] = color.g;
        colorArray[offset + 5] = color.b;
        offset += 6;
        for (i = 0; i < n; ++i) {
            const vec = basis[i].clone();
            vec.multiplyScalar(radius);
            x = e[0] * vec.x + e[3] * vec.y + e[6] * vec.z;
            y = e[1] * vec.x + e[4] * vec.y + e[7] * vec.z;
            z = e[5] * vec.y + e[8] * vec.z;
            vertexArray[offset] = x + from.x;
            vertexArray[offset + 1] = y + from.y;
            vertexArray[offset + 2] = z + from.z;
            normalArray[offset] = x;
            normalArray[offset + 1] = y;
            normalArray[offset + 2] = z;
            colorArray[offset] = color.r;
            colorArray[offset + 1] = color.g;
            colorArray[offset + 2] = color.b;
            offset += 3;
        }
        geoGroup.vertices += (n + 2);
        faceoffset = geoGroup.faceidx;
        for (i = 0; i < n; i++) {
            const v1 = start + 2 + i;
            const v2 = start + 2 + ((i + 1) % n);
            faceArray[faceoffset] = v1;
            faceArray[faceoffset + 1] = v2;
            faceArray[faceoffset + 2] = start;
            faceoffset += 3;
            faceArray[faceoffset] = v1;
            faceArray[faceoffset + 1] = v2;
            faceArray[faceoffset + 2] = start + 1;
            faceoffset += 3;
        }
        geoGroup.faceidx += 6 * n;
    }
    interface MyObject {
        vertices: any[];
        verticesRows: any[][];
        normals: any[];
     }
    class  SphereVertexCache {
        private cache = new Map<number, Map<number, any>>(); 
        constructor() {}
        getVerticesForRadius(radius: number, sphereQuality: any) {
            sphereQuality = sphereQuality || 2;
            if (!this.cache.has(sphereQuality))  {
                this.cache.set(sphereQuality, new Map<number,any>());
            }
            const radiusCache = this.cache.get(sphereQuality);
            if (radiusCache.has(radius))
                return radiusCache.get(radius);
            const obj: MyObject = {
                vertices: [],
                verticesRows: [],
                normals: []
            };
            let widthSegments = 16 * sphereQuality;
            let heightSegments = 10 * sphereQuality;
            if (radius < 1) {
                widthSegments = 10 * sphereQuality;
                heightSegments = 8 * sphereQuality;
            }
            const phiStart = 0;
            const phiLength = Math.PI * 2;
            const thetaStart = 0;
            const thetaLength = Math.PI;
            let x, y;
            for (y = 0; y <= heightSegments; y++) {
                const verticesRow = [];
                for (x = 0; x <= widthSegments; x++) {
                    const u = x / widthSegments;
                    const v = y / heightSegments;
                    const vx = -radius * Math.cos(phiStart + u * phiLength) *
                        Math.sin(thetaStart + v * thetaLength);
                    const vy = radius * Math.cos(thetaStart + v * thetaLength);
                    const vz = radius * Math.sin(phiStart + u * phiLength) *
                        Math.sin(thetaStart + v * thetaLength);
                    const n = new Vector3(vx, vy, vz);
                    n.normalize();
                    obj.vertices.push({x: vx, y: vy, z: vz});
                    obj.normals.push(n);
                    verticesRow.push(obj.vertices.length - 1);
                }
                obj.verticesRows.push(verticesRow);
            }
            radiusCache.set(radius, obj);
            return obj;
        }
    }
    var sphereVertexCache = new SphereVertexCache();
    export function drawSphere(geo:Geometry, pos: any, radius: number, color: Colored, sphereQuality?: number) {
        const vobj = sphereVertexCache.getVerticesForRadius(radius, sphereQuality);
        const vertices = vobj.vertices;
        const normals = vobj.normals;
        const geoGroup = geo.updateGeoGroup(vertices.length);
        const start = geoGroup.vertices;
        const vertexArray = geoGroup.vertexArray;
        const colorArray = geoGroup.colorArray;
        const faceArray = geoGroup.faceArray;
        const lineArray = geoGroup.lineArray;
        const normalArray = geoGroup.normalArray;
        for (let i = 0, il = vertices.length; i < il; ++i) {
            const offset = 3 * (start + i);
            const v = vertices[i];
            vertexArray[offset] = (v.x + pos.x);
            vertexArray[offset + 1] = (v.y + pos.y);
            vertexArray[offset + 2] = (v.z + pos.z);
            colorArray[offset] = (color).r;
            colorArray[offset + 1] = (color).g;
            colorArray[offset + 2] = (color).b;
        }
        geoGroup.vertices += vertices.length;
        const verticesRows = vobj.verticesRows;
        const h = verticesRows.length - 1;
        for (let y = 0; y < h; y++) {
            const w = verticesRows[y].length - 1;
            for (let x = 0; x < w; x++) {
                const faceoffset = geoGroup.faceidx, lineoffset = geoGroup.lineidx;
                const v1 = verticesRows[y][x + 1] + start, v1offset = v1 * 3;
                const v2 = verticesRows[y][x] + start, v2offset = v2 * 3;
                const v3 = verticesRows[y + 1][x] + start, v3offset = v3 * 3;
                const v4 = verticesRows[y + 1][x + 1] + start, v4offset = v4 * 3;
                const n1 = normals[v1 - start];
                const n2 = normals[v2 - start];
                const n3 = normals[v3 - start];
                const n4 = normals[v4 - start];
                if (Math.abs(vertices[v1 - start].y) === radius) {
                    normalArray[v1offset] = n1.x;
                    normalArray[v3offset] = n3.x;
                    normalArray[v4offset] = n4.x;
                    normalArray[v1offset + 1] = n1.y;
                    normalArray[v3offset + 1] = n3.y;
                    normalArray[v4offset + 1] = n4.y;
                    normalArray[v1offset + 2] = n1.z;
                    normalArray[v3offset + 2] = n3.z;
                    normalArray[v4offset + 2] = n4.z;
                    faceArray[faceoffset] = v1;
                    faceArray[faceoffset + 1] = v3;
                    faceArray[faceoffset + 2] = v4;
                    lineArray[lineoffset] = v1;
                    lineArray[lineoffset + 1] = v3;
                    lineArray[lineoffset + 2] = v1;
                    lineArray[lineoffset + 3] = v4;
                    lineArray[lineoffset + 4] = v3;
                    lineArray[lineoffset + 5] = v4;
                    geoGroup.faceidx += 3;
                    geoGroup.lineidx += 6;
                } else if (Math.abs(vertices[v3 - start].y) === radius) {
                    normalArray[v1offset] = n1.x;
                    normalArray[v2offset] = n2.x;
                    normalArray[v3offset] = n3.x;
                    normalArray[v1offset + 1] = n1.y;
                    normalArray[v2offset + 1] = n2.y;
                    normalArray[v3offset + 1] = n3.y;
                    normalArray[v1offset + 2] = n1.z;
                    normalArray[v2offset + 2] = n2.z;
                    normalArray[v3offset + 2] = n3.z;
                    faceArray[faceoffset] = v1;
                    faceArray[faceoffset + 1] = v2;
                    faceArray[faceoffset + 2] = v3;
                    lineArray[lineoffset] = v1;
                    lineArray[lineoffset + 1] = v2;
                    lineArray[lineoffset + 2] = v1;
                    lineArray[lineoffset + 3] = v3;
                    lineArray[lineoffset + 4] = v2;
                    lineArray[lineoffset + 5] = v3;
                    geoGroup.faceidx += 3;
                    geoGroup.lineidx += 6;
                } else {
                    normalArray[v1offset] = n1.x;
                    normalArray[v2offset] = n2.x;
                    normalArray[v4offset] = n4.x;
                    normalArray[v1offset + 1] = n1.y;
                    normalArray[v2offset + 1] = n2.y;
                    normalArray[v4offset + 1] = n4.y;
                    normalArray[v1offset + 2] = n1.z;
                    normalArray[v2offset + 2] = n2.z;
                    normalArray[v4offset + 2] = n4.z;
                    normalArray[v2offset] = n2.x;
                    normalArray[v3offset] = n3.x;
                    normalArray[v4offset] = n4.x;
                    normalArray[v2offset + 1] = n2.y;
                    normalArray[v3offset + 1] = n3.y;
                    normalArray[v4offset + 1] = n4.y;
                    normalArray[v2offset + 2] = n2.z;
                    normalArray[v3offset + 2] = n3.z;
                    normalArray[v4offset + 2] = n4.z;
                    faceArray[faceoffset] = v1;
                    faceArray[faceoffset + 1] = v2;
                    faceArray[faceoffset + 2] = v4;
                    faceArray[faceoffset + 3] = v2;
                    faceArray[faceoffset + 4] = v3;
                    faceArray[faceoffset + 5] = v4;
                    lineArray[lineoffset] = v1;
                    lineArray[lineoffset + 1] = v2;
                    lineArray[lineoffset + 2] = v1;
                    lineArray[lineoffset + 3] = v4;
                    lineArray[lineoffset + 4] = v2;
                    lineArray[lineoffset + 5] = v3;
                    lineArray[lineoffset + 6] = v3;
                    lineArray[lineoffset + 7] = v4;
                    geoGroup.faceidx += 6;
                    geoGroup.lineidx += 8;
                }
            }
        }
    }
}
