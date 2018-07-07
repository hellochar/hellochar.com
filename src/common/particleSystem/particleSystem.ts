import { parse } from "query-string";
import THREE = require("three");
import { Attractor } from "./attractor";

export interface IParticle {
    originalX: number;
    originalY: number;
    x: number;
    y: number;
    dx: number;
    dy: number;
    activation: number;
    vertex: THREE.Vertex | null;
    color: THREE.Color;
}

export function createParticle(originalX: number, originalY: number): IParticle {
    return {
        dx: 0,
        dy: 0,
        originalX,
        originalY,
        x: originalX,
        y: originalY,
        activation: 0,
        vertex: null!,
        color: new THREE.Color(0, 0, 0),
    };
}

export interface ParticleSystemParameters {
    GRAVITY_CONSTANT: number;
    timeStep: number;
    // speed becomes this percentage of its original speed every second
    PULLING_DRAG_CONSTANT: number;
    INERTIAL_DRAG_CONSTANT: number;
    STATIONARY_CONSTANT: number;
    constrainToBox: boolean;
}

const MUSIC_FACTOR = parse(location.search).musicFactor || 100;
const ACTIVATION_FACTOR = parse(location.search).activationFactor || 3.3;
const ACTIVATION_SPEED = parse(location.search).activationSpeed || 0.001;
const BLOB_AMOUNT = parse(location.search).blobAmount || 25;

export class ParticleSystem {
    private BAKED_PULLING_DRAG_CONSTANT: number;
    private BAKED_INERTIAL_DRAG_CONSTANT: number;

    constructor(
        public canvas: HTMLCanvasElement,
        public particles: IParticle[],
        public params: ParticleSystemParameters,
    ) {
        this.BAKED_PULLING_DRAG_CONSTANT = Math.pow(params.PULLING_DRAG_CONSTANT, params.timeStep);
        this.BAKED_INERTIAL_DRAG_CONSTANT = Math.pow(params.INERTIAL_DRAG_CONSTANT, params.timeStep);
    }

    resetToOriginalPosition(particle: IParticle) {
        particle.x = particle.originalX;
        particle.y = particle.originalY;
        particle.dx = particle.dy = 0;
    }

