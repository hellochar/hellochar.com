import * as classnames from "classnames";
import * as $ from "jquery";
import * as Leap from "leapjs";
import { parse } from "query-string";
import * as React from "react";
import { CSSTransition } from "react-transition-group";
import * as THREE from "three";

import { GravityShader } from "../common/gravityShader";
import { map } from "../math/index";
import { ISketch, SketchAudioContext } from "../sketch";

const NUM_PARTICLES = Number(parse(location.search).p) ||
    // cheap mobile detection
    (screen.width > 1024 ? 15000 : 5000);
const SIMULATION_SPEED = 2;
const GRAVITY_CONSTANT = 280;
const LIFETIME = 15;
// speed becomes this percentage of its original speed every second
const PULLING_DRAG_CONSTANT = 0.93075095702;
const INERTIAL_DRAG_CONSTANT = 0.53913643334;

function createAudioGroup(ctx: SketchAudioContext) {
    const backgroundAudio = $("<audio autoplay loop>")
        .append('<source src="/assets/sketches/line/line_background.ogg" type="audio/ogg">')
        .append('<source src="/assets/sketches/line/line_background.mp3" type="audio/mp3">') as JQuery<HTMLMediaElement>;

    const sourceNode = ctx.createMediaElementSource(backgroundAudio[0]);
    $("body").append(backgroundAudio);

    const backgroundAudioGain = ctx.createGain();
    backgroundAudioGain.gain.value = 0.5;
    sourceNode.connect(backgroundAudioGain);
    backgroundAudioGain.connect(ctx.gain);

    // white noise
    const noise = (() => {
        const node = ctx.createBufferSource()
            , buffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate)
            , data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random();
        }
        node.buffer = buffer;
        node.loop = true;
        node.start(0);
        return node;
    })();

    // // pink noise from http://noisehack.com/generate-noise-web-audio-api/
    // var noise = (function() {
    //     var bufferSize = 4096;
    //     var b0, b1, b2, b3, b4, b5, b6;
    //     b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    //     var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
    //     node.onaudioprocess = function(e) {
    //         var output = e.outputBuffer.getChannelData(0);
    //         for (var i = 0; i < bufferSize; i++) {
    //             var white = Math.random() * 2 - 1;
    //             b0 = 0.99886 * b0 + white * 0.0555179;
    //             b1 = 0.99332 * b1 + white * 0.0750759;
    //             b2 = 0.96900 * b2 + white * 0.1538520;
    //             b3 = 0.86650 * b3 + white * 0.3104856;
    //             b4 = 0.55000 * b4 + white * 0.5329522;
    //             b5 = -0.7616 * b5 - white * 0.0168980;
    //             output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    //             output[i] *= 0.11; // (roughly) compensate for gain
    //             b6 = white * 0.115926;
    //         }
    //     }
    //     return node;
    // })();

    const noiseSourceGain = ctx.createGain();
    noiseSourceGain.gain.value = 0;
    noise.connect(noiseSourceGain);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 0;
    noiseFilter.Q.value = 1.0;
    noiseSourceGain.connect(noiseFilter);

    const noiseShelf = ctx.createBiquadFilter();
    noiseShelf.type = "lowshelf";
    noiseShelf.frequency.value = 2200;
    noiseShelf.gain.value = 8;
    noiseFilter.connect(noiseShelf);

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 1.0;
    noiseShelf.connect(noiseGain);

    const BASE_FREQUENCY = 320;
    function detuned(freq: number, centsOffset: number) {
        return freq * Math.pow(2, centsOffset / 1200);
    }
    function semitone(freq: number, semitoneOffset: number) {
        return detuned(freq, semitoneOffset * 100);
    }
    const source1 = (() => {
        const node = ctx.createOscillator();
        node.frequency.value = detuned(BASE_FREQUENCY / 2, 2);
        node.type = "square";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.30;
        node.connect(gain);

        return gain;
    })();
    const source2 = (() => {
        const node = ctx.createOscillator();
        node.frequency.value = BASE_FREQUENCY;
        node.type = "sawtooth";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.30;
        node.connect(gain);

        return gain;
    })();

    const sourceLow = (() => {
        const node = ctx.createOscillator();
        node.frequency.value = BASE_FREQUENCY / 4;
        node.type = "sawtooth";
        node.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.90;
        node.connect(gain);

        return gain;
    })();

    function makeChordSource(baseFrequency: number) {
        const base = ctx.createOscillator();
        base.frequency.value = baseFrequency;
        base.start(0);

        const octave = ctx.createOscillator();
        octave.frequency.value = semitone(baseFrequency, 12);
        octave.type = "sawtooth";
        octave.start(0);

        const fifth = ctx.createOscillator();
        fifth.frequency.value = semitone(baseFrequency, 12 + 7);
        fifth.type = "sawtooth";
        fifth.start(0);

        const octave2 = ctx.createOscillator();
        octave2.frequency.value = semitone(baseFrequency, 24);
        octave2.type = "sawtooth";
        octave2.start(0);

        const fourth = ctx.createOscillator();
        fourth.frequency.value = semitone(baseFrequency, 24 + 4);
        fourth.start(0);

        const gain = ctx.createGain();
        gain.gain.value = 0.0;
        base.connect(gain);
        octave.connect(gain);
        fifth.connect(gain);
        octave2.connect(gain);
        fourth.connect(gain);

        return gain;
    }
    const chordSource = makeChordSource(BASE_FREQUENCY);
    const chordHigh = makeChordSource(BASE_FREQUENCY * 8);

    const sourceGain = ctx.createGain();
    sourceGain.gain.value = 0.0;

    const sourceLfo = ctx.createOscillator();
    sourceLfo.frequency.value = 8.66;
    sourceLfo.start(0);

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0;

    sourceLfo.connect(lfoGain);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 0;
    filter.Q.value = 2.18;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = "bandpass";
    filter2.frequency.value = 0;
    filter2.Q.value = 2.18;

    const filterGain = ctx.createGain();
    filterGain.gain.value = 0.4;

    chordSource.connect(sourceGain);
    source1.connect(sourceGain);
    source2.connect(sourceGain);
    sourceLow.connect(sourceGain);
    chordHigh.connect(filter);
    sourceGain.connect(filter);

    lfoGain.connect(filter.frequency);
    lfoGain.connect(filter2.frequency);
    filter.connect(filter2);
    filter2.connect(filterGain);

    const audioGain = ctx.createGain();
    audioGain.gain.value = 1.0;

    noiseGain.connect(audioGain);
    filterGain.connect(audioGain);

    const analyser = ctx.createAnalyser();
    audioGain.connect(analyser);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 12;
    compressor.ratio.value = 2;
    analyser.connect(compressor);

    const highAttenuation = ctx.createBiquadFilter();
    highAttenuation.type = "highshelf";
    highAttenuation.frequency.value = BASE_FREQUENCY * 4;
    highAttenuation.gain.value = -6;
    compressor.connect(highAttenuation);

    const highAttenuation2 = ctx.createBiquadFilter();
    highAttenuation2.type = "highshelf";
    highAttenuation2.frequency.value = BASE_FREQUENCY * 8;
    highAttenuation2.gain.value = -6;
    highAttenuation.connect(highAttenuation2);

    highAttenuation2.connect(ctx.gain);

    return {
        analyser,
        chordGain: chordSource,
        sourceGain,
        sourceLfo,
        lfoGain,
        filter,
        filter2,
        filterGain,
        setFrequency(freq: number) {
            filter.frequency.value = freq;
            filter2.frequency.value = freq;
            lfoGain.gain.value = freq * .06;
        },
        setNoiseFrequency(freq: number) {
            noiseFilter.frequency.value = freq;
        },
        setVolume(volume: number) {
            sourceGain.gain.value = volume / 9;
            noiseSourceGain.gain.value = volume * 0.05;
            chordSource.gain.value = 0.05;
            chordHigh.gain.value = volume / 40;
        },
        setBackgroundVolume(volume: number) {
            backgroundAudioGain.gain.value = volume;
        },
    };
}

