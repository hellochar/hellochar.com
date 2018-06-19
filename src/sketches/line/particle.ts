import { Attractor } from "./attractor";
import { NUM_PARTICLES } from "./constants";

const GRAVITY_CONSTANT = 280;
const SIMULATION_SPEED = 2;
const timeStepBase = 1 / 60 * SIMULATION_SPEED;
// speed becomes this percentage of its original speed every second
const PULLING_DRAG_CONSTANT = 0.93075095702;
const INERTIAL_DRAG_CONSTANT = 0.23913643334;

// bake it
const BAKED_PULLING_DRAG_CONSTANT = Math.pow(PULLING_DRAG_CONSTANT, timeStepBase);
const BAKED_INERTIAL_DRAG_CONSTANT = Math.pow(INERTIAL_DRAG_CONSTANT, timeStepBase);

export interface IParticle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    vertex: THREE.Vertex | null;
    lastStep: number;
}

export function resetToOriginalPosition(canvas: HTMLCanvasElement, particle: IParticle, i: number) {
    const x = i / NUM_PARTICLES * canvas.width;
    const y = canvas.height / 2 + ((i % 5) - 2) * 2;
    particle.x = x;
    particle.y = y;
    particle.dx = particle.dy = 0;
}

export function* stepParticlesForever(canvas: HTMLCanvasElement, particles: IParticle[], attractors: Attractor[]) {
    while (true) {
        let dragConstant = 1;
        let sizeScaledGravityConstant = 1;
        let now;
        let nonzeroAttractors: Attractor[] = [];
        for (let i = 0; i < NUM_PARTICLES; i++) {
            // do it in batches of 1000
            // brittle - we rely on setting now before iterating any of the particles
            if (i % 1000 === 0) {
                now = yield undefined;
                nonzeroAttractors = attractors.filter((a) => a.power !== 0);
                // dragConstant = nonzeroAttractors.length > 0 ? BAKED_PULLING_DRAG_CONSTANT : BAKED_INERTIAL_DRAG_CONSTANT;
                dragConstant = nonzeroAttractors.length > 0 ? PULLING_DRAG_CONSTANT : INERTIAL_DRAG_CONSTANT;
                sizeScaledGravityConstant = GRAVITY_CONSTANT * Math.min(Math.pow(2, canvas.width / 836 - 1), 1);
            }
            const particle = particles[i];

            const dt = now - particle.lastStep;

            const timeStep = dt / 1000 * SIMULATION_SPEED;

            for (let j = 0; j < nonzeroAttractors.length; j++) {
                const attractor = nonzeroAttractors[j];
                const dx = attractor.x - particle.x;
                const dy = attractor.y - particle.y;
                const length2 = Math.sqrt(dx * dx + dy * dy);
                const forceX = attractor.power * sizeScaledGravityConstant * dx / length2;
                const forceY = attractor.power * sizeScaledGravityConstant * dy / length2;

                particle.dx += forceX * timeStep;
                particle.dy += forceY * timeStep;
            }
            const p = Math.pow(dragConstant, timeStep);
            particle.dx *= p;
            particle.dy *= p;

            particle.x += particle.dx * timeStep;
            particle.y += particle.dy * timeStep;
            if (particle.x < 0 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
                resetToOriginalPosition(canvas, particle, i);
            }
            particle.lastStep = now;

            particle.vertex!.x = particle.x;
            particle.vertex!.y = particle.y;
        }
    }
}
