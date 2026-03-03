import * as THREE from "three";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

export const PostShader: THREE.Shader = {
    uniforms: {
        time:      { value: 0 },
        tDiffuse:  { value: null },
    },
    vertexShader,
    fragmentShader,
};
