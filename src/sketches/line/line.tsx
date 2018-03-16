import * as classnames from "classnames";
import { Controller } from "leapjs";
import * as React from "react";
import * as THREE from "three";

import { parse } from "query-string";
import devlog from "../../common/devlog";
import { GravityShader } from "../../common/gravityShader";
import { map, triangleWaveApprox } from "../../math/index";
import { ISketch, SketchAudioContext } from "../../sketch";
import { makeAttractor } from "./attractor";
import { createAudioGroup } from "./audio";
import { NUM_PARTICLES } from "./constants";
import { Instructions } from "./instructions";
import { initLeap } from "./leapMotion";
import { IParticle, resetToOriginalPosition, stepParticles } from "./particle";
import { createParticlePoints } from "./particlePoints";
import { computeStats } from "./particleStats";

export class LineSketch extends ISketch {
    public events = {
        touchstart: (event: JQuery.Event) => {
            // prevent emulated mouse events from occuring
            event.preventDefault();
            const canvasOffset = $(this.canvas).offset()!;
            const touch = (event.originalEvent as TouchEvent).touches[0];
            const touchX = touch.pageX - canvasOffset.left;
            let touchY = touch.pageY - canvasOffset.top;
            // offset the touchY by its radius so the attractor is above the thumb
            touchY -= 100;

            this.mouseX = touchX;
            this.mouseY = touchY;
            this.enableFirstAttractor(touchX, touchY);
        },

        touchmove: (event: JQuery.Event) => {
            const canvasOffset = $(this.canvas).offset()!;
            const touch = (event.originalEvent as TouchEvent).touches[0];
            const touchX = touch.pageX - canvasOffset.left;
            let touchY = touch.pageY - canvasOffset.top;
            touchY -= 100;

            this.mouseX = touchX;
            this.mouseY = touchY;
            this.moveFirstAttractor(touchX, touchY);
        },

        touchend: (event: JQuery.Event) => {
            this.disableFirstAttractor();
        },

        mousedown: (event: JQuery.Event) => {
            if (event.which === 1) {
                this.mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
                this.mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
                this.enableFirstAttractor(this.mouseX, this.mouseY);
            }
        },

        mousemove: (event: JQuery.Event) => {
            this.mouseX = event.offsetX == null ? (event.originalEvent as MouseEvent).layerX : event.offsetX;
            this.mouseY = event.offsetY == null ? (event.originalEvent as MouseEvent).layerY : event.offsetY;
            this.moveFirstAttractor(this.mouseX, this.mouseY);
        },

        mouseup: (event: JQuery.Event) => {
            if (event.which === 1) {
                this.disableFirstAttractor();
            }
        },
    };
    public elements = [<Instructions ref={(instructions) => this.instructionsEl = instructions} />];
    public instructionsEl: Instructions | null = null;
    public attractors = [
        makeAttractor(),
        makeAttractor(),
        makeAttractor(),
        makeAttractor(),
        makeAttractor(),
    ];

    // TODO move into core sketch
    public globalFrame = 0;

    public audioGroup: any;
    public particles: IParticle[] = [];
    public returnToStartPower = 0.0;

    // TODO move into core isketch
    public mouseX = 0;
    public mouseY = 0;

    public camera = new THREE.OrthographicCamera(0, 0, 0, 0, 1, 1000);
    public gravityShaderPass = new THREE.ShaderPass(GravityShader);
    public scene = new THREE.Scene();

    public points: THREE.Points;
    public controller: Controller;
    public composer: THREE.EffectComposer;

    public init() {
        this.audioGroup = createAudioGroup(this.audioContext);
        this.resize(this.canvas.width, this.canvas.height);
        this.camera.position.z = 500;

        this.attractors.forEach((attractor) => {
            this.scene.add(attractor.mesh);
        });

        for (let i = 0; i < NUM_PARTICLES; i++) {
            this.particles[i] = {
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                vertex: null,
            };
            resetToOriginalPosition(this.canvas, this.particles[i], i);
        }
        this.points = createParticlePoints(this.particles);
        this.scene.add(this.points);

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        this.gravityShaderPass.uniforms.iResolution.value = new THREE.Vector2(this.canvas.width, this.canvas.height);
        const gamma = parse(location.search).gamma;
        if (gamma) {
            this.gravityShaderPass.uniforms.gamma.value = gamma;
        }
        this.gravityShaderPass.renderToScreen = true;
        this.composer.addPass(this.gravityShaderPass);

        this.controller = initLeap(this);
        devlog(this.controller);
    }