const attractorGeometry = new THREE.RingGeometry(15, 18, 32);
const attractorMaterialSolid = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    // color: 0xe2cfb3,
    // color: 0xe1f7e6,
    color: 0xadd6b6,
    transparent: true,
    opacity: 0.6,
});

interface Attractor {
    x: number;
    y: number;
    handMesh?: HandMesh;
    mesh: THREE.Object3D;
    power: number;
}

type HandMesh = THREE.Object3D & {
    [childId: string]: THREE.Line | THREE.Mesh;
};

function makeAttractor(x = 0, y = 0, power = 0): Attractor {
    const mesh = new THREE.Object3D();
    mesh.position.set(x, y, -100);
    for (let i = 0; i < 10; i++) {
        // var ring = THREE.SceneUtils.createMultiMaterialObject(attractorGeometry, [attractorMaterialSolid, attractorMaterialStroke]);
        const ring = new THREE.Mesh(attractorGeometry, attractorMaterialSolid);
        const scale = 1 + Math.pow(i / 10, 2) * 2;
        ring.scale.set(scale, scale, scale);
        mesh.add(ring);
    }
    mesh.visible = false;

    return {
        x,
        y,
        handMesh: undefined,
        mesh,
        power,
    };
}

const attractors = [
    makeAttractor(),
    makeAttractor(),
    makeAttractor(),
    makeAttractor(),
    makeAttractor(),
];

