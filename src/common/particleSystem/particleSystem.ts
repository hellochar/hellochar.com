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

    stepParticles(nonzeroAttractors: Attractor[]) {
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

        const hasAttractors = nonzeroAttractors.length > 0;
        const dragConstant = hasAttractors ? BAKED_PULLING_DRAG_CONSTANT : BAKED_INERTIAL_DRAG_CONSTANT;
        const sizeScaledGravityConstant = GRAVITY_CONSTANT * Math.min(Math.pow(2, canvas.width / 836 - 1), 1);
        for (const particle of particles) {

            let forceX = 0, forceY = 0;

            for (let j = 0; j < nonzeroAttractors.length; j++) {
                const attractor = nonzeroAttractors[j];
                const dx = attractor.x - particle.x;
                const dy = attractor.y - particle.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                forceX += attractor.power * sizeScaledGravityConstant * dx / length;
                forceY += attractor.power * sizeScaledGravityConstant * dy / length;

                const targetActivation = 0.5 + 29.5 * (1 - THREE.Math.smoothstep(length, 20, 100));
                particle.activation = particle.activation * 0.99 + 0.01 * targetActivation;

                // particle.dx += forceX * timeStep;
                // particle.dy += forceY * timeStep;
            }

            if (STATIONARY_CONSTANT > 0) {
                const dx = particle.originalX - particle.x;
                const dy = particle.originalY - particle.y;
                const length2 = Math.sqrt(dx * dx + dy * dy);
                forceX += STATIONARY_CONSTANT * dx * length2;
                forceY += STATIONARY_CONSTANT * dy * length2;

                // particle.dx += forceX * timeStep;
                // particle.dy += forceY * timeStep;

                // if (!hasAttractors) {
                //     particle.originalX -= dx * 0.05;
                //     particle.originalY -= dy * 0.05;
                // }
            }

            const timeStep = timeStepBase * particle.activation;
            particle.dx = (particle.dx + forceX * timeStep) * dragConstant;
            particle.dy = (particle.dy + forceY * timeStep) * dragConstant;

            particle.x += particle.dx * timeStep;
            particle.y += particle.dy * timeStep;
            // particle.x = particle.originalX + particle.dx * timeStep * 1;
            // particle.y = particle.originalY + particle.dy * timeStep * 1;
            if (constrainToBox) {
                if (particle.x < 0 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
                    this.resetToOriginalPosition(particle);
                }
            }

            particle.vertex!.x = particle.x;
            particle.vertex!.y = particle.y;
            // particle.vertex!.z = particle.activation;
        }
    }
}
