import { Shader } from '../../ShaderType';
import { uniforms } from './uniforms';
import fragmentShader from './lambertdouble.frag';
import vertexShader from './lambertdouble.vert';
export const lambertdouble: Shader = {
    fragmentShader: fragmentShader.replace('#define GLSLIFY 1', ''),
    vertexShader: vertexShader.replace('#define GLSLIFY 1', ''),
    uniforms
}
