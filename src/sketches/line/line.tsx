import * as classnames from "classnames";
import { Controller } from "leapjs";
import { parse } from "query-string";
import * as React from "react";
import * as THREE from "three";

import { GravityShader } from "../../common/gravityShader";
import { map } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { makeAttractor } from "./attractor";
import { createAudioGroup } from "./audio";
import { Instructions } from "./instructions";
import { initLeap } from "./leapMotion";
import { IParticle, resetToOriginalPosition, stepParticles } from "./particle";
import { createParticlePoints } from "./particlePoints";
import { computeStats } from "./particleStats";

export const NUM_PARTICLES = Number(parse(location.search).p) ||
    // cheap mobile detection
    (screen.width > 1024 ? 15000 : 5000);
// speed becomes this percentage of its original speed every second

export const attractors = [
    makeAttractor(),
    makeAttractor(),
    makeAttractor(),
    makeAttractor(),
    makeAttractor(),
];

export let instructionsEl: Instructions;

export let globalFrame = 0;

export function setMousePosition(mx: number, my: number) {
    mouseX = mx;
    mouseY = my;
}

let audioContext: SketchAudioContext;
let audioGroup: any;
export let canvas: HTMLCanvasElement;
const particles: IParticle[] = [];
let returnToStartPower = 0.0;

export let mouseX = 0, mouseY = 0;

let controller: Controller;

// threejs stuff
let camera: THREE.OrthographicCamera;
let composer: THREE.EffectComposer;
let gravityShaderPass: THREE.ShaderPass;
let points: THREE.Points;
let renderer: THREE.WebGLRenderer;
export let scene: THREE.Scene;

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    renderer = _renderer;
    audioContext = _audioContext;
    canvas = _renderer.domElement;

    audioGroup = createAudioGroup(audioContext);

    scene = new THREE.Scene();

    camera = new THREE.OrthographicCamera(0, canvas.width, 0, canvas.height, 1, 1000);
    camera.position.z = 500;

    attractors.forEach((attractor) => {
        scene.add(attractor.mesh);
    });

    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles[i] = {
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            vertex: null,
        };
        resetToOriginalPosition(particles[i], i);
    }
    points = createParticlePoints(particles);
    scene.add(points);

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    gravityShaderPass = new THREE.ShaderPass(GravityShader);
    gravityShaderPass.uniforms.iResolution.value = new THREE.Vector2(canvas.width, canvas.height);
    const gamma = parse(location.search).gamma;
    if (gamma) {
        gravityShaderPass.uniforms.gamma.value = gamma;
    }
    gravityShaderPass.renderToScreen = true;
    composer.addPass(gravityShaderPass);

    controller = initLeap();
}

function animate(millisElapsed: number) {
    attractors.forEach((attractor) => {
        attractor.mesh.position.z = -100;
        attractor.mesh.children.forEach((child, idx) => {
            child.rotation.y += (10 - idx) / 20 * attractor.power;
        });
        attractor.mesh.rotation.x = 0.8; // attractor.power + 0.1;
        const scale = Math.sqrt(attractor.power) / 5;
        attractor.mesh.scale.set(scale, scale, scale);
    });

    gravityShaderPass.uniforms.iMouse.value.set(attractors[0].x, renderer.domElement.height - attractors[0].y);

    if (returnToStartPower > 0 && returnToStartPower < 1) {
        returnToStartPower *= 1.01;
    }

    const nonzeroAttractors = attractors.filter((attractor) => attractor.power !== 0);

    stepParticles(particles, nonzeroAttractors);
    const { averageX, averageY, averageVel, varianceLength, normalizedAverageVel, normalizedVarianceLength, flatRatio, normalizedEntropy } = computeStats(particles);

    audioGroup.sourceLfo.frequency.value = flatRatio;
    if (normalizedEntropy !== 0) {
        audioGroup.setFrequency(222 / normalizedEntropy);
        // audioGroup.setFrequency(500 * normalizedAverageVel * normalizedAverageVel);
    }

    // const noiseFreq = 2000 * (Math.pow(8, normalizedVarianceLength) / 8);
    const noiseFreq = 2000 * normalizedVarianceLength;
    audioGroup.setNoiseFrequency(noiseFreq);

    const groupedUpness = Math.sqrt(averageVel / varianceLength);
    audioGroup.setVolume(Math.max(groupedUpness - 0.05, 0));

    const mouseDistanceToCenter = Math.sqrt(Math.pow(mouseX - averageX, 2) + Math.pow(mouseY - averageY, 2));
    const normalizedMouseDistanceToCenter = mouseDistanceToCenter / Math.sqrt(canvas.width * canvas.height);
    const backgroundVolume = 0.33 / (1 + normalizedMouseDistanceToCenter * normalizedMouseDistanceToCenter);
    audioGroup.setBackgroundVolume(backgroundVolume);

    gravityShaderPass.uniforms.iGlobalTime.value = audioContext.currentTime / 1;
    gravityShaderPass.uniforms.G.value = triangleWaveApprox(audioContext.currentTime / 5) * (groupedUpness + 0.50) * 15000;
    gravityShaderPass.uniforms.iMouseFactor.value = (1 / 15) / (groupedUpness + 1);
    // filter.uniforms['iMouse'].value = new THREE.Vector2(averageX, canvas.height - averageY);

    (points.geometry as THREE.Geometry).verticesNeedUpdate = true;
    composer.render();
    globalFrame++;
    instructionsEl.setGlobalFrame(globalFrame);
    const isLeapMotionControllerValid = controller.lastFrame.valid;
    instructionsEl.setLeapMotionControllerValid(isLeapMotionControllerValid);
}

