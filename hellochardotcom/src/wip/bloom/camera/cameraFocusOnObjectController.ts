import * as THREE from "three";

import Bloom from "../index";
import { CameraController } from "./cameraController";

export class CameraFocusOnObjectController extends CameraController {
    constructor(bloom: Bloom,
                public focus: THREE.Object3D,
                public targetDist = THREE.Math.randFloat(0.3, 0.6),
                public cameraOffsetY = 0.3 + targetDist * THREE.Math.randFloat(0.5, 1.1),
                public localFocus?: boolean,
    ) {
        super(bloom);
    }

    updateCamera() {
        super.updateCamera();
        const { lerpAmount, camera, orbitControls, focus, targetDist } = this;

        // may be set by dyingobject
        if (!focus.visible) {
            this.bloom.cameraController = this.bloom.newCameraController();
            return;
        }

        const wantedTarget = new THREE.Vector3();
        wantedTarget.setFromMatrixPosition(focus.matrixWorld);
        this.lerpOrbitControlsTarget(wantedTarget);

        if (this.localFocus != null) {
            const forwards = new THREE.Vector3(Math.sin(this.bloom.timeElapsed / 10000), 3, 0);
            focus.localToWorld(forwards);
            this.lerpCameraPosition(forwards);
        } else {
        const cameraOffsetY = this.cameraOffsetY * (THREE.Math.mapLinear(Math.sin(this.bloom.timeElapsed / 8000), -1, 1, 0.8, 1.2));

        const xzOffset = new THREE.Vector2(camera.position.x - wantedTarget.x, camera.position.z - wantedTarget.z);
        xzOffset.setLength(targetDist);
        const wantedPosition = new THREE.Vector3(
            wantedTarget.x + xzOffset.x,
            wantedTarget.y + cameraOffsetY,
            wantedTarget.z + xzOffset.y,
        );

        this.lerpCameraPosition(wantedPosition);
        }
    }
}
