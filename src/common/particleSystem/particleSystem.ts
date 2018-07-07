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

        const freqBandMin = 35;

        let energy = 0;
        if (frequencyArray) {
            for (let i = 20; i < freqBandMin; i++) {
                energy += frequencyArray[i];
            }
            energy /= (freqBandMin - 20);
            energy /= 255;
        }

        const hasAttractors = nonzeroAttractors.length > 0;
        const dragConstant = hasAttractors ? BAKED_PULLING_DRAG_CONSTANT : BAKED_INERTIAL_DRAG_CONSTANT;
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

                // const maxLength = 100 + energy * 127;
                const maxLength = 80;
                const targetActivation = 0.02 + 0.98 * (1 - THREE.Math.smoothstep(length, 20, maxLength));
                maxActivation = Math.max(maxActivation, targetActivation);
            }
            particle.activation = particle.activation * 0.99 + 0.01 * maxActivation;

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

            const timeStep = timeStepBase * (0.5 + particle.activation * 4);
            particle.dx = (particle.dx + forceX * timeStep) * dragConstant;
            particle.dy = (particle.dy + forceY * timeStep) * dragConstant;

            particle.x += particle.dx * timeStep;
            particle.y += particle.dy * timeStep;

            // drop the first 50 fft readings since they're very noisy
            const freqValue = (frequencyArray && frequencyArray[
                THREE.Math.clamp(
                    Math.floor(THREE.Math.mapLinear(Math.abs(particle.y - canvas.height / 2), 0, canvas.height / 2, freqBandMin, frequencyArray.length)),
                    freqBandMin,
                    frequencyArray.length,
                )
            ]) || 1;

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
            particle.vertex!.x = particle.x + ox * (maxActivation + energy * 5);
            particle.vertex!.y = particle.y + oy * (maxActivation + energy * 5);
            // particle.vertex!.z = particle.activation;
        }
    }
}