let audioContext: SketchAudioContext;
let audioGroup: any;
let canvas: HTMLCanvasElement;
let dragConstant;
const particles: IParticle[] = [];
let returnToStartPower = 0.0;

let mouseX = 0, mouseY = 0;

// threejs stuff
let camera: THREE.OrthographicCamera;
let composer: THREE.EffectComposer;
let gravityShaderPass: THREE.ShaderPass;
let geometry: THREE.Geometry;
let pointCloud: THREE.Points;
let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;

interface IParticle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    vertex: THREE.Vertex | null;
    life: number;
}

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
            life: 0,
        };
        resetToOriginalPosition(particles[i], i);
    }
    instantiatePointCloudAndGeometry();

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
}

function resetToOriginalPosition(particle: IParticle, i: number) {
    const gridSize = Math.floor(Math.sqrt(NUM_PARTICLES));
    // const x = (i % gridSize) / gridSize * canvas.width;
    // const y = Math.floor(i / gridSize) / gridSize * canvas.height;
    const x = i / NUM_PARTICLES * canvas.width;
    const y = canvas.height / 2 + ((i % 5) - 2) * 2;
    particle.x = x;
    particle.y = y;
    particle.dx = particle.dy = 0;
    particle.life = 0;
}

let globalFrame = 0;