    public animate(millisElapsed: number) {
        this.attractors.forEach((attractor) => {
            attractor.mesh.position.z = -100;
            attractor.mesh.children.forEach((child, idx) => {
                child.rotation.y += (10 - idx) / 20 * attractor.power;
            });
            attractor.mesh.rotation.x = 0.8; // attractor.power + 0.1;
            const scale = Math.sqrt(attractor.power) / 5;
            attractor.mesh.scale.set(scale, scale, scale);
            if (attractor.power > 0 && attractor.power < 1400) {
                // attractor.power += (100 - attractor.power) * 0.001;
                attractor.power *= 1.005;
            }
        });

        this.gravityShaderPass.uniforms.iMouse.value.set(this.attractors[0].x, this.renderer.domElement.height - this.attractors[0].y);

        if (this.returnToStartPower > 0 && this.returnToStartPower < 1) {
            this.returnToStartPower *= 1.01;
        }

        const nonzeroAttractors = this.attractors.filter((attractor) => attractor.power !== 0);

        stepParticles(this.canvas, this.particles, nonzeroAttractors);
        const { averageX, averageY, averageVel, varianceLength, normalizedAverageVel, normalizedVarianceLength, flatRatio, normalizedEntropy } =
            computeStats(this.canvas, this.particles);

        this.audioGroup.sourceLfo.frequency.setTargetAtTime(flatRatio, 0, 0.016);
        if (normalizedEntropy !== 0) {
            this.
                // audioGroup.setFrequency(222 / normalizedEntropy);
                audioGroup.setFrequency(220 + 600 * normalizedAverageVel);
        }

        // const noiseFreq = 2000 * (Math.pow(8, normalizedVarianceLength) / 8);
        const noiseFreq = 2000 * normalizedVarianceLength;
        this.audioGroup.setNoiseFrequency(noiseFreq);

        const groupedUpness = Math.sqrt(averageVel / varianceLength);
        this.audioGroup.setVolume(Math.max(groupedUpness - 0.05, 0) * 5.);

        const mouseDistanceToCenter = Math.sqrt(Math.pow(this.mouseX - averageX, 2) + Math.pow(this.mouseY - averageY, 2));
        const normalizedMouseDistanceToCenter = mouseDistanceToCenter / Math.sqrt(this.canvas.width * this.canvas.height);
        // const backgroundVolume = 0.33 / (1 + normalizedMouseDistanceToCenter * normalizedMouseDistanceToCenter);
        const backgroundVolume = 1.00;
        this.audioGroup.setBackgroundVolume(backgroundVolume);

        this.gravityShaderPass.uniforms.iGlobalTime.value = this.audioContext.currentTime / 1;
        this.gravityShaderPass.uniforms.G.value = triangleWaveApprox(this.audioContext.currentTime / 5) * (groupedUpness + 0.50) * 15000;
        this.gravityShaderPass.uniforms.iMouseFactor.value = (1 / 15) / (groupedUpness + 1);
        // filter.uniforms['iMouse'].value = new THREE.Vector2(averageX, canvas.height - averageY);

        (this.points.geometry as THREE.Geometry).verticesNeedUpdate = true;
        this.composer.render();
        this.globalFrame++;
        if (this.instructionsEl != null) {
            this.instructionsEl.setGlobalFrame(this.globalFrame);
            const isLeapMotionControllerValid = this.controller.lastFrame.valid;
            this.instructionsEl.setLeapMotionControllerValid(isLeapMotionControllerValid);
        }
    }

    public resize(width: number, height: number) {
        this.camera.right = width;
        this.camera.bottom = height;
        this.camera.updateProjectionMatrix();

        this.gravityShaderPass.uniforms.iResolution.value = new THREE.Vector2(width, height);
    }

    // 3 orders of fft for triangle wave
    // TODO move into math
    public setMousePosition(mx: number, my: number) {
        this.mouseX = mx;
        this.mouseY = my;
    }

    public enableFirstAttractor(x: number, y: number) {
        const attractor = this.attractors[0];
        attractor.x = x;
        attractor.y = y;
        attractor.power = 1;
        this.gravityShaderPass.uniforms.iMouse.value.set(x, this.renderer.domElement.height - y);
        this.returnToStartPower = 0;
    }

    public moveFirstAttractor(x: number, y: number) {
        const attractor = this.attractors[0];
        attractor.x = x;
        attractor.y = y;
        attractor.mesh.position.set(x, y, 0);
    }

    public disableFirstAttractor() {
        const attractor = this.attractors[0];
        attractor.power = 0;
    }
}
