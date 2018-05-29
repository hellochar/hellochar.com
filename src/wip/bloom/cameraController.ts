import * as THREE from "three";

import Bloom from "./index";

export abstract class CameraController {

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

    abstract updateCamera(): void;
}

export class CameraFocusOnBoxController extends CameraController {

    constructor(bloom: Bloom, public componentBoundingBox: THREE.Box3) {
        super(bloom);
    }

    updateCamera() {
        const minXZDist = Math.min(this.componentBoundingBox.max.z - this.componentBoundingBox.min.z, this.componentBoundingBox.max.x - this.componentBoundingBox.min.x);

        const targetDist = Math.sqrt(minXZDist);
        const targetY = this.componentBoundingBox.max.y - 0.3;

        const xz = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        xz.setLength(targetDist);

        this.orbitControls.target.set(0, targetY, 0);
        this.camera.position.x = xz.x;
        this.camera.position.z = xz.y;
        this.camera.position.y = targetY + 0.7;
    }
}

export class CameraFocusOnObjectController extends CameraController {
    public posLerp = 0.05;
    public yOffsetScalar = THREE.Math.randFloat(0.5, 1.5);
    constructor(bloom: Bloom, public focus: THREE.Object3D) {
        super(bloom);
    }

    updateCamera() {
        const { posLerp, camera, orbitControls, focus } = this;

        const wantedTarget = new THREE.Vector3();
        focus.getWorldPosition(wantedTarget);
        // const targetDist = 0.2;
        const targetDist = THREE.Math.mapLinear(Math.sin(this.bloom.timeElapsed / 10000), -1, 1, 0.2, 0.8);
        // const cameraOffsetY = 0.15;
        const cameraOffsetY = targetDist * this.yOffsetScalar * Math.sin(this.bloom.timeElapsed / 8000);

        const currentTarget = orbitControls.target;
        currentTarget.lerp(wantedTarget, posLerp);

        orbitControls.target.copy(currentTarget);
        // wantedTarget.lerpVectors(currentTarget, wantedTarget, 0.01);

        // orbitControls.target.copy(wantedTarget);

        camera.position.y = camera.position.y * (1 - posLerp) + (wantedTarget.y + cameraOffsetY) * posLerp;

        const xzOffset = new THREE.Vector2(camera.position.x - wantedTarget.x, camera.position.z - wantedTarget.z);
        xzOffset.setLength(xzOffset.length() * (1 - posLerp) + targetDist * posLerp);
        camera.position.x = xzOffset.x + wantedTarget.x;
        camera.position.z = xzOffset.y + wantedTarget.z;
    }
}
