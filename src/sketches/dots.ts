import * as $ from "jquery";
import { parse } from "query-string";
import * as THREE from "three";

import { createWhiteNoise } from "../audio/noise";
import { ExplodeShader } from "../common/explodeShader";
import { ISketch, SketchAudioContext } from "../sketch";

interface Point {
    x: number;
    y: number;
}

let NUM_FREE_PARTICLES: number;
const SIMULATION_SPEED = 3;
const GRAVITY_CONSTANT = 100;
const STATIONARY_CONSTANT = 0.01;
// speed becomes this percentage of its original speed every second
const PULLING_DRAG_CONSTANT = 0.96075095702;
const INERTIAL_DRAG_CONSTANT = 0.23913643334;
const EXTENT = 10;
const GRID_SIZE = parse(location.search).gridSize || 7;

function createAudioGroup(audioContext: SketchAudioContext) {

    // white noise
    const noise = createWhiteNoise(audioContext);
    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0;
    noise.connect(noiseGain);

    const BASE_FREQUENCY = 164.82;
    function detuned(freq: number, centsOffset: number) {
        return freq * Math.pow(2, centsOffset / 1200);
    }
    const source1 = (function() {
        const node = audioContext.createOscillator();
        node.frequency.value = detuned(BASE_FREQUENCY / 2, 2);
        node.type = "square";
        node.start(0);

        const gain = audioContext.createGain();
        gain.gain.value = 0.30;
        node.connect(gain);

        return gain;
    })();
    const source2 = (function() {
        const node = audioContext.createOscillator();
        node.frequency.value = BASE_FREQUENCY;
        node.type = "sawtooth";
        node.start(0);

        const gain = audioContext.createGain();
        gain.gain.value = 0.30;
        node.connect(gain);

        return gain;
    })();

    const sourceGain = audioContext.createGain();
    sourceGain.gain.value = 0.0;

    const lfo = audioContext.createOscillator();
    lfo.frequency.value = 8.66;
    lfo.start(0);

    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 0;

    lfo.connect(lfoGain);

    const filter = audioContext.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 0;
    filter.Q.value = 5.18;

    const filter2 = audioContext.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.value = 0;
    filter2.Q.value = 5.18;

    const filterGain = audioContext.createGain();
    filterGain.gain.value = 0.7;

    source1.connect(sourceGain);
    source2.connect(sourceGain);
    sourceGain.connect(filter);

    lfoGain.connect(filter.frequency);
    lfoGain.connect(filter2.frequency);
    filter.connect(filter2);
    filter2.connect(filterGain);

    noiseGain.connect(audioContext.gain);
    filterGain.connect(audioContext.gain);
    return {
        sourceGain,
        lfo,
        lfoGain,
        filter,
        filter2,
        filterGain,
        setFrequency(freq: number) {
            filter.frequency.value = freq;
            filter2.frequency.value = freq;
            lfoGain.gain.value = freq * .06;
        },
        setVolume(volume: number) {
            sourceGain.gain.value = volume;
            noiseGain.gain.value = volume * 0.05;
        },
    };
}

interface Particle {
    dragRatio: number;
    dx: number;
    dy: number;
    isStationary: boolean;
    originalX: number;
    originalY: number;
    x: number;
    y: number;
    vertex: THREE.Vertex;
}

function createParticle(originalX: number, originalY: number, isStationary: boolean, dragRatio: number): Particle {
    return {
        dragRatio,
        dx: 0,
        dy: 0,
        isStationary,
        originalX,
        originalY,
        x: originalX,
        y: originalY,
        vertex: null!,
    };
}

let audioGroup: any;
let attractor: Point | null = null;
let canvas: HTMLCanvasElement;
let dragConstant = INERTIAL_DRAG_CONSTANT;
let mouseX: number, mouseY: number;
const particles: Particle[] = [];

