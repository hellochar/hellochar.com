import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../sketch";

// goal - compute particle positions from the vertex shader

class VertexShaderParticles extends ISketch {
    public scene = new THREE.Scene();
    private camera!: THREE.PerspectiveCamera;

    public material!: THREE.ShaderMaterial;
    public points!: THREE.Points;

    public init() {
        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        this.camera.position.z = 5;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        const pointGeometry = new THREE.Geometry();
        for (let i = 0; i < 1000000; i++) {
            pointGeometry.vertices.push(new THREE.Vector3(i / 100000 - 5., 0, 0));
            pointGeometry.verticesNeedUpdate = true;
        }
        // const material = new THREE.PointsMaterial({
        //     size: 0.25,
        //     sizeAttenuation: false,
        //     color: new THREE.Color(1, 0, 0),
        // });
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                u_time: { value: 0.0 },
            },
            vertexShader:
`
// // default vertex attributes provided by Geometry and BufferGeometry
// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;
// attribute vec2 uv2;

uniform float u_time;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    gl_Position = vec4((position + (rand(position.xy) - 0.5) * u_time + sin(position*u_time)) / 10., 1.);
    gl_PointSize = 3.*(1. + sin(length(gl_Position)*u_time));
}
`,
            fragmentShader:
`
void main() {
    gl_FragColor = vec4(1., 0., 0., .1);
}
`,
        });
        this.points = new THREE.Points(
            pointGeometry,
            this.material,
        );
        this.scene.add(this.points);
    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    public animate() {
        this.material.uniforms.u_time.value = this.timeElapsed / 1000;
        this.renderer.render(this.scene, this.camera);
    }
}

export default VertexShaderParticles;
