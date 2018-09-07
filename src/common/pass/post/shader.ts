import * as THREE from "three";

const vertexShader = require("./vertex.glsl");
const fragmentShader = require("./fragment.glsl");

export const PostShader: THREE.Shader = {
    uniforms: {
        time:      { value: 0 },
        tDiffuse:  { value: null },
    },
    vertexShader,
    fragmentShader,
};
