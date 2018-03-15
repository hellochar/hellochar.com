import * as THREE from "three";

import lazy from "../../common/lazy";
import { IParticle } from "./particle";

const material = lazy(() => {
    const starTexture = new THREE.TextureLoader().load("/assets/sketches/line/star.png");
    starTexture.minFilter = THREE.NearestFilter;
    return new THREE.PointsMaterial({
        size: 13,
        sizeAttenuation: false,
        map: starTexture,
        opacity: 0.25,
        transparent: true,
    });
});

export function createParticlePoints(particles: IParticle[]) {
    const geometry = new THREE.Geometry();
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const vertex = new THREE.Vector3(particle.x, particle.y, 0);
        geometry.vertices.push(vertex);
        particles[i].vertex = vertex;
    }
    const pointCloud = new THREE.Points(geometry, material());
    return pointCloud;
}
