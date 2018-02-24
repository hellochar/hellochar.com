import { Attractor } from "./attractor";
import { canvas, NUM_PARTICLES } from "./line";

const GRAVITY_CONSTANT = 280;
const SIMULATION_SPEED = 2;
const timeStep = .016 * SIMULATION_SPEED;
const PULLING_DRAG_CONSTANT = 0.93075095702;
const INERTIAL_DRAG_CONSTANT = 0.53913643334;

// bake it
const BAKED_PULLING_DRAG_CONSTANT = Math.pow(PULLING_DRAG_CONSTANT, timeStep);
const BAKED_INERTIAL_DRAG_CONSTANT = Math.pow(INERTIAL_DRAG_CONSTANT, timeStep);

export interface IParticle {
    x: number;
    y: number;
    dx: number;
    dy: number;
    vertex: THREE.Vertex | null;
}

export function resetToOriginalPosition(particle: IParticle, i: number) {
    const gridSize = Math.floor(Math.sqrt(NUM_PARTICLES));
    // const x = (i % gridSize) / gridSize * canvas.width;
    // const y = Math.floor(i / gridSize) / gridSize * canvas.height;
    const x = i / NUM_PARTICLES * canvas.width;
    const y = canvas.height / 2 + ((i % 5) - 2) * 2;
    particle.x = x;
    particle.y = y;
    particle.dx = particle.dy = 0;
}

export function stepParticles(particles: IParticle[], nonzeroAttractors: Attractor[]) {
    const dragConstant = nonzeroAttractors.length > 0 ? BAKED_PULLING_DRAG_CONSTANT : BAKED_INERTIAL_DRAG_CONSTANT;
    const sizeScaledGravityConstant = GRAVITY_CONSTANT * Math.min(Math.pow(2, canvas.width / 836 - 1), 1);
    for (let i = 0; i < NUM_PARTICLES; i++) {
        const particle = particles[i];

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
        particle.dx *= dragConstant;
        particle.dy *= dragConstant;

        particle.x += particle.dx * timeStep;
        particle.y += particle.dy * timeStep;
        if (particle.x < 0 || particle.x > canvas.width || particle.y < 0 || particle.y > canvas.height) {
            resetToOriginalPosition(particle, i);
        }

        const wantedX = i * canvas.width / NUM_PARTICLES;
        const wantedY = canvas.height / 2;
        // if (returnToStartPower > 0) {
        //     particle.x -= (particle.x - wantedX) * returnToStartPower;
        //     particle.y -= (particle.y - wantedY) * returnToStartPower;
        // }

        particle.vertex!.x = particle.x;
        particle.vertex!.y = particle.y;
    }
}
