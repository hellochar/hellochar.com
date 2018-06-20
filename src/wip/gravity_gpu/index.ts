import * as React from "react";
import * as THREE from "three";

import devlog from "../../common/devlog";
import GPUComputationRenderer, { GPUComputationRendererVariable } from "../../common/gpuComputationRenderer";
import { ISketch, SketchAudioContext } from "../../sketch";

// goal - use a shader to fill in a texture, which is then used to fill in the positions of particles

const COMPUTE_TEXTURE_SIDE_LENGTH = 64;

class GravityGPUComputation extends ISketch {
    public mouse = new THREE.Vector2();
    public events = {
        mousemove: (evt: JQuery.Event) => {
            this.mouse.x = evt.pageX;
            this.mouse.y = evt.pageY;
        },
    };

    public scene = new THREE.Scene();

    public camera!: THREE.PerspectiveCamera;
    public controls!: THREE.OrbitControls;
    public pointsMaterial!: THREE.ShaderMaterial;

    public gpuRenderer!: GPUComputationRenderer;
    public positionVariable!: GPUComputationRendererVariable;

    public init() {
        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        this.camera.position.z = 10;
        this.camera.position.y = 4;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.autoRotate = true;

        this.gpuRenderer = new GPUComputationRenderer(COMPUTE_TEXTURE_SIDE_LENGTH, COMPUTE_TEXTURE_SIDE_LENGTH, this.renderer);

        const randomPosition = this.gpuRenderer.createShaderMaterial(require("../common-glsl/randPosition5.frag"), {});
        const noiseRenderTarget = this.gpuRenderer.createRenderTarget();
        this.gpuRenderer.doRenderTarget(randomPosition, noiseRenderTarget);

        this.positionVariable = this.gpuRenderer.addVariable("positions", require("./computePositionTexture.frag"), noiseRenderTarget.texture);
        this.gpuRenderer.setVariableDependencies(this.positionVariable, [ this.positionVariable ]);
        this.positionVariable.material.uniforms.u_mouse = { value: this.mouse };
        console.log(this.gpuRenderer.init());

        // const buffer = new Float32Array(COMPUTE_TEXTURE_SIDE_LENGTH * COMPUTE_TEXTURE_SIDE_LENGTH * 4);
        // this.renderer.readRenderTargetPixels(noiseRenderTarget, 0, 0, COMPUTE_TEXTURE_SIDE_LENGTH, COMPUTE_TEXTURE_SIDE_LENGTH, buffer);
        // console.log(buffer);

        // ok great now we have a texture with position information. now we feed this into a vert that uses that texture in computing gl_Position
        // the goal here is transforming positionTexture -> points on screen
        this.pointsMaterial = new THREE.ShaderMaterial({
            vertexShader: require("./textureToPosition.vert"),
            fragmentShader: `
varying float v_speed;

void main() {
    gl_FragColor = vec4(.99, .96, 1., 0.5);
}
            `,
            transparent: true,
        });
        this.pointsMaterial.uniforms.positionTexture = {
            value: null,
        };

        const geometry = new THREE.BufferGeometry();
        const numElements = COMPUTE_TEXTURE_SIDE_LENGTH * COMPUTE_TEXTURE_SIDE_LENGTH;
        const positions = new Float32Array(numElements * 3); // leave this empty, we don't use it
        const uvs = new Float32Array(numElements * 2);
        for (let i = 0; i < COMPUTE_TEXTURE_SIDE_LENGTH; i++) {
            for (let j = 0; j < COMPUTE_TEXTURE_SIDE_LENGTH; j++) {
                const index = (j * COMPUTE_TEXTURE_SIDE_LENGTH + i) * 2;
                uvs[index] = i / (COMPUTE_TEXTURE_SIDE_LENGTH - 1);
                uvs[index + 1] = j / (COMPUTE_TEXTURE_SIDE_LENGTH - 1);
            }
        }
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));

        const points = new THREE.Points(geometry, this.pointsMaterial);
        this.scene.add(points);

        // do it once just to warm it up
        this.iteratePingPong();
    }

    // ok now, ping-pong two render targets to continuously feed into each other and also into the positions.
    public iteratePingPong() {
        this.positionVariable.material.uniforms.u_time = {
            value: performance.now(),
        };
        this.gpuRenderer.compute();
        this.pointsMaterial.uniforms.positionTexture = {
            value: this.positionVariable.renderTargets[this.gpuRenderer.currentTextureIndex],
        };
    }

    // assumes target is rgbaformat
    public logRenderTarget(renderTarget: THREE.WebGLRenderTarget) {
        const buffer = new Float32Array(renderTarget.width * renderTarget.height * 4);
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, renderTarget.width, renderTarget.height, buffer);
        devlog(buffer);
    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    public animate() {
        if (performance.now() > 1000) {
            // holy SHIT this is fast - 10k iterations cost 700ms
            // of 1024 particles (each particle is 1024 texture lookups)
            // this equates to 68 nanoseconds per texture lookup (assuming that's the bottleneck). holy shit.
            // so at 16ms budget, I have 235k texture lookups,
            // if each particle takes 1K, that leaves me 229 iterations
            for (let i = 0; i < 30; i++) {
                this.iteratePingPong();
            }
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

export default GravityGPUComputation;
