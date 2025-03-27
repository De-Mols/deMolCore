import { uniforms } from "./uniforms";
import { Shader } from '../../ShaderType';
import fragmentShader from "./volumetric.frag";
import vertexShader from "./volumetric.vert";
export const volumetric: Shader = {
    fragmentShader: fragmentShader.replace("#define GLSLIFY 1", ""),
    vertexShader: vertexShader.replace("#define GLSLIFY 1", ""),
    uniforms
}