    stepParticles(nonzeroAttractors: Attractor[], analyser?: AnalyserNode, frequencyArray?: Uint8Array) {
        const t = performance.now();

        const {
            BAKED_PULLING_DRAG_CONSTANT,
            BAKED_INERTIAL_DRAG_CONSTANT,
            params,
            canvas,
            particles,
        } = this;

        const {
            timeStep: timeStepBase,
            STATIONARY_CONSTANT,
            GRAVITY_CONSTANT,
            constrainToBox,
        } = params;

        // const freqBandMin = 35;

        let energy = 0;
        if (frequencyArray) {
            // for (let i = 20; i < 100; i++) {
            //     energy += frequencyArray[i];
            // }
            // energy /= (100 - 20);
            energy = frequencyArray[5];
        }
        energy /= 255;

        // const hasAttractors = nonzeroAttractors.length > 0;
        const dragConstant = BAKED_PULLING_DRAG_CONSTANT;
        const sizeScaledGravityConstant = GRAVITY_CONSTANT * Math.min(Math.pow(2, canvas.width / 836 - 1), 1);
        for (const particle of particles) {

            let forceX = 0, forceY = 0;

            let maxActivation = 0.02;

            for (let j = 0; j < nonzeroAttractors.length; j++) {
                const attractor = nonzeroAttractors[j];
                const dx = attractor.x - particle.x;
                const dy = attractor.y - particle.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                forceX += attractor.power * sizeScaledGravityConstant * dx / length;
                forceY += attractor.power * sizeScaledGravityConstant * dy / length;

                // if (attractor.dx && attractor.dy) {
                //     forceX += attractor.dx;
                //     forceY += attractor.dy;
                // }

                // const maxLength = 100 + energy * 127;
                const maxLength = 80;
                const targetActivation = 0.02 + 0.98 * (1 - THREE.Math.smoothstep(length, 20, maxLength));
                maxActivation = Math.max(maxActivation, targetActivation);
            }
            if (maxActivation > particle.activation) {
                particle.activation = particle.activation * (1 - ACTIVATION_SPEED) + ACTIVATION_SPEED * maxActivation;
            } else {
                const decayActivationSpeed = ACTIVATION_SPEED * 2;
                particle.activation = particle.activation * (1 - decayActivationSpeed) + decayActivationSpeed * maxActivation;
            }

            if (STATIONARY_CONSTANT > 0) {
                const dx = particle.originalX - particle.x;
                const dy = particle.originalY - particle.y;
                const length2 = Math.sqrt(dx * dx + dy * dy);
                forceX += STATIONARY_CONSTANT * dx * length2;
                forceY += STATIONARY_CONSTANT * dy * length2;

                // if (!hasAttractors) {
                //     particle.originalX -= dx * 0.05;
                //     particle.originalY -= dy * 0.05;
                // }
            }

            const timeStep = timeStepBase * (0.5 + particle.activation * ACTIVATION_FACTOR);
            particle.dx = (particle.dx + forceX * timeStep) * dragConstant;
            particle.dy = (particle.dy + forceY * timeStep) * dragConstant;

            particle.x += particle.dx * timeStep;
            particle.y += particle.dy * timeStep;

            // drop the first 50 fft readings since they're very noisy
            // const freqValue = (frequencyArray && frequencyArray[
            //     THREE.Math.clamp(
            //         Math.floor(THREE.Math.mapLinear(Math.abs(particle.y - canvas.height / 2), 0, canvas.height / 2, freqBandMin, frequencyArray.length)),
            //         freqBandMin,
            //         frequencyArray.length,
            //     )
            // ]) || 1;

            // particle.originalX += 1 * energy;
            // particle.x += 1 * energy;
            // if (particle.x > canvas.width) {
            //     particle.originalX -= canvas.width;
            //     particle.x -= canvas.width;
            // }

            // particle.x = particle.originalX + particle.dx * timeStep * 1;
            // particle.y = particle.originalY + particle.dy * timeStep * 1;
            if (constrainToBox) {
                if (particle.x < 0 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
                    this.resetToOriginalPosition(particle);
                }
            }

            // const hsl = particle.color.getHSL();
            // hsl.h = (hsl.h + freqValue / 128) % 1;
            // particle.color.setHSL(hsl.h, 1, 0.5);

            const ox = (particle.x - canvas.width / 2) / 200;
            const oy = (particle.y - canvas.height / 2) / 200;
            // particle.vertex!.x = particle.x + ox * energy;
            // particle.vertex!.y = particle.y + oy * energy;
            particle.vertex!.x = particle.x + ox * (maxActivation * BLOB_AMOUNT - energy * energy * MUSIC_FACTOR);
            particle.vertex!.y = particle.y + oy * (maxActivation * BLOB_AMOUNT - energy * energy * MUSIC_FACTOR);
            const skew = frequencyArray && THREE.Math.mapLinear(frequencyArray[15], 0, 255, -1, 1) || 1;
            particle.vertex!.x += Math.sin(particle.x / 20 + particle.y / 100 * skew + t / 200 + (t / 1000 * (1 + particle.y / canvas.height * 5)) / 500) * 10;

            // particle.color.r = maxActivation * 10;
            // particle.color.g = maxActivation * 10;
            // particle.color.b = maxActivation * 10;
            // console.log(maxActivation);

            particle.color.r = (particle.activation * 3 + maxActivation * 0.5) * 5 + 0.2;
            particle.color.g = (particle.activation * 3 + maxActivation * 0.5) * 5 + 0.2;
            particle.color.b = (particle.activation * 3 + maxActivation * 0.5) * 5 + 0.2;

            // particle.color.r = (particle.activation) * 5;
            // particle.color.g = (particle.activation) * 5;
            // particle.color.b = (particle.activation) * 5;

            // particle.color.r = energy * 255;
            // particle.color.g = energy * 255;
            // particle.color.b = energy * 255;
        }
    }
}
