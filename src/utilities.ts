import { getGradient, Gradient, GradientType } from "./Gradient";
import { VolumeRender } from "./VolumeRender";
import { builtinColorSchemes, CC, elementColors, htmlColors, Color } from "./colors";
import { IsoSurfaceSpec } from "Shape3D";
import { inflate, InflateFunctionOptions, Data } from "pako"
import { NEAR_ZERO, NEAR_ONE } from './constants';

export function extend(obj1, src1) {
    for (const key in src1) {
        if (src1.hasOwnProperty(key) && src1[key] !== undefined) {
            obj1[key] = src1[key];
        }
    }
    return obj1;
}
export function deepCopy(inObject) {
    let outObject, value, key;
    if (inObject == undefined) {
        return {};
    }
    if (typeof inObject !== "object" || inObject === null) {
        return inObject; 
    }
    outObject = Array.isArray(inObject) ? [] : {};
    for (key in inObject) {
        value = inObject[key];
        outObject[key] = deepCopy(value);
    }
    return outObject;
}
export function isNumeric(obj) {
    const type = typeof (obj);
    return (type === "number" || type === "string") &&
        !isNaN(obj - parseFloat(obj));
}
export function isEmptyObject(obj) {
    let name;
    for (name in obj) {
        return false;
    }
    return true;
}
export type Func = Function|string|undefined|null;
export function makeFunction(callback:Func): Function {
    if (callback && typeof callback === "string") {
        callback = eval("(" + callback + ")");
    }
    if (callback && typeof callback != "function") {
        console.warn("Invalid callback provided.");
        return ()=>{}; 
    }
    return callback as Function;
}
export function adjustVolumeStyle(style: IsoSurfaceSpec) {
    if (style) {
        if (style.volformat && !(style.voldata instanceof VolumeRender)) {
            style.voldata = new VolumeRender(style.voldata, style.volformat);
        }
        if (style.volscheme) {
            style.volscheme = Gradient.getGradient(style.volscheme);
        }
    }
}
export function getExtent(atomlist, ignoreSymmetries?) {
    let xmin, ymin, zmin, xmax, ymax, zmax, xsum, ysum, zsum, cnt;
    const includeSym = !ignoreSymmetries;
    xmin = ymin = zmin = NEAR_ONE;
    xmax = ymax = zmax = NEAR_ZERO;
    xsum = ysum = zsum = cnt = 0;
    if (atomlist.length === 0)
        return [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < atomlist.length; i++) {
        const atom = atomlist[i];
        if (typeof atom === 'undefined' || !isFinite(atom.x) ||
            !isFinite(atom.y) || !isFinite(atom.z))
            continue;
        cnt++;
        xsum += atom.x;
        ysum += atom.y;
        zsum += atom.z;
        xmin = (xmin < atom.x) ? xmin : atom.x;
        ymin = (ymin < atom.y) ? ymin : atom.y;
        zmin = (zmin < atom.z) ? zmin : atom.z;
        xmax = (xmax > atom.x) ? xmax : atom.x;
        ymax = (ymax > atom.y) ? ymax : atom.y;
        zmax = (zmax > atom.z) ? zmax : atom.z;
        if (atom.symmetries && includeSym) {
            for (let n = 0; n < atom.symmetries.length; n++) {
                cnt++;
                xsum += atom.symmetries[n].x;
                ysum += atom.symmetries[n].y;
                zsum += atom.symmetries[n].z;
                xmin = (xmin < atom.symmetries[n].x) ? xmin : atom.symmetries[n].x;
                ymin = (ymin < atom.symmetries[n].y) ? ymin : atom.symmetries[n].y;
                zmin = (zmin < atom.symmetries[n].z) ? zmin : atom.symmetries[n].z;
                xmax = (xmax > atom.symmetries[n].x) ? xmax : atom.symmetries[n].x;
                ymax = (ymax > atom.symmetries[n].y) ? ymax : atom.symmetries[n].y;
                zmax = (zmax > atom.symmetries[n].z) ? zmax : atom.symmetries[n].z;
            }
        }
    }
    return [[xmin, ymin, zmin], [xmax, ymax, zmax],
    [xsum / cnt, ysum / cnt, zsum / cnt]];
}
export function getPropertyRange(atomlist, prop) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0, n = atomlist.length; i < n; i++) {
        const atom = atomlist[i];
        const val = getAtomProperty(atom, prop);
        if (val != null) {
            if (val < min)
                min = val;
            if (val > max)
                max = val;
        }
    }
    if (!isFinite(min) && !isFinite(max))
        min = max = 0;
    else if (!isFinite(min))
        min = max;
    else if (!isFinite(max))
        max = min;
    return [min, max];
}
export class PausableTimer {
    ident: any;
    total_time_run = 0;
    start_time: number;
    countdown: number;
    fn: any;
    arg: any;
    constructor(fn, countdown, arg?) {
        this.fn = fn;
        this.arg = arg;
        this.countdown = countdown;
        this.start_time = new Date().getTime();
        this.ident = setTimeout(fn, countdown, arg);
    }
    cancel() {
        clearTimeout(this.ident);
    }
    pause() {
        clearTimeout(this.ident);
        this.total_time_run = new Date().getTime() - this.start_time;
    }
    resume() {
        this.ident = setTimeout(this.fn, Math.max(0, this.countdown - this.total_time_run), this.arg);
    }
}
export function base64ToArray(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}
export function getAtomProperty(atom, prop) {
    let val = null;
    if (atom.properties &&
        typeof (atom.properties[prop]) != "undefined") {
        val = atom.properties[prop];
    } else if (typeof (atom[prop]) != 'undefined') {
        val = atom[prop];
    }
    return val;
}
export function mergeGeos(geometry, mesh) {
    const meshGeo = mesh.geometry;
    if (meshGeo === undefined)
        return;
    geometry.geometryGroups.push(meshGeo.geometryGroups[0]);
}
export function specStringToObject(str) {
    if (typeof (str) === "object") {
        return str; 
    }
    else if (typeof (str) === "undefined" || str == null) {
        return str;
    }
    try {
        const parsed = JSON.parse(str);
        return parsed;
    } catch (error) {
    }
    str = str.replace(/%7E/g, '~'); 
    const massage = function (val) {
        if (isNumeric(val)) {
            if (Math.floor(parseFloat(val)) == parseInt(val)) {
                return parseFloat(val);
            }
            else if (val.indexOf('.') >= 0) {
                return parseFloat(val); 
            }
            else {
                return parseInt(val);
            }
        }
        else if (val === 'true') {
            return true;
        }
        else if (val === 'false') {
            return false;
        }
        return val;
    };
    const ret = {};
    if (str === 'all') return ret;
    const fields = str.split(';');
    for (let i = 0; i < fields.length; i++) {
        const fv = fields[i].split(':');
        const f = fv[0];
        let val = {};
        let vstr = fv[1];
        if (vstr) {
            vstr = vstr.replace(/~/g, "=");
            if (vstr.indexOf('=') !== -1) {
                const kvs = vstr.split(',');
                for (let j = 0; j < kvs.length; j++) {
                    const kv = kvs[j].split('=', 2);
                    val[kv[0]] = massage(kv[1]);
                }
            }
            else if (vstr.indexOf(',') !== -1) {
                val = vstr.split(',');
            }
            else {
                val = massage(vstr); 
            }
        }
        ret[f] = val;
    }
    return ret;
}
function checkStatus(response) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
}
export function get(uri, callback?) {
    const promise = fetch(uri).then(checkStatus).then((response) => response.text());
    if (callback)
        return promise.then(callback);
    else
        return promise;
}
export function getbin(uri, callback?, request?, postdata?) {
    let promise;
    if (request == "POST") {
        promise = fetch(uri, { method: 'POST', body: postdata })
            .then((response) => checkStatus(response))
            .then((response) => response.arrayBuffer());
    } else {
        promise = fetch(uri).then((response) => checkStatus(response))
            .then((response) => response.arrayBuffer());
    }
    if (callback) return promise.then(callback);
    else return promise;
}
export function download(query, viewer, options, callback?) {
    let type = "";
    let pdbUri = "";
    let uri = "";
    let promise = null;
    const m = viewer.addModel();
    if (query.indexOf(':') < 0) {
        if (query.length == 4) {
            query = 'pdb:' + query;
        } else if (!isNaN(query)) {
            query = 'cid:' + query;
        } else {
            query = 'url:' + query;
        }
    }
    if (query.substring(0,5) == 'mmtf:') {
        console.warn('WARNING: MMTF now deprecated.  Reverting to bcif.');
        query = 'bcif:' + query.slice(5);
    }
    if (query.substring(0, 5) === 'bcif:') {
        query = query.substring(5).toUpperCase();
        uri = "https:
        if (options && typeof options.noComputeSecondaryStructure === 'undefined') {
            options.noComputeSecondaryStructure = true;
        }
        promise = new Promise(function (resolve) {
            getbin(uri)
                .then(function (ret) {
                    m.addMolData(ret, 'bcif.gz', options);
                    viewer.zoomTo();
                    viewer.render();
                    resolve(m);
                }, function () { console.error("fetch of " + uri + " failed."); });
        });
    }
    else {
        if (query.substring(0, 4) === 'pdb:') {
            type = 'bcif';
            if (options && options.format) {
                type = options.format; 
            }
            if (options && typeof options.noComputeSecondaryStructure === 'undefined') {
                options.noComputeSecondaryStructure = true;
            }
            query = query.substring(4).toUpperCase();
            if (!query.match(/^[1-9][A-Za-z0-9]{3}$/)) {
                alert("Wrong ProteinFormat ID");
                return;
            }
            if (type == 'bcif') {
                uri = 'https:
            }
            else {
                pdbUri = options && options.pdbUri ? options.pdbUri : "https:
                uri = pdbUri + query + "." + type;
            }
        } else if (query.substring(0, 4) == 'cid:') {
            type = "sdf";
            query = query.substring(4);
            if (!query.match(/^[0-9]+$/)) {
                alert("Wrong Compound ID"); return;
            }
            uri = "https:
                "/StructureDataFormat?record_type=3d";
        } else if (query.substring(0, 4) == 'url:') {
            uri = query.substring(4);
            type = uri;
        }
        const handler = function (ret) {
            m.addMolData(ret, type, options);
            viewer.zoomTo();
            viewer.render();
        };
        promise = new Promise(function (resolve) {
            if (type == 'bcif') { 
                getbin(uri)
                    .then(function (ret) {
                        handler(ret);
                        resolve(m);
                    }).catch(function () {
                        pdbUri = options && options.pdbUri ? options.pdbUri : "https:
                        uri = pdbUri + query + ".pdb";
                        type = "pdb";
                        console.warn("falling back to pdb format");
                        get(uri).then(function (data) {
                            handler(data);
                            resolve(m);
                        }).catch(function (e) {
                            handler("");
                            resolve(m);
                            console.error("fetch of " + uri + " failed: " + e.statusText);
                        });
                    }); 
            }
            else {
                get(uri).then(function (data) {
                    handler(data);
                    resolve(m);
                }).catch(function (e) {
                    handler("");
                    resolve(m);
                    console.error("fetch of " + uri + " failed: " + e.statusText);
                });
            }
        });
    }
    if (callback) {
        promise.then(function (m) {
            callback(m);
        });
        return m;
    }
    else return promise;
}
export function getColorFromStyle(atom, style): Color {
    let scheme = style.colorscheme;
    if (typeof builtinColorSchemes[scheme] != "undefined") {
        scheme = builtinColorSchemes[scheme];
    } else if (typeof scheme == "string" && scheme.endsWith("Carbon")) {
        const ccolor = scheme
            .substring(0, scheme.lastIndexOf("Carbon"))
            .toLowerCase();
        if (typeof htmlColors[ccolor] != "undefined") {
            const newscheme = { ...elementColors.defaultColors };
            newscheme.C = htmlColors[ccolor];
            builtinColorSchemes[scheme] = { prop: "elem", map: newscheme };
            scheme = builtinColorSchemes[scheme];
        }
    }
    let color = atom.color;
    if (typeof style.color != "undefined" && style.color != "spectrum")
        color = style.color;
    if (typeof scheme != "undefined") {
        let prop, val;
        if (typeof elementColors[scheme] != "undefined") {
            scheme = elementColors[scheme];
            if (typeof scheme[atom[scheme.prop]] != "undefined") {
                color = scheme.map[atom[scheme.prop]];
            }
        } else if (typeof scheme[atom[scheme.prop]] != "undefined") {
            color = scheme.map[atom[scheme.prop]];
        } else if (
            typeof scheme.prop != "undefined" &&
            typeof scheme.gradient != "undefined"
        ) {
            prop = scheme.prop;
            let grad = scheme.gradient; 
            if(!(grad instanceof GradientType)) {
                grad = getGradient(scheme);
            }
            const range = grad.range() || [-1, 1]; 
            val = getAtomProperty(atom, prop);
            if (val != null) {
                color = grad.valueToHex(val, range);
            }
        } else if (
            typeof scheme.prop != "undefined" &&
            typeof scheme.map != "undefined"
        ) {
            prop = scheme.prop;
            val = getAtomProperty(atom, prop);
            if (typeof scheme.map[val] != "undefined") {
                color = scheme.map[val];
            }
        } else if (typeof style.colorscheme[atom.elem] != "undefined") {
            color = style.colorscheme[atom.elem];
        } else {
            console.warn("Could not interpret colorscheme " + scheme);
        }
    } else if (typeof style.colorfunc != "undefined") {
        color = style.colorfunc(atom);
    }
    const C = CC.color(color);
    return C;
}
export function getElement(element): HTMLElement | null {
    let ret = element;
    if (typeof (element) === "string") {
        ret = document.querySelector("#" + element);
    } else if (typeof element === 'object' && element.get) { 
        ret = element.get(0);
    }
    return ret;
}
export function inflateString(str: string | ArrayBuffer, tostring: boolean = true): (string | ArrayBuffer) {
    let data: Data;
    if (typeof str === 'string') {
        const encoder = new TextEncoder();
        data = encoder.encode(str);
    } else {
        data = new Uint8Array(str);
    }
    const inflatedData = inflate(data, {
        to: tostring ? 'string' : null
    } as InflateFunctionOptions & { to: 'string' });
    return inflatedData;
}
