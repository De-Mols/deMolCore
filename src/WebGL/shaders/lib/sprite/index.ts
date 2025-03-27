import { Shader } from '../../ShaderType';
import { uniforms } from "./uniforms"
import fragmentShader from "./sprite.frag"
import vertexShader from "./sprite.vert"
export const sprite: Shader = {
    fragmentShader: fragmentShader.replace("#define GLSLIFY 1", ""),
    vertexShader: vertexShader.replace("#define GLSLIFY 1", ""),
    uniforms
}
