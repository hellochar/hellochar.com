import * as THREE from "three";

import Bloom from "./index";

export abstract class CameraController {
    public targetPosLerp = 0.04;
    public lerpAmount = 0;

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
        this.lerpAmount = this.lerpAmount * 0.97 + this.targetPosLerp * 0.03;
    }

    public lerpOrbitControlsTarget(wantedTarget: THREE.Vector3) {
        const currentTarget = this.orbitControls.target;
        currentTarget.lerp(wantedTarget, this.lerpAmount);
        this.orbitControls.target.copy(currentTarget);
    }

    public lerpCameraPosition(wantedPosition: THREE.Vector3) {
        this.camera.position.lerp(wantedPosition, this.lerpAmount);
    }
}

export class CameraFocusOnBoxController extends CameraController {

    constructor(bloom: Bloom, public componentBoundingBox: THREE.Box3) {
        super(bloom);
    }

    updateCamera() {
        super.updateCamera();
        const minXZDist = Math.min(this.componentBoundingBox.max.z - this.componentBoundingBox.min.z, this.componentBoundingBox.max.x - this.componentBoundingBox.min.x);

        const targetDist = THREE.Math.mapLinear(Math.sin(this.bloom.timeElapsed / 10000), -1, 1, 0, minXZDist * 2);
        const targetY = this.componentBoundingBox.max.y - 0.3;

        const xz = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        xz.setLength(targetDist);

        this.lerpOrbitControlsTarget(new THREE.Vector3(0, targetY, 0));
        this.lerpCameraPosition(new THREE.Vector3(xz.x, targetY + 0.7, xz.y));
    }
}

export class CameraFocusOnObjectController extends CameraController {
    constructor(bloom: Bloom,
                public focus: THREE.Object3D,
                public targetDist = THREE.Math.randFloat(0.5, 0.8),
                public cameraOffsetY = 0.4 + targetDist * THREE.Math.randFloat(0.5, 1.1),
    ) {
        super(bloom);
    }

    updateCamera() {
        super.updateCamera();
        const { lerpAmount, camera, orbitControls, focus, targetDist } = this;

        const wantedTarget = new THREE.Vector3();
        wantedTarget.setFromMatrixPosition(focus.matrixWorld);
        this.lerpOrbitControlsTarget(wantedTarget);

        const cameraOffsetY = this.cameraOffsetY * (THREE.Math.mapLinear(Math.sin(this.bloom.timeElapsed / 8000), -1, 1, 0.8, 1.2));

        const xzOffset = new THREE.Vector2(camera.position.x - wantedTarget.x, camera.position.z - wantedTarget.z);
        xzOffset.setLength(targetDist);
        const wantedPosition = new THREE.Vector3(
            wantedTarget.x + xzOffset.x,
            wantedTarget.y + cameraOffsetY,
            wantedTarget.z + xzOffset.y,
        );

        this.lerpCameraPosition(wantedPosition);

        // may be set by dyingobject
        if (!focus.visible) {
            this.bloom.changeCameraController();
        }
    }
}
