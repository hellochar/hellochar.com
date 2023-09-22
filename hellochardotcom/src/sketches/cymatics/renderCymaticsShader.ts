import * as THREE from "three";

export const RenderCymaticsShader: THREE.Shader = {
    uniforms: {
        cellStateResolution: { value: new THREE.Vector2() },
        cellStateVariable: { value: null },
        resolution: { value: new THREE.Vector2() },
        skewIntensity: { value: 0 },
        // only needed cuz we're using renderpass; not actually used
        tDiffuse: { value: null },
    },
    vertexShader: `
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`,
    fragmentShader: require("./renderCymatics.frag"),
}
