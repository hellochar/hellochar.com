import * as $ from "jquery";
import { parse } from "query-string";
import * as THREE from "three";

import { ExplodeShader } from "../../common/explodeShader";
import lazy from "../../common/lazy";
import { computeStats, createParticle, createParticlePoints, IParticle, makeAttractor, ParticleSystem, ParticleSystemParameters } from "../../common/particleSystem";
import { ISketch } from "../../sketch";
import { createAudioGroup } from "./audio";

const params: ParticleSystemParameters = {
    timeStep: 0.016 * 3,
    GRAVITY_CONSTANT: 100,
    PULLING_DRAG_CONSTANT: 0.96075095702,
    INERTIAL_DRAG_CONSTANT: 0.23913643334,
    STATIONARY_CONSTANT: 0.01,
    constrainToBox: false,
};

const attractor = makeAttractor();
let mouseX: number, mouseY: number;

function touchstart(event: JQuery.Event) {
    // prevent emulated mouse events from occuring
    event.preventDefault();
    const touch = (event.originalEvent as TouchEvent).touches[0];
    const touchX = touch.pageX;
    const touchY = touch.pageY;
    // offset the touchY by its radius so the attractor is above the thumb
    // touchY -= 100;
    createAttractor(touchX, touchY);
    mouseX = touchX;
    mouseY = touchY;
}

function touchmove(event: JQuery.Event) {
    const touch = (event.originalEvent as TouchEvent).touches[0];
    const touchX = touch.pageX;
    const touchY = touch.pageY;
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
    attractor.x = x;
    attractor.y = y;
    attractor.power = 1;
}

function moveAttractor(x: number, y: number) {
    if (attractor != null) {
        attractor.x = x;
        attractor.y = y;
    }
}

function removeAttractor() {
    attractor.power = 0;
}

function resize(width: number, height: number) {
}

class Dots extends ISketch {
    public events = {
        mousedown,
        mousemove,
        mouseup,
        touchstart,
        touchmove,
        touchend,
    };

    public shader = new THREE.ShaderPass(ExplodeShader);
    public audioGroup: any;
    public camera!: THREE.OrthographicCamera;
    public composer!: THREE.EffectComposer;
    public pointCloud!: THREE.Points;
    public scene = new THREE.Scene();
    public ps!: ParticleSystem;

    public init() {
        this.audioGroup = createAudioGroup(this.audioContext);

        this.camera = new THREE.OrthographicCamera(0, this.canvas.width, 0, this.canvas.height, 1, 1000);
        this.camera.position.z = 500;

        const particles: IParticle[] = [];
        const EXTENT = 10;
        const GRID_SIZE = parse(location.search).gridSize || 7;
        for (let x = -EXTENT * GRID_SIZE; x < this.canvas.width + EXTENT * GRID_SIZE; x += GRID_SIZE) {
            for (let y = -EXTENT * GRID_SIZE; y < this.canvas.height + EXTENT * GRID_SIZE; y += GRID_SIZE) {
                particles.push(createParticle(x, y));
            }
        }
        this.ps = new ParticleSystem(this.canvas, particles, params);

        this.pointCloud = createParticlePoints(particles, material());
        this.scene.add(this.pointCloud);

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        this.shader.uniforms.iResolution.value = this.resolution;
        this.shader.renderToScreen = true;
        this.composer.addPass(this.shader);
    }

    public animate(millisElapsed: number) {
        const nonzeroAttractors = attractor.power > 0 ? [attractor] : [];
        this.ps.stepParticles(nonzeroAttractors);

        const { flatRatio, normalizedVarianceLength, groupedUpness, averageVel } = computeStats(this.ps);
        this.audioGroup.lfo.frequency.setTargetAtTime(flatRatio, this.audioContext.currentTime, 0.016);
        this.audioGroup.setFrequency(120 / normalizedVarianceLength * averageVel / 100 );
        this.audioGroup.setVolume(Math.max(groupedUpness - 0.05, 0));

        this.shader.uniforms.iMouse.value = new THREE.Vector2(mouseX / this.canvas.width, (this.canvas.height - mouseY) / this.canvas.height);

        (this.pointCloud.geometry as THREE.Geometry).verticesNeedUpdate = true;
        this.composer.render();
    }

    public resize(width: number, height: number) {
        const { camera, shader } = this;
        camera.right = width;
        camera.bottom = height;
        shader.uniforms.iResolution.value = new THREE.Vector2(width, height);

        camera.updateProjectionMatrix();
    }
}

const material = lazy(() => {
    const starTexture = new THREE.TextureLoader().load("/assets/sketches/line/star.png");
    starTexture.minFilter = THREE.NearestFilter;
    return new THREE.PointsMaterial({
        size: 15,
        sizeAttenuation: false,
        map: starTexture,
        opacity: 0.18,
        transparent: true,
    });
});

export default Dots;
