import { Shader } from '../../ShaderType';
import { uniforms } from "./uniforms";
import fragmentShader from "./sphereimposteroutline.frag";
import vertexShader from "./sphereimposteroutline.vert";
export const sphereimposteroutline: Shader = {
    fragmentShader: fragmentShader.replace("#define GLSLIFY 1", ""),
    vertexShader: vertexShader.replace("#define GLSLIFY 1", ""),
    uniforms
}
