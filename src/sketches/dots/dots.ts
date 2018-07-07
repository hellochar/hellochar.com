import * as $ from "jquery";
import { parse } from "query-string";
import * as THREE from "three";

import { ExplodeShader } from "../../common/explodeShader";
import lazy from "../../common/lazy";
import { Attractor, computeStats, createParticle, createParticlePoints, IParticle, makeAttractor, ParticleSystem, ParticleSystemParameters } from "../../common/particleSystem";
import { ISketch } from "../../sketch";
import { createAudioGroup } from "./audio";
import { Body, KinectManager } from "./kinectManager";

const params: ParticleSystemParameters = {
    timeStep: 0.016 * 3,
    GRAVITY_CONSTANT: 100,
    PULLING_DRAG_CONSTANT: 0.5,
    INERTIAL_DRAG_CONSTANT: 0.5,
    STATIONARY_CONSTANT: 0.02,
    constrainToBox: false,
};

let attractors: Attractor[] = [];
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
    attractors.push(makeAttractor(x, y, 1));
}

function moveAttractor(x: number, y: number) {
    if (attractors[0] != null) {
        attractors[0].x = x;
        attractors[0].y = y;
    }
}

function removeAttractor() {
    attractors.shift();
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
    public manager!: KinectManager;
    public init() {
        // this.audioGroup = createAudioGroup(this.audioContext);

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

        this.initKinectManager();
    }

    private initKinectManager() {
        this.manager = new KinectManager(this.handleKinectUpdate);
    }

    // private record: Body[][] = [];
    // private repeatIntervalId?: number;
    private handleKinectUpdate = (bodies: Body[]) => {
        // this.record.push(bodies);
        // if (this.repeatIntervalId) {
        //     clearInterval(this.repeatIntervalId);
        // }
        // this.repeatIntervalId = setInterval(() => {
        //     this.record.push(bodies);
        // }, 1000 / 30);
        attractors = [];
        for (const body of bodies) {
            for (const jointIndex in body.joints) {
                const joint = body.joints[jointIndex];
                // 0 is untracked
                if (joint.w !== 0) {
                    const prevJoint = body.previous && body.previous.joints[jointIndex];
                    let power = 0.01;
                    if (prevJoint && prevJoint.w !== 0) {
                        const dx = joint.x - prevJoint.x;
                        const dy = joint.y - prevJoint.y;
                        const speed2 = dx * dx + dy * dy;
                        power += Math.sqrt(speed2) * 10;
                        // console.log(speed2);
                    }
                    attractors.push(makeAttractor(joint.x * this.canvas.width, joint.y * this.canvas.height, power));
                }
            }
        }
        // if (bodies[0] != null) {
        //     createAttractor(bodies[0].position.x * this.canvas.width, bodies[0].position.y * this.canvas.height);
        // } else {
        //     removeAttractor();
        // }
    };

    public animate(millisElapsed: number) {
        this.ps.stepParticles(attractors);
        // if (this.frameCount % 1000 === 0) {
        //     console.log(this.record);
        // }

        // const { flatRatio, normalizedVarianceLength, groupedUpness } = computeStats(this.ps);
        // this.audioGroup.lfo.frequency.setTargetAtTime(flatRatio, this.audioContext.currentTime, 0.016);
        // this.audioGroup.setFrequency(111 / normalizedVarianceLength);
        // this.audioGroup.setVolume(Math.max(groupedUpness - 0.05, 0));

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
