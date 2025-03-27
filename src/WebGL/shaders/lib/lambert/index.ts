import { Shader } from '../../ShaderType';
import { uniforms } from './uniforms';
import fragmentShader from './lambert.frag';
import vertexShader from './lambert.vert';
export const lambert: Shader = {
    fragmentShader: fragmentShader.replace('#define GLSLIFY 1', ''),
    vertexShader: vertexShader.replace('#define GLSLIFY 1', ''),
    uniforms,
}
