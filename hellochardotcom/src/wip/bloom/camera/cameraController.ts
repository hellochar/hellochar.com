import * as THREE from "three";

import Bloom from "../index";

export abstract class CameraController {
    public targetPosLerp = 0.03;
    public lerpAmount = 0;

    public lifeTime = 20000;

    get camera() {
        return this.bloom.camera;
    }

    get orbitControls() {
        return this.bloom.orbitControls;
    }

    get timeAlive() {
        return this.bloom.timeElapsed - this.timeBorn;
    }

    private timeBorn = 0;

    constructor(public bloom: Bloom) {
        this.timeBorn = this.bloom.timeElapsed;
    }

    updateCamera() {
        this.lerpAmount = this.lerpAmount * 0.98 + this.targetPosLerp * 0.02;
    }

    public lerpOrbitControlsTarget(wantedTarget: THREE.Vector3) {
        const currentTarget = this.orbitControls.target;
        currentTarget.lerp(wantedTarget, this.lerpAmount);
        this.orbitControls.target.copy(currentTarget);
    }

    public lerpCameraPosition(wantedPosition: THREE.Vector3) {
        if (wantedPosition.y < 0.1) {
            wantedPosition.y = 0.1;
        }
        this.camera.position.lerp(wantedPosition, this.lerpAmount);
    }
}
