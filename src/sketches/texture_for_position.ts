import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../sketch";

// goal - use a shader to fill in a texture, which is then used to fill in the positions of particles

export const TextureForPosition = new (class implements ISketch {
    public id = "texture_for_position";

    public scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    public controls: THREE.OrbitControls;

    public audioContext: SketchAudioContext;

    public init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext) {
        this.renderer = renderer;
        this.audioContext = audioContext;
        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        this.camera.position.z = 5;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.controls = new THREE.OrbitControls(this.camera, renderer.domElement);
        // AND NOW, WE CREATE A TEXTURE WHERE EACH PIXEL HOLDS 4 FLOATING POINT NUMBERS WITH ACTUAL 32 BIT PRECISION
        const width = 512;
        const height = 512;
        const numElements = width * height;
        const dummyBuffer = new Float32Array(numElements * 4);
        // ok, so I can use this to fill in initial positions. lets test it
        for (let index = 0; index < dummyBuffer.length; index += 4) {
            dummyBuffer[index] = Math.sin(index / 1000.) / 2;
            dummyBuffer[index + 1] = Math.cos(index * 1.6 / 1000.) / 2;
            dummyBuffer[index + 2] = index / dummyBuffer.length;
            dummyBuffer[index + 3] = 1;
        }
        const texture = new THREE.DataTexture(dummyBuffer, width, height, THREE.RGBAFormat, THREE.FloatType);
        texture.needsUpdate = true;

        // ok great now we have a texture with position information. now we feed this into a vert that uses that texture in computing gl_Position
        // the goal here is transforming positionTexture -> points on screen
        const material = new THREE.ShaderMaterial({
            transparent: true,
            fragmentShader: `
void main() {
    gl_FragColor = vec4(0.9, 0.6, 0.6, 0.1);
}
            `,
            vertexShader: `
// // default vertex attributes provided by Geometry and BufferGeometry
// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;
// attribute vec2 uv2;

// // stuff provided by THREE
// // = object.matrixWorld
// uniform mat4 modelMatrix;

// // = camera.matrixWorldInverse * object.matrixWorld
// uniform mat4 modelViewMatrix;

// // = camera.projectionMatrix
// uniform mat4 projectionMatrix;

// // = camera.matrixWorldInverse
// uniform mat4 viewMatrix;

// // = inverse transpose of modelViewMatrix
// uniform mat3 normalMatrix;

// // = camera position in world space
// uniform vec3 cameraPosition;

uniform sampler2D positionTexture;

void main() {
    // extract this point's position from the texture. We fill in the .uv coord
    vec4 worldPosition = texture2D(positionTexture, uv);
    gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
    gl_PointSize = 1.;
}
`,
        });
        material.uniforms["positionTexture"] = {
            value: texture,
        };

        // wait something's weird here. I have to pair this material with a geometry. I then add a *mesh* to the scene
        // and render that mesh with the camera?

        // I should be using a THREE.Points actually
        // what do I put in the geometry?
        // I need one *vertex* per point. Like, the Geometry.vertices array should be length width*height,
        // and every position in the vertices array is already given by `position` in the shader.
        // So I actually have two arrays of length width*height - first a texture that holds positions,
        // and also this vertices array.
        // I *could* just leave the positions totally empty, but it still seems wasteful. Do you just have to
        // waste that?

        // ok I looked at GPUParticleSystem, but that's a different thing - in GPUParticleSystem,
        // the particle positions are all attributes that are supplied by CPU.

        // ok - gpgpu protoplanet: yes they use a THREE.Points
        // yes, they do use the positions - wait jk, the code does absolutely nothing. ok so they just
        // pass extra unused data. they *do* use the uv though by filling that in manually.
        // ok, whatever, lets just ignore it. keep moving forward!

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(numElements * 3); // leave this empty, we don't use it
        const uvs = new Float32Array(numElements * 2);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const index = (j * width + i) * 2;
                uvs[index] = i / (width - 1);
                uvs[index + 1] = j / (height - 1);
            }
        }
        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));

        // FUCK yes we've properly connected texture -> points
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        this.scene.add(new THREE.AxisHelper());

        // FUUUUCK YESSS!!!!

        // ok, next step: we connect texture -> texture
        // that is, render to a texture.
        // we cannot render to the same texture we're already using.
        // lets first test this by rendering random noise to a texture, and just looking at the data.

        const randomNoiseShader = new THREE.ShaderMaterial({
            fragmentShader: `
float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    gl_FragColor = vec4(rand(gl_FragCoord.xy), gl_FragCoord.y, 0.3, 1.);
}
`,
            vertexShader: `
void main() {
    gl_Position = vec4(position, 1.0);
}
`,
side: THREE.DoubleSide,
        });

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -5, 5);
        camera.position.z = 1;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        const scene = new THREE.Scene();
        const mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), randomNoiseShader);
        scene.add(mesh);
        // scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial({
        //     color: 0xff2235,
        //     side: THREE.DoubleSide,
        // })));
        // DEBUG
        this.renderer.render(scene, camera);

        const renderTarget = new THREE.WebGLRenderTarget(512, 512, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
            stencilBuffer: false,
        });
        // do the render
        this.renderer.render(scene, camera, renderTarget);
        console.log(renderTarget.texture);
        const buffer = new Float32Array(512 * 512 * 4);
        // YUUUUUUS THIS WORKS!!!!!!
        this.renderer.readRenderTargetPixels(renderTarget, 0, 0, 512, 512, buffer);
        console.log(buffer);

    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    public animate() {
        // this.controls.update();
        // this.renderer.render(this.scene, this.camera);
    }
})();