// 3 orders of fft for triangle wave
function triangleWaveApprox(t: number) {
    return 8 / (Math.PI * Math.PI) * (Math.sin(t) - (1 / 9) * Math.sin(3 * t) + (1 / 25) * Math.sin(5 * t));
}

function enableFirstAttractor(x: number, y: number) {
    const attractor = attractors[0];
    attractor.x = x;
    attractor.y = y;
    attractor.power = 1;
    gravityShaderPass.uniforms.iMouse.value.set(x, renderer.domElement.height - y);
    returnToStartPower = 0;
}

function moveFirstAttractor(x: number, y: number) {
    const attractor = attractors[0];
    attractor.x = x;
    attractor.y = y;
    attractor.mesh.position.set(x, y, 0);
}

function disableFirstAttractor() {
    const attractor = attractors[0];
    attractor.power = 0;
}

export const LineSketch = new (class extends ISketch {
    public id = "line";
    public canvasProps: ISketch["canvasProps"] = {
        onMouseDown: (event) => {
            if (event.button === 0) {
                // TODO simply using pageX/pageY is dangerous, we should really fix this
                mouseX = event.pageX;
                mouseY = event.pageY;
                enableFirstAttractor(mouseX, mouseY);
            }
        },
        onMouseMove: (event) => {
            mouseX = event.pageX;
            mouseY = event.pageY;
            moveFirstAttractor(mouseX, mouseY);
        },
        onMouseUp: (event) => {
            disableFirstAttractor();
        },
        onTouchStart: (event) => {
            // prevent emulated mouse events from occuring
            event.preventDefault();
            const touch = event.touches[0];
            const touchX = touch.pageX;
            // offset the touchY by its radius so the attractor is above the thumb
            const touchY = touch.pageY - 100;

            mouseX = touchX;
            mouseY = touchY;
            enableFirstAttractor(touchX, touchY);
        },
        onTouchMove: (event) => {
            const touch = event.touches[0];
            const touchX = touch.pageX;
            // offset the touchY by its radius so the attractor is above the thumb
            const touchY = touch.pageY - 100;

            mouseX = touchX;
            mouseY = touchY;
            moveFirstAttractor(touchX, touchY);
        },
        onTouchEnd: (event) => {
            disableFirstAttractor();
        },
    };

    public elements = [<Instructions ref={(instructions) => instructionsEl = instructions!} />];

    public init() {
        init(this.renderer, this.audioContext);
    }

    public animate(millisElapsed: number) {
        animate(millisElapsed);
    }

    public resize(width: number, height: number) {
        camera.right = width;
        camera.bottom = height;
        camera.updateProjectionMatrix();

        gravityShaderPass.uniforms.iResolution.value = new THREE.Vector2(width, height);
    }
})();