// threejs stuff
let camera: THREE.OrthographicCamera;
let composer: THREE.EffectComposer;
let filter: THREE.ShaderPass;
let geometry: THREE.Geometry;
let pointCloud: THREE.Points;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    audioGroup = createAudioGroup(_audioContext);
    canvas = _renderer.domElement;

    scene = new THREE.Scene();
    renderer = _renderer;
    camera = new THREE.OrthographicCamera(0, canvas.width, 0, canvas.height, 1, 1000);
    camera.position.z = 500;

    for (let x = -EXTENT * GRID_SIZE; x < canvas.width + EXTENT * GRID_SIZE; x += GRID_SIZE) {
        for (let y = -EXTENT * GRID_SIZE; y < canvas.height + EXTENT * GRID_SIZE; y += GRID_SIZE) {
            particles.push(createParticle(x, y, true, 0.9));
            // createParticle(x, y, true, 0.88);
            // createParticle(x, y, true, 0.86);
            // createParticle(x, y, true, 0.84);
            // createParticle(x, y, true, 0.82);
        }
    }
    NUM_FREE_PARTICLES = particles.length;
    instantiatePointCloudAndGeometry();
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    filter = new THREE.ShaderPass(ExplodeShader);
    filter.uniforms.iResolution.value = new THREE.Vector2(canvas.width, canvas.height);
    filter.renderToScreen = true;
    composer.addPass(filter);
}

function animate(millisElapsed: number) {
    const timeStep = millisElapsed / 1000 * SIMULATION_SPEED;
    let averageX = 0, averageY = 0;
    let averageVel2 = 0;
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        if (attractor != null) {
            const dx = attractor.x - particle.x;
            const dy = attractor.y - particle.y;
            const length2 = Math.sqrt(dx * dx + dy * dy);
            const forceX = GRAVITY_CONSTANT * dx / length2;
            const forceY = GRAVITY_CONSTANT * dy / length2;

            particle.dx += forceX * timeStep;
            particle.dy += forceY * timeStep;
        }

        if (particle.isStationary) {
            const dx = particle.originalX - particle.x;
            const dy = particle.originalY - particle.y;
            const length2 = Math.sqrt(dx * dx + dy * dy);
            const forceX = STATIONARY_CONSTANT * dx * length2;
            const forceY = STATIONARY_CONSTANT * dy * length2;

            particle.dx += forceX * timeStep;
            particle.dy += forceY * timeStep;

            if (attractor == null) {
                particle.originalX -= dx * 0.05;
                particle.originalY -= dy * 0.05;
            }
        }

        let thisParticleDragConstant = dragConstant;
        if (particle.dragRatio) {
            thisParticleDragConstant *= particle.dragRatio;
        }
        particle.dx *= Math.pow(thisParticleDragConstant, timeStep);
        particle.dy *= Math.pow(thisParticleDragConstant, timeStep);

        particle.x += particle.dx * timeStep;
        particle.y += particle.dy * timeStep;

        particle.vertex.x = particle.x;
        particle.vertex.y = particle.y;
        averageX += particle.x;
        averageY += particle.y;
        averageVel2 += particle.dx * particle.dx + particle.dy * particle.dy;
    }
    averageX /= NUM_FREE_PARTICLES;
    averageY /= NUM_FREE_PARTICLES;
    averageVel2 /= NUM_FREE_PARTICLES;
    let varianceX2 = 0;
    let varianceY2 = 0;
    let varianceVel22 = 0;
    for (let i = 0; i < NUM_FREE_PARTICLES; i++) {
        const particle = particles[i];
        varianceX2 += Math.pow(particle.x - averageX, 2);
        varianceY2 += Math.pow(particle.y - averageY, 2);
        varianceVel22 += Math.pow(particle.dx * particle.dx + particle.dy * particle.dy - averageVel2, 2);
    }
    varianceX2 /= NUM_FREE_PARTICLES;
    varianceY2 /= NUM_FREE_PARTICLES;
    varianceVel22 /= NUM_FREE_PARTICLES;

    const varianceX = Math.sqrt(varianceX2);
    const varianceY = Math.sqrt(varianceY2);
    const varianceVel2 = Math.sqrt(varianceVel22);

    const varianceLength = Math.sqrt(varianceX2 + varianceY2);
    const varianceVel = Math.sqrt(varianceVel2);
    const averageVel = Math.sqrt(averageVel2);

    // flatRatio = 1 -> perfectly circular
    // flatRatio is high (possibly Infinity) -> extremely horizontally flat
    // flatRatio is low (near 0) -> vertically thin
    const flatRatio = varianceX / varianceY;

    // TODO divide velocity and length by canvas dimensions so that size of canvas has no effect

    // in reset formation, the varianceLength = (sqrt(1/2) - 1/2) * magicNumber * canvasWidth
    // magicNumber is experimentally found to be 1.3938
    // AKA varianceLength = 0.28866 * canvasWidth
    const normalizedVarianceLength = varianceLength / (0.28866 * (canvas.width + canvas.height) / 2);

    const groupedUpness = Math.sqrt(averageVel / varianceLength);
    audioGroup.lfo.frequency.value = flatRatio;
    audioGroup.setFrequency(111 / normalizedVarianceLength);
    audioGroup.setVolume(Math.max(groupedUpness - 0.05, 0));

    filter.uniforms.iMouse.value = new THREE.Vector2(mouseX / canvas.width, (canvas.height - mouseY) / canvas.height);
    // when groupedUpness is 0, shrinkFactor should be 0.98
    // when groupedUpness is 1, shrinkFactor should be 1.0
    // filter.uniforms['shrinkFactor'].value = 0.98 + groupedUpness * 0.03;

    geometry.verticesNeedUpdate = true;
    composer.render();
}

