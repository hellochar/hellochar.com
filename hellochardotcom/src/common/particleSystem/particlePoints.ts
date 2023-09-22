import * as THREE from "three";

import lazy from "../../common/lazy";
import { IParticle } from "./particleSystem";

export function createParticlePoints(particles: IParticle[], material: THREE.PointsMaterial) {
    const geometry = new THREE.Geometry();
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const vertex = new THREE.Vector3(particle.x, particle.y, 0);
        geometry.vertices.push(vertex);
        particles[i].vertex = vertex;
    }
    const pointCloud = new THREE.Points(geometry, material);
    return pointCloud;
}
