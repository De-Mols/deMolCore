import { base64ToArray } from "./utilities";
import { Vector3, Matrix4 } from "./WebGL/math";
import { DensityFormat } from "./parsers/DensityFormat";
import { CUBE } from "./parsers/CUBE";
import { inflate } from "pako";
import { BOHR_TO_ANGSTROM, ANGSTROM_TO_BOHR, DEGREES_TO_RADIANS } from './constants';

interface VolumeRenderOptions {
    negate?: boolean;
    normalize?: boolean;
}
export class VolumeRender {
    unit = {
        x: 1,
        y: 1,
        z: 1
    }; 
    origin = {
        x: 0,
        y: 0,
        z: 0
    }; 
    size = {
        x: 0,
        y: 0,
        z: 0
    }; 
    data = new Float32Array([]); 
    matrix: any = null; 
    inversematrix: Matrix4|null = null;
    dimensionorder: any;
    isbinary = new Set<string>(['ccp4','CCP4']);
    constructor(str: any, format: string, options?: VolumeRenderOptions) {
        format = format.toLowerCase();
        if (/\.gz$/.test(format)) {
            format = format.replace(/\.gz$/, '');
            try {
                if ((this as any)[format] && this.isbinary.has(format)) {
                    if (typeof (str) == "string") {
                        str = base64ToArray(str);
                    }
                    str = inflate(str);
                }
                else {
                    str = new TextDecoder("utf-8").decode(inflate(str));
                }
            } catch (err) {
                console.error(err);
            }
        }
        if ((this as any)[format]) {
            if (this.isbinary.has(format) && typeof (str) == "string") {
                str = base64ToArray(str);
            }
            (this as any)[format](str);
        }
        if (options) {
            if (options.negate) {
                for (let i = 0, n = this.data.length; i < n; i++) {
                    this.data[i] = -this.data[i];
                }
            }
            if (options.normalize) {
                let total = 0.0;
                for (let i = 0, n = this.data.length; i < n; i++) {
                    total += this.data[i];
                }
                const mean = total / this.data.length;
                total = 0;
                for (let i = 0, n = this.data.length; i < n; i++) {
                    const diff = this.data[i] - mean;
                    total += diff * diff; 
                }
                const variance = total / this.data.length;
                for (let i = 0, n = this.data.length; i < n; i++) {
                    this.data[i] = (this.data[i] - mean) / variance;
                }
            }
        }
    }
    getIndex(x: number, y: number, z: number) {
        if (this.matrix) {
            if (this.inversematrix == null) {
                this.inversematrix = new Matrix4().getInverse(this.matrix);
            }
            let pt = new Vector3(x, y, z);
            pt = pt.applyMatrix4(this.inversematrix);
            x = pt.x;
            y = pt.y;
            z = pt.z;
        } else { 
            x -= this.origin.x;
            y -= this.origin.y;
            z -= this.origin.z;
            x /= this.unit.x;
            y /= this.unit.y;
            z /= this.unit.z;
        }
        x = Math.round(x);
        y = Math.round(y);
        z = Math.round(z);
        if (x < 0 || x >= this.size.x) return -1;
        if (y < 0 || y >= this.size.y) return -1;
        if (z < 0 || z >= this.size.z) return -1;
        return x * this.size.y * this.size.z + y * this.size.z + z;
    }
    getVal(x: number, y: number, z: number) {
        const i = this.getIndex(x, y, z);
        if (i < 0) return 0;
        return this.data[i];
    }
    getCoordinates = function (index: number) {
        let x = index / (this.size.y * this.size.z);
        let y = index % (this.size.y * this.size.z);
        let z = index % this.size.z;
        x *= this.unit.x;
        y *= this.unit.y;
        z *= this.unit.z;
        x += this.origin.x;
        y += this.origin.y;
        z += this.origin.z;
        return { x: x, y: y, z: z };
    };
    vasp = function (str: string) {
        const lines = str.replace(/^\s+/, "").split(/[\n\r]/);
        const atomicData = DensityFormat(str)[0];
        const natoms = atomicData.length;
        if (natoms == 0) {
            console.warn("No good formating of CHG or CHGCAR file, not atomic information provided in the file.");
            this.data = [];
            return;
        }
        const l_units = BOHR_TO_ANGSTROM;
        const e_units = ANGSTROM_TO_BOHR;
        const convFactor = parseFloat(lines[1]);
        let v: string[];
        v = lines[2].replace(/^\s+/, "").split(/\s+/);
        let xVec = new Vector3(parseFloat(v[0]), parseFloat(v[1]), parseFloat(v[2])).multiplyScalar(convFactor * l_units);
        v = lines[3].replace(/^\s+/, "").split(/\s+/);
        let yVec = new Vector3(parseFloat(v[0]), parseFloat(v[1]), parseFloat(v[2])).multiplyScalar(convFactor * l_units);
        v = lines[4].replace(/^\s+/, "").split(/\s+/);
        let zVec = new Vector3(parseFloat(v[0]), parseFloat(v[1]), parseFloat(v[2])).multiplyScalar(convFactor * l_units);
        let vol = xVec.x * (yVec.y * zVec.z - zVec.y * yVec.z) - yVec.x * (xVec.y * zVec.z - zVec.y * xVec.z) + zVec.x * (xVec.y * yVec.z - yVec.y * xVec.z);
        vol = Math.abs(vol) / (Math.pow(l_units, 3));
        const vol_scale = 1.0 / (vol); 
        lines.splice(0, 2 + 3 + 2 + 1 + natoms + 1);
        const lineArr = lines[0].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
        const nX = Math.abs(parseFloat(lineArr[0]));
        const nY = Math.abs(parseFloat(lineArr[1]));
        const nZ = Math.abs(parseFloat(lineArr[2]));
        const origin = this.origin = new Vector3(0, 0, 0);
        this.size = { x: nX, y: nY, z: nZ };
        this.unit = new Vector3(xVec.x, yVec.y, zVec.z);
        xVec = xVec.multiplyScalar(1 / (l_units * nX));
        yVec = yVec.multiplyScalar(1 / (l_units * nY));
        zVec = zVec.multiplyScalar(1 / (l_units * nZ));
        if (xVec.y != 0 || xVec.z != 0 || yVec.x != 0 || yVec.z != 0 || zVec.x != 0
            || zVec.y != 0) {
            this.matrix = new Matrix4(xVec.x, yVec.x, zVec.x, 0, xVec.y, yVec.y, zVec.y, 0, xVec.z, yVec.z, zVec.z, 0, 0, 0, 0, 1);
            this.matrix = this.matrix.multiplyMatrices(this.matrix,
                new Matrix4().makeTranslation(origin.x, origin.y, origin.z));
            this.origin = new Vector3(0, 0, 0);
            this.unit = new Vector3(1, 1, 1);
        }
        lines.splice(0, 1); 
        let raw = lines.join(" ");
        raw = raw.replace(/^\s+/, '');
        const rawArray = raw.split(/[\s\r]+/);
        rawArray.splice(nX * nY * nZ + 1);
        const preConvertedData = Float32Array.from(rawArray, parseFloat); 
        for (let i = 0; i < preConvertedData.length; i++) {
            preConvertedData[i] = preConvertedData[i] * vol_scale * e_units;
        }
        this.data = preConvertedData;
    };
    dx = function (str: string) {
        const lines = str.split(/[\n\r]+/);
        let m: string[];
        const recounts = /gridpositions\s+counts\s+(\d+)\s+(\d+)\s+(\d+)/;
        const reorig = /^origin\s+(\S+)\s+(\S+)\s+(\S+)/;
        const redelta = /^delta\s+(\S+)\s+(\S+)\s+(\S+)/;
        const follows = /data follows/;
        let i = 0;
        for (i = 0; i < lines.length; i++) {
            let line = lines[i];
            if ((m = recounts.exec(line))) {
                const nX = parseInt(m[1]);
                const nY = parseInt(m[2]);
                const nZ = parseInt(m[3]);
                this.size = { x: nX, y: nY, z: nZ };
            }
            else if ((m = redelta.exec(line))) {
                const xunit = parseFloat(m[1]);
                if (parseFloat(m[2]) != 0 || parseFloat(m[3]) != 0) {
                    console.warn("Non-orthogonal delta matrix not currently supported in dx format");
                }
                i += 1;
                line = lines[i];
                m = redelta.exec(line);
                if (m == null) {
                    console.error("Parse error in dx delta matrix");
                    return;
                }
                const yunit = parseFloat(m[2]);
                if (parseFloat(m[1]) != 0 || parseFloat(m[3]) != 0) {
                    console.warn("Non-orthogonal delta matrix not currently supported in dx format");
                }
                i += 1;
                line = lines[i];
                m = redelta.exec(line);
                if (m == null) {
                    console.error("Parse error in dx delta matrix");
                    return;
                }
                const zunit = parseFloat(m[3]);
                if (parseFloat(m[1]) != 0 || parseFloat(m[2]) != 0) {
                    console.warn("Non-orthogonal delta matrix not currently supported in dx format");
                }
                this.unit = new Vector3(xunit, yunit, zunit);
            }
            else if ((m = reorig.exec(line))) {
                const xorig = parseFloat(m[1]);
                const yorig = parseFloat(m[2]);
                const zorig = parseFloat(m[3]);
                this.origin = new Vector3(xorig, yorig, zorig);
            } else if ((m = follows.exec(line))) {
                break;
            }
        }
        i += 1;
        if (!this.size || !this.origin || !this.unit || !this.size) {
            console.error("Error parsing dx format");
            return;
        }
        const raw = lines.splice(i).join(" ");
        const rawArray = raw.split(/[\s\r]+/);
        this.data = Float32Array.from(rawArray, parseFloat);
    };
    cube(str: string) {
        const lines = str.split(/\r?\n/);
        if (lines.length < 6)
            return;
        const cryst = CUBE(str, {}).modelData[0].cryst;
        const lineArr = lines[2].replace(/^\s+/, "").replace(/\s+/g, " ").split(" ");
        const atomsnum = parseFloat(lineArr[0]); 
        const natoms = Math.abs(atomsnum);
        this.origin = cryst.origin;
        this.size = cryst.size;
        this.unit = cryst.unit;
        this.matrix = cryst.matrix4;
        let headerlines = 6;
        if (atomsnum < 0) headerlines++; 
        let raw = lines.splice(natoms + headerlines).join(" ");
        raw = raw.replace(/^\s+/, '');
        const rawArray = raw.split(/[\s\r]+/);
        this.data = Float32Array.from(rawArray, parseFloat);
    }
    ccp4(bin: Int8Array) {
        const header:any = {};
        bin = new Int8Array(bin);
        const intView = new Int32Array(bin.buffer, 0, 56);
        const floatView = new Float32Array(bin.buffer, 0, 56);
        const dv = new DataView(bin.buffer);
        header.MAP = String.fromCharCode(
            dv.getUint8(52 * 4), dv.getUint8(52 * 4 + 1),
            dv.getUint8(52 * 4 + 2), dv.getUint8(52 * 4 + 3)
        );
        header.MACHST = [dv.getUint8(53 * 4), dv.getUint8(53 * 4 + 1)];
        if (header.MACHST[0] === 17 && header.MACHST[1] === 17) {
            const n = bin.byteLength;
            for (let i = 0; i < n; i += 4) {
                dv.setFloat32(i, dv.getFloat32(i), true);
            }
        }
        header.NX = intView[0];  
        header.NY = intView[1];  
        header.NZ = intView[2];  
        header.MODE = intView[3];
        header.NXSTART = intView[4];  
        header.NYSTART = intView[5];  
        header.NZSTART = intView[6];  
        header.MX = intView[7];  
        header.MY = intView[8];  
        header.MZ = intView[9];  
        header.xlen = floatView[10];
        header.ylen = floatView[11];
        header.zlen = floatView[12];
        header.alpha = floatView[13];
        header.beta = floatView[14];
        header.gamma = floatView[15];
        header.MAPC = intView[16];  
        header.MAPR = intView[17];  
        header.MAPS = intView[18];  
        header.DMIN = floatView[19];
        header.DMAX = floatView[20];
        header.DMEAN = floatView[21];
        header.ISPG = intView[22];
        header.NSYMBT = intView[23];
        header.LSKFLG = intView[24];
        header.originX = floatView[49];
        header.originY = floatView[50];
        header.originZ = floatView[51];
        header.ARMS = floatView[54];
        const h = header;
        const basisX: Array<any> = [
            h.xlen,
            0,
            0
        ];
        const basisY: Array<any> = [
            h.ylen * Math.cos(DEGREES_TO_RADIANS * h.gamma),
            h.ylen * Math.sin(DEGREES_TO_RADIANS * h.gamma),
            0
        ];
        const basisZ: Array<any> = [
            h.zlen * Math.cos(DEGREES_TO_RADIANS * h.beta),
            h.zlen * (
                Math.cos(DEGREES_TO_RADIANS * h.alpha)
                - Math.cos(DEGREES_TO_RADIANS * h.gamma)
                * Math.cos(DEGREES_TO_RADIANS * h.beta)
            ) / Math.sin(DEGREES_TO_RADIANS * h.gamma),
            0
        ];
        basisZ[2] = Math.sqrt(
            h.zlen * h.zlen * Math.sin(DEGREES_TO_RADIANS * h.beta) *
            Math.sin(DEGREES_TO_RADIANS * h.beta) - basisZ[1] * basisZ[1]
        );
        const basis: Array<any> = [0, basisX, basisY, basisZ];
        const nxyz: Array<any> = [0, h.MX, h.MY, h.MZ];
        const mapcrs: Array<any> = [0, h.MAPC, h.MAPR, h.MAPS];
        this.matrix = new Matrix4();
        this.matrix.set(
            basis[mapcrs[1]][0] / nxyz[mapcrs[1]],
            basis[mapcrs[2]][0] / nxyz[mapcrs[2]],
            basis[mapcrs[3]][0] / nxyz[mapcrs[3]],
            0,
            basis[mapcrs[1]][1] / nxyz[mapcrs[1]],
            basis[mapcrs[2]][1] / nxyz[mapcrs[2]],
            basis[mapcrs[3]][1] / nxyz[mapcrs[3]],
            0,
            basis[mapcrs[1]][2] / nxyz[mapcrs[1]],
            basis[mapcrs[2]][2] / nxyz[mapcrs[2]],
            basis[mapcrs[3]][2] / nxyz[mapcrs[3]],
            0,
            0, 0, 0, 1
        );
        this.matrix = this.matrix.multiplyMatrices(
            this.matrix,
            new Matrix4().makeTranslation(
                h.NXSTART + h.originX,
                h.NYSTART + h.originY,
                h.NZSTART + h.originZ)
        );
        this.origin = new Vector3(0, 0, 0);
        this.unit = new Vector3(1, 1, 1);
        this.size = { x: header.NX, y: header.NY, z: header.NZ };
        this.dimensionorder = [header.MAPC, header.MAPR, header.MAPS];
        const data = new Float32Array(bin.buffer, 1024 + header.NSYMBT);
        const NX = header.NX, NY = header.NY, NZ = header.NZ;
        this.data = new Float32Array(NX * NY * NZ);
        for (let i = 0; i < NX; i++) {
            for (let j = 0; j < NY; j++) {
                for (let k = 0; k < NZ; k++) {
                    this.data[((i * NY) + j) * NZ + k] = data[((k * NY) + j) * NX + i];
                }
            }
        }
    }
}
