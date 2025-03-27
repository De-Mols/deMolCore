import { Viewer3D, createViewer } from "./Viewer3D";
import { SurfaceType } from "./Surface3D4";
import { get, getbin, makeFunction, specStringToObject } from "./utilities";
import { CC } from "./colors";
export var autoinit = false;
export var processing_autoinit = false;
export var viewers: any = {};
export function autoload(viewer?: any, callback?: (arg0: any) => void) {
    let i: string | number, dataname: string, type: string;
    if (document.querySelector(".viewer_DeMoljs") != null)
        autoinit = true;
    if (autoinit) {
        processing_autoinit = true;
        viewer = (viewer != undefined) ? viewer : null;
        let nviewers = 0;
        document.querySelectorAll<HTMLInputElement>(".viewer_DeMoljs").forEach(viewerdiv => {
            const datauri = [];
            const datatypes = [];
            let uri = '';
            if (viewerdiv.style.position == 'static') {
                viewerdiv.style.position = 'relative';
            }
            let UI:any = null;
            type = null;
            if (viewerdiv.dataset.pdb) {
                datauri.push("https:
                datatypes.push("pdb");
            } else if (viewerdiv.dataset.cid) {
                datatypes.push("sdf");
                datauri.push("https:
                    "/StructureDataFormat?record_type=3d");
            }
            else if (viewerdiv.dataset.href || viewerdiv.dataset.url) {
                if (viewerdiv.dataset.href)
                    uri = viewerdiv.dataset.href;
                else
                    uri = viewerdiv.dataset.url;
                datauri.push(uri);
                type = uri.substring(uri.lastIndexOf('.') + 1);
                if(type == 'gz') {
                    const pos = uri.substring(0,uri.lastIndexOf('.')).lastIndexOf('.');
                    type = uri.substring(pos+1);
                }
                datatypes.push(type);
                let molName = uri.substring(uri.lastIndexOf('/') + 1, uri.lastIndexOf('.'));
                if (molName == '/')
                    molName = uri.substring(uri.lastIndexOf('/') + 1);
                viewerdiv.dataset[datatypes[datatypes.length - 1]] = molName;
            }
            const divdata = viewerdiv.dataset;
            for (i in divdata) {
                if ((i.substring(0, 3) === "pdb" && (i !== "pdb"))) {
                    datauri.push("https:
                    datatypes.push('pdb');
                } else if (i.substring(0, 4) === "href" && (i !== "href")) {
                    uri = divdata[i];
                    datauri.push(uri);
                    datatypes.push(uri.substring(uri.lastIndexOf('.') + 1));
                } else if (i.substring(0, 3) === "cid" && (i !== "cid")) {
                    datauri.push("https:
                    datatypes.push('sdf');
                }
            }
            let options = {};
            if (viewerdiv.dataset.options)
                options = specStringToObject(viewerdiv.dataset.options);
            const bgcolor = CC.color(viewerdiv.dataset.backgroundcolor);
            let bgalpha: string | number = viewerdiv.dataset.backgroundalpha;
            bgalpha = (bgalpha == undefined) ? 1.0 : parseFloat(bgalpha);
            let style = { line: {} };
            if (viewerdiv.dataset.style) style = specStringToObject(viewerdiv.dataset.style);
            let select = {};
            if (viewerdiv.dataset.select) select = specStringToObject(viewerdiv.dataset.select);
            const selectstylelist = [];
            const surfaces = [];
            const labels = [];
            let zoomto = {};
            let spin = null;
            const d = viewerdiv.dataset;
            const stylere = /style(.+)/;
            const surfre = /surface(.*)/;
            const reslabre = /labelres(.*)/;
            const keys = [];
            for (dataname in d) {
                if (Object.prototype.hasOwnProperty.call(d, dataname)) {
                    keys.push(dataname);
                }
            }
            keys.sort();
            for (i = 0; i < keys.length; i++) {
                dataname = keys[i];
                let m = stylere.exec(dataname);
                var selname: string, newsel: any, styleobj: any;
                if (m) {
                    selname = "select" + m[1];
                    newsel = specStringToObject(d[selname]);
                    styleobj = specStringToObject(d[dataname]);
                    selectstylelist.push([newsel, styleobj]);
                }
                m = surfre.exec(dataname);
                if (m) {
                    selname = "select" + m[1];
                    newsel = specStringToObject(d[selname]);
                    styleobj = specStringToObject(d[dataname]);
                    surfaces.push([newsel, styleobj]);
                }
                m = reslabre.exec(dataname);
                if (m) {
                    selname = "select" + m[1];
                    newsel = specStringToObject(d[selname]);
                    styleobj = specStringToObject(d[dataname]);
                    labels.push([newsel, styleobj]);
                }
                if (dataname == "zoomto") {
                    zoomto = specStringToObject(d[dataname]);
                }
                if (dataname == "spin") {
                    spin = specStringToObject(d[dataname]);
                }
            }
            const applyStyles = function (glviewer: Viewer3D) {
                glviewer.setStyle(select, style);
                if (UI) {
                    UI.createSelectionAndStyle(select, style);
                }
                for (i = 0; i < selectstylelist.length; i++) {
                    const sel = selectstylelist[i][0] || {};
                    const sty = selectstylelist[i][1] || { "line": {} };
                    glviewer.setStyle(sel, sty);
                    if (UI) {
                        UI.createSelectionAndStyle(select, style);
                    }
                }
                for (i = 0; i < surfaces.length; i++) {
                    const sel = surfaces[i][0] || {};
                    const sty = surfaces[i][1] || {};
                    const viewer = glviewer;
                    if (UI) {
                        viewer.addSurface(SurfaceType.VDW, sty, sel, sel).then((surfid: any) => {
                            UI.loadSurface("VDW", sel, sty, surfid);
                        });
                    }
                    else {
                        glviewer.addSurface(SurfaceType.VDW, sty, sel, sel);
                    }
                }
                for (i = 0; i < labels.length; i++) {
                    const sel = labels[i][0] || {};
                    const sty = labels[i][1] || {};
                    glviewer.addResLabels(sel, sty);
                }
                glviewer.render();
                glviewer.zoomTo(zoomto);
                if (spin) {
                    glviewer.spin(spin.axis, spin.speed);
                }
            };
            let glviewer = viewer;
            try {
                const config: any = specStringToObject(viewerdiv.dataset.config) || {};
                if (config.backgroundColor === undefined) config.backgroundColor = bgcolor;
                if (config.backgroundAlpha === undefined) config.backgroundAlpha = bgalpha;
                if (glviewer == null) {
                    glviewer = viewers[viewerdiv.id || nviewers++] = createViewer(viewerdiv, config);
                } else {
                    glviewer.setBackgroundColor(bgcolor, bgalpha);
                    glviewer.setConfig(config);
                    if (UI) 
                        UI.initiateUI();
                }
                if(viewerdiv.dataset.ui && $DeMol.StateManager) {
                    UI = new $DeMol.StateManager(glviewer); 
                }
            } catch (error) {
                console.log(error);
                viewerdiv.textContent = "WebGL appears to be disabled.";
            }
            if (datauri.length != 0) {
                let i = 0;
                const process = ((viewerdiv, glviewer) => function (moldata: any) {
                    uri = datauri[i]; 
                    const type = viewerdiv.dataset.type || viewerdiv.dataset.datatype || datatypes[i];
                    glviewer.addModel(moldata, type, options);
                    if (UI) {
                        const modelName = viewerdiv.dataset[datatypes[i]];
                        UI.setModelTitle(modelName);
                    }
                    i +=1;
                    if (i < datauri.length) {
                        get(datauri[i]).then(process);
                    }
                    else {
                        applyStyles(glviewer);
                        if (viewerdiv.dataset.callback) {
                            const runres = makeFunction(viewerdiv.dataset.callback);
                            runres(glviewer);                            
                        }
                        processing_autoinit = false;
                        if (callback) callback(glviewer);
                    }
                })(viewerdiv,glviewer);
                if(type && type.endsWith('gz')) {
                    getbin(datauri[0]).then(process);
                } else {
                    get(datauri[0]).then(process);
                }
            }
            else {
                if (viewerdiv.dataset.element) {
                    const moldataid = "#" + viewerdiv.dataset.element;
                    const molelem = document.querySelector(moldataid);
                    const moldata = molelem ? molelem.textContent : "";
                    type = viewerdiv.dataset.type || viewerdiv.dataset.datatype;
                    glviewer.addModel(moldata, type, options);
                }
                applyStyles(glviewer);
                if (viewerdiv.dataset.callback) {
                    const runres = makeFunction(viewerdiv.dataset.callback);
                    runres(glviewer);                    
                }
                processing_autoinit = false;
                if (callback)
                    callback(glviewer);
            }
        });
    }
}
document.onreadystatechange = () => {
    if (document.readyState === "complete") {
        autoload();
    }
};