function animate(millisElapsed: number) {
    const allAttractorPowers = attractors.reduce((b, a) => Math.abs(a.power) + b, 0);
    dragConstant = (allAttractorPowers > 0.1) ? PULLING_DRAG_CONSTANT : INERTIAL_DRAG_CONSTANT;

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
    // const timeStep = millisElapsed / 1000 * SIMULATION_SPEED;
    const timeStep = .016 * SIMULATION_SPEED * speedScalar;
    if (returnToStartPower > 0 && returnToStartPower < 1) {
        returnToStartPower *= 1.01;
    }
    const sizeScaledGravityConstant = GRAVITY_CONSTANT * Math.min(Math.pow(2, canvas.width / 836 - 1), 1);

    let averageX = 0, averageY = 0;
    let averageVel2 = 0;
    const nonzeroAttractors = attractors.filter((attractor) => attractor.power !== 0);

    // e.g. out of 100k particles, reset 10k this frame
    // if globalFrame = 3, reset particles 30k to 40k
    // const frameOffset = (globalFrame % LIFETIME) / LIFETIME;
    // for (let i = 0; i < NUM_PARTICLES / LIFETIME; i++) {
    //     const index = (globalFrame * NUM_PARTICLES / LIFETIME + i) % NUM_PARTICLES;
    //     const particle = particles[index];

    //     // take this chunk of particles and spread them evenly
    //     const numParticlesToReset = NUM_PARTICLES / LIFETIME;
    //     particle.x = map(i + frameOffset, 0, NUM_PARTICLES / LIFETIME, 0, canvas.width);
    //     particle.y = canvas.height / 2;
    //     particle.dx = particle.dy = 0;
    //     particle.life = 0;
    // }

    for (let i = 0; i < NUM_PARTICLES; i++) {
        const particle = particles[i];

        nonzeroAttractors.forEach((attractor) => {
            const dx = attractor.x - particle.x;
            const dy = attractor.y - particle.y;
            const length2 = Math.sqrt(dx * dx + dy * dy);
            const forceX = attractor.power * sizeScaledGravityConstant * dx / length2;
            const forceY = attractor.power * sizeScaledGravityConstant * dy / length2;

            particle.dx += forceX * timeStep;
            particle.dy += forceY * timeStep;
        });
        particle.dx *= Math.pow(dragConstant, timeStep);
        particle.dy *= Math.pow(dragConstant, timeStep);

        particle.x += particle.dx * timeStep;
        particle.y += particle.dy * timeStep;
        particle.life += 1;
        if (particle.x < 0 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
            resetToOriginalPosition(particle, i);
        }

        const wantedX = i * canvas.width / NUM_PARTICLES;
        const wantedY = canvas.height / 2;
        if (returnToStartPower > 0) {
            particle.x -= (particle.x - wantedX) * returnToStartPower;
            particle.y -= (particle.y - wantedY) * returnToStartPower;
        }

        particle.vertex!.x = particle.x;
        particle.vertex!.y = particle.y;
        averageX += particle.x;
        averageY += particle.y;
        averageVel2 += particle.dx * particle.dx + particle.dy * particle.dy;
    }
    averageX /= NUM_PARTICLES;
    averageY /= NUM_PARTICLES;
    averageVel2 /= NUM_PARTICLES;
    let varianceX2 = 0;
    let varianceY2 = 0;
    let varianceVel22 = 0;
    let entropy = 0;
    let numLeft = 0, numRight = 0;
    for (let i = 0; i < NUM_PARTICLES; i++) {
        const particle = particles[i];
        const dx2 = Math.pow(particle.x - averageX, 2),
            dy2 = Math.pow(particle.y - averageY, 2);
        varianceX2 += dx2;
        varianceY2 += dy2;
        varianceVel22 += Math.pow(particle.dx * particle.dx + particle.dy * particle.dy - averageVel2, 2);
        const length = Math.sqrt(dx2 + dy2);
        if (length > 0) {
            entropy += length * Math.log(length);
        }
        if (particle.x < averageX) {
            numLeft++;
        } else {
            numRight++;
        }
    }
    entropy /= NUM_PARTICLES;
    varianceX2 /= NUM_PARTICLES;
    varianceY2 /= NUM_PARTICLES;
    varianceVel22 /= NUM_PARTICLES;

    const varianceX = Math.sqrt(varianceX2);
    const varianceY = Math.sqrt(varianceY2);
    const varianceVel2 = Math.sqrt(varianceVel22);

    const varianceLength = Math.sqrt(varianceX2 + varianceY2);
    const varianceVel = Math.sqrt(varianceVel2);
    const averageVel = Math.sqrt(averageVel2);

    // flatRatio = 1 -> perfectly circular
    // flatRatio is high (possibly Infinity) -> extremely horizontally flat
    // flatRatio is low (near 0) -> vertically thin
    let flatRatio = varianceX / varianceY;
    if (varianceY === 0) { flatRatio = 1; }

    // in reset formation, the varianceLength = (sqrt(1/2) - 1/2) * magicNumber * canvasWidth
    // magicNumber is experimentally found to be 1.3938
    // AKA varianceLength = 0.28866 * canvasWidth
    const normalizedVarianceLength = varianceLength / (0.28866 * canvas.width);
    const normalizedAverageVel = averageVel / (canvas.width);
    const normalizedEntropy = entropy / (canvas.width * 1.383870349);

    audioGroup.sourceLfo.frequency.value = flatRatio;
    if (normalizedEntropy !== 0) {
        // audioGroup.setFrequency(222 / normalizedEntropy);
        audioGroup.setFrequency(500 * normalizedAverageVel * normalizedAverageVel);
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

    geometry.verticesNeedUpdate = true;
    composer.render();
    globalFrame++;
    instructionsEl.setGlobalFrame(globalFrame);
}

// 3 orders of fft for triangle wave
function triangleWaveApprox(t: number) {
    return 8 / (Math.PI * Math.PI) * (Math.sin(t) - (1 / 9) * Math.sin(3 * t) + (1 / 25) * Math.sin(5 * t));
}

function touchstart(event: JQuery.Event) {
    // prevent emulated mouse events from occuring
    event.preventDefault();
    const canvasOffset = $(canvas).offset()!;
    const touch = (event.originalEvent as TouchEvent).touches[0];
    const touchX = touch.pageX - canvasOffset.left;
    let touchY = touch.pageY - canvasOffset.top;
    // offset the touchY by its radius so the attractor is above the thumb
    touchY -= 100;

    mouseX = touchX;
    mouseY = touchY;
    enableFirstAttractor(touchX, touchY);
}

function touchmove(event: JQuery.Event) {
    const canvasOffset = $(canvas).offset()!;
    const touch = (event.originalEvent as TouchEvent).touches[0];
    const touchX = touch.pageX - canvasOffset.left;
    let touchY = touch.pageY - canvasOffset.top;
    touchY -= 100;

    mouseX = touchX;
    mouseY = touchY;
    moveFirstAttractor(touchX, touchY);
}

function touchend(event: JQuery.Event) {
    disableFirstAttractor();
}

function mousedown(event: JQuery.Event) {
    if (event.which === 1) {
        mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
        mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
        enableFirstAttractor(mouseX, mouseY);
    }
}

function mousemove(event: JQuery.Event) {
    mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
    mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
    moveFirstAttractor(mouseX, mouseY);
}

function mouseup(event: JQuery.Event) {
    if (event.which === 1) {
        disableFirstAttractor();
    }
}

let speedScalar = 1;

Leap.loop((frame: Leap.Frame) => {
    if (frame.hands.length > 0) {
        instructionsEl.setLastRenderedFrame(globalFrame);
    }
    attractors.forEach((attractor) => {
        if (attractor.handMesh != null) {
            attractor.handMesh.visible = false;
        }
        attractor.mesh.visible = false;
        attractor.power = 0;
    });
    speedScalar = 1;
    frame.hands.filter((hand) => hand.valid).forEach((hand, index) => {
        const position = hand.indexFinger.bones[3].center();

        const {x, y} = mapLeapToThreePosition(position);
        mouseX = x;
        mouseY = y;

        const attractor = attractors[index];
        attractor.x = x;
        attractor.y = y;
        attractor.mesh.position.x = x;
        attractor.mesh.position.y = y;

        attractor.mesh.visible = true;
        if (hand.indexFinger.extended) {
            // position[2] goes from -300 to 300
            const wantedPower = Math.pow(7, (-position[2] + 350) / 200);
            // very close to the TV
            // if (position[2] < -100) {
            //    speedScalar *= 1 + Math.pow(Math.abs(position[2]) / 100, 2);
            // }
            attractor.power = attractor.power * 0.5 + wantedPower * 0.5;
        } else {
            attractor.power = attractor.power * 0.5;
        }

        updateHandMesh(attractor, hand);
        attractor.handMesh!.visible = true;
    });
});

const boneGeometry = new THREE.SphereGeometry(10, 3, 3);
const boneMaterial = new THREE.LineBasicMaterial({
    // color: 0xefeffb,
    color: 0xadd6b6,
    linewidth: 5,
    transparent: true,
    opacity: 1,
});
function updateHandMesh(attractor: Attractor, hand: Leap.Hand) {
    if (attractor.handMesh == null) {
        attractor.handMesh = new THREE.Object3D() as HandMesh;
        scene.add(attractor.handMesh);
    }
    const handMesh = attractor.handMesh;
    hand.fingers.forEach((finger) => {
        if (handMesh["finger" + finger.type] == null) {
            const fingerLine = new THREE.Line(new THREE.Geometry(), boneMaterial);
            handMesh["finger" + finger.type] = fingerLine;
            handMesh.add(fingerLine);
        }
        const fingerGeometry = handMesh["finger" + finger.type].geometry as THREE.Geometry;
        finger.bones.forEach((bone) => {
            // create sphere for every bone
            const id = finger.type + ',' + bone.type;
            if (handMesh[id] == null) {
                const boneMesh = new THREE.Mesh(boneGeometry, boneMaterial);
                handMesh[id] = boneMesh;
                handMesh.add(boneMesh);
            }
            const position = mapLeapToThreePosition(bone.center());
            handMesh[id].position.copy(position);

            // create a line for every finger
            if (fingerGeometry.vertices[bone.type] == null) {
                fingerGeometry.vertices.push(new THREE.Vector3());
            }
            fingerGeometry.vertices[bone.type].copy(position);
            fingerGeometry.verticesNeedUpdate = true;
        });
    });
}

function mapLeapToThreePosition(position: number[]) {
    const range = [0.2, 0.8];
    const x = map(position[0], -200, 200, canvas.width * range[0],  canvas.width * range[1]);
    const y = map(position[1], 350, 40,   canvas.height * range[0], canvas.height * range[1]);
    const z = 300;
    return new THREE.Vector3(x, y, z);
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

function resize(width: number, height: number) {
    camera.right = width;
    camera.bottom = height;
    camera.updateProjectionMatrix();

    gravityShaderPass.uniforms.iResolution.value = new THREE.Vector2(width, height);
}

function instantiatePointCloudAndGeometry() {
    if (pointCloud != null) {
        scene.remove(pointCloud);
    }
    geometry = new THREE.Geometry();
    for (let i = 0; i < NUM_PARTICLES; i++) {
        const particle = particles[i];
        const vertex = new THREE.Vector3(particle.x, particle.y, 0);
        geometry.vertices.push(vertex);
        particles[i].vertex = vertex;
    }

    const starTexture = THREE.ImageUtils.loadTexture("/assets/sketches/line/star.png");
    starTexture.minFilter = THREE.NearestFilter;
    const material = new THREE.PointsMaterial({
        size: 13,
        sizeAttenuation: false,
        map: starTexture,
        opacity: 0.25,
        transparent: true,
    });
    pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
}

let instructionsEl: Instructions;

interface InstructionsState {
    lastRenderedFrame: number;
    globalFrame: number;
}

class Instructions extends React.Component<{}, InstructionsState> {
    // tslint:disable-next-line:member-access
    state = {
        globalFrame: 0,
        lastRenderedFrame: -Infinity,
    };

    public render() {
        const numSecondsToShowInstructions = 10;
        const shouldShow = !(this.state.globalFrame - this.state.lastRenderedFrame < 60 * numSecondsToShowInstructions);
        // const emoji = "\u270b";
        // const emoji = "\u1f590";
        // const emoji = "🖐️";
        const emoji = "🤚";
        return (
            <div className={classnames("line-instructions", {visible: shouldShow} )}>
                {/* <img className="instructions-image" src="/assets/images/leap motion instructions.png" /> */}
                {/* <img className="instructions-image" src="/assets/images/leap motion instructions sideways.png" /> */}
                <img className="instructions-image" src="/assets/images/leap motion instructions overhead.png" />
                {/* <p className="hands-container">
                    <span className="move-hands-animation" style={{ transform: "scaleX(-1)"}}>{emoji}</span>
                    <span className="move-hands-animation reversed">{emoji}</span>
                </p> */}
                <p style={{fontSize: "35px", color: "white", position: "absolute", top: "80%"}}>
                    Point your fingers, palm open, at the TV.
                </p>
            </div>
        );
    }

    public setGlobalFrame(f: number) {
        this.setState({ globalFrame: f });
    }

    public setLastRenderedFrame(lastRenderedFrame: number) {
        this.setState({ lastRenderedFrame });
    }
}

export const Line: ISketch = {
    id: "line",
    init,
    instructions: "Click, drag, look, listen.",
    animate,
    darkTheme: true,
    elements: [<Instructions ref={(instructions) => instructionsEl = instructions!} />],
    mousedown,
    mousemove,
    mouseup,
    resize,
    touchstart,
    touchmove,
    touchend,
};