import * as THREE from "three";
import { mouse } from "./mouse";

const quaternion = new THREE.Quaternion();

/**
 * Simulate gravity being applied to this vein bone. Assumes the bone's "outward" angle is (1, 0, 0).
 * We do this by:
 * 1) converting the +x into a world facing vector
 * 2) applying gravity to it
 * 3) converting that back into a local quaternion vector, which is now in a slightly different position
 * 4) finding the rotation to go from <1, 0, 0> to that new local vector, and applying it to the bone
 *    quaternion.
 *
 * Also simulate the bone bouncing back because of the spring stiffness. A stiffness of 0.01 is already very good.
 *
 */
export function simulateVeinBoneGravity(bone: THREE.Bone, stiffness = 0.003) {
    // 1)
    bone.getWorldQuaternion(quaternion);
    const worldFacing = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);

    // 2)
    worldFacing.y -= 0.002;
    worldFacing.normalize();

    // 3)
    quaternion.inverse();
    const localFacing = worldFacing.applyQuaternion(quaternion);

    // 4)
    // reuse quaternion variable to compute that rotation
    quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), localFacing);
    bone.quaternion.multiply(quaternion);

    // compute how angled i am compared to my parent
    const eulers = new THREE.Euler().setFromQuaternion(bone.quaternion);
    // rotate a bit back straight, according to stiffness
    eulers.x *= -stiffness;
    // y is naturally stiffer; the leaf more easily resists side to side "wiggling"
    eulers.y *= -stiffness * 2;
    eulers.z *= -stiffness;
    quaternion.setFromEuler(eulers);

    bone.quaternion.multiply(quaternion);
}
