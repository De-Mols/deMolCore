import { Shader } from '../../ShaderType';
import { uniforms } from "./uniforms"
import fragmentShader from "./screenaa.frag"
import vertexShader from "./screenaa.vert"
export const screenaa: Shader = {
    fragmentShader: fragmentShader.replace("#define GLSLIFY 1", ""),
    vertexShader: vertexShader.replace("#define GLSLIFY 1", ""),
    uniforms
}