function touchstart(event: JQuery.Event) {
    // prevent emulated mouse events from occuring
    event.preventDefault();
    const canvasOffset = $(canvas).offset()!;
    const touch = (event.originalEvent as TouchEvent).touches[0];
    const touchX = touch.pageX - canvasOffset.left;
    const touchY = touch.pageY - canvasOffset.top;
    // offset the touchY by its radius so the attractor is above the thumb
    // touchY -= 100;
    createAttractor(touchX, touchY);
    mouseX = touchX;
    mouseY = touchY;
}

function touchmove(event: JQuery.Event) {
    const canvasOffset = $(canvas).offset()!;
    const touch = (event.originalEvent as TouchEvent).touches[0];
    const touchX = touch.pageX - canvasOffset.left;
    const touchY = touch.pageY - canvasOffset.top;
    // touchY -= 100;
    moveAttractor(touchX, touchY);
    mouseX = touchX;
    mouseY = touchY;
}

function touchend(event: JQuery.Event) {
    removeAttractor();
}

function mousedown(event: JQuery.Event) {
    if (event.which === 1) {
        mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
        mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
        createAttractor(mouseX, mouseY);
    }
}

function mousemove(event: JQuery.Event) {
    mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
    mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
    moveAttractor(mouseX, mouseY);
}

function mouseup(event: JQuery.Event) {
    if (event.which === 1) {
        removeAttractor();
    }
}

function createAttractor(x: number, y: number) {
    attractor = { x, y };
    dragConstant = PULLING_DRAG_CONSTANT;
}

function moveAttractor(x: number, y: number) {
    if (attractor != null) {
        attractor.x = x;
        attractor.y = y;
    }
}

function removeAttractor() {
    dragConstant = INERTIAL_DRAG_CONSTANT;
    attractor = null;
}

function resize(width: number, height: number) {
    camera.right = width;
    camera.bottom = height;
    filter.uniforms.iResolution.value = new THREE.Vector2(width, height);

    camera.updateProjectionMatrix();
}

function instantiatePointCloudAndGeometry() {
    if (pointCloud != null) {
        scene.remove(pointCloud);
    }
    geometry = new THREE.Geometry();
    for (let i = 0; i < NUM_FREE_PARTICLES; i++) {
        const particle = particles[i];
        const vertex = new THREE.Vector3(particle.x, particle.y, 0);
        geometry.vertices.push(vertex);
        particles[i].vertex = vertex;
    }

    const starTexture = THREE.ImageUtils.loadTexture("/assets/sketches/line/star.png");
    starTexture.minFilter = THREE.NearestFilter;
    const material = new THREE.PointsMaterial({
        size: 15,
        sizeAttenuation: false,
        map: starTexture,
        opacity: 0.18,
        transparent: true,
    });
    pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
}

export const Dots: ISketch = {
    id: "dots",
    init,
    instructions: "Click, drag, release, look, listen.",
    animate,
    darkTheme: true,
    mousedown,
    mousemove,
    mouseup,
    resize,
    touchstart,
    touchmove,
    touchend,
};
