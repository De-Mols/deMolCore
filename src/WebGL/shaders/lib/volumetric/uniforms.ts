import { Matrix4 } from "WebGL/math";
import { Color } from "../../../../colors";
export const uniforms = {
    opacity: { type: 'f', value: 1.0 },
    fogColor: { type: 'c', value: new Color(1.0, 1.0, 1.0) },
    fogNear: { type: 'f', value: 1.0 },
    fogFar: { type: 'f', value: 2000},
    data: { type: 'i', value: 3 },
    colormap: { type: 'i', value: 4 },
    depthmap: { type: 'i', value: 5 },
    step: { type: 'f', value: 1.0 }, 
    maxdepth: {type: 'f',value: 100.0}, 
    subsamples: { type: 'f', value: 5.0}, 
    textmat: { type: 'mat4', value: [] as Matrix4[]  },
    projinv: { type: 'mat4', value: [] as Matrix4[] },
    transfermin: {type: 'f', value: -0.2 },
    transfermax: {type: 'f', value: 0.2},
}
