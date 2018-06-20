import { Attractor } from "./attractor";

export interface IParticle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    vertex: THREE.Vertex | null;
}

export interface ParticleSystemParameters {
    NUM_PARTICLES: number;
    GRAVITY_CONSTANT: number; // = 280;
    timeStep: number;
    // speed becomes this percentage of its original speed every second
    PULLING_DRAG_CONSTANT: number;
    INERTIAL_DRAG_CONSTANT: number;
}

export class ParticleSystem {
    private BAKED_PULLING_DRAG_CONSTANT: number;
    private BAKED_INERTIAL_DRAG_CONSTANT: number;

    constructor(
        public canvas: HTMLCanvasElement,
        public params: ParticleSystemParameters,
    ) {
        this.BAKED_PULLING_DRAG_CONSTANT = Math.pow(params.PULLING_DRAG_CONSTANT, params.timeStep);
        this.BAKED_INERTIAL_DRAG_CONSTANT = Math.pow(params.INERTIAL_DRAG_CONSTANT, params.timeStep);
    }

    resetToOriginalPosition(particle: IParticle, i: number) {
        const x = i / this.params.NUM_PARTICLES * this.canvas.width;
        const y = this.canvas.height / 2 + ((i % 5) - 2) * 2;
        particle.x = x;
        particle.y = y;
        particle.dx = particle.dy = 0;
    }

    stepParticles(particles: IParticle[], nonzeroAttractors: Attractor[]) {
        const dragConstant = nonzeroAttractors.length > 0 ? this.BAKED_PULLING_DRAG_CONSTANT : this.BAKED_INERTIAL_DRAG_CONSTANT;
        const sizeScaledGravityConstant = this.params.GRAVITY_CONSTANT * Math.min(Math.pow(2, this.canvas.width / 836 - 1), 1);
        for (let i = 0; i < this.params.NUM_PARTICLES; i++) {
            const particle = particles[i];

            for (let j = 0; j < nonzeroAttractors.length; j++) {
                const attractor = nonzeroAttractors[j];
                const dx = attractor.x - particle.x;
                const dy = attractor.y - particle.y;
                const length2 = Math.sqrt(dx * dx + dy * dy);
                const forceX = attractor.power * sizeScaledGravityConstant * dx / length2;
                const forceY = attractor.power * sizeScaledGravityConstant * dy / length2;

                particle.dx += forceX * this.params.timeStep;
                particle.dy += forceY * this.params.timeStep;
            }
            particle.dx *= dragConstant;
            particle.dy *= dragConstant;

            particle.x += particle.dx * this.params.timeStep;
            particle.y += particle.dy * this.params.timeStep;
            if (particle.x < 0 || particle.x > this.canvas.width || particle.y < 0 || particle.y > this.canvas.height) {
                this.resetToOriginalPosition(particle, i);
            }

            particle.vertex!.x = particle.x;
            particle.vertex!.y = particle.y;
        }
    }
}
