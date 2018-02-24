import * as THREE from "three";

import { IParticle } from "./particle";

const starTexture = THREE.ImageUtils.loadTexture("/assets/sketches/line/star.png");
starTexture.minFilter = THREE.NearestFilter;
const material = new THREE.PointsMaterial({
    size: 13,
    sizeAttenuation: false,
    map: starTexture,
    opacity: 0.25,
    transparent: true,
});

export function createParticlePoints(particles: IParticle[]) {
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
