import * as THREE from "three";

import Bloom from "../index";
import { CameraController } from "./cameraController";

export class CameraFocusOnBoxController extends CameraController {

    constructor(bloom: Bloom, public componentBoundingBox: THREE.Box3, public forceFocusOut: boolean, public targetYScalar = THREE.Math.randFloat(0.7, 1), public targetYOffset = 0.7) {
        super(bloom);
    }

    updateCamera() {
        super.updateCamera();
        const minXZDist = Math.min(this.componentBoundingBox.max.z - this.componentBoundingBox.min.z, this.componentBoundingBox.max.x - this.componentBoundingBox.min.x);

        const targetDist = this.forceFocusOut ? minXZDist * 1.0 : THREE.Math.mapLinear(Math.sin(this.bloom.timeElapsed / 10000), -1, 1, 0.2, minXZDist * 2);
        const targetY = this.componentBoundingBox.max.y * this.targetYScalar - 0.3;

        const xz = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        xz.setLength(targetDist);

        this.lerpOrbitControlsTarget(new THREE.Vector3(0, targetY, 0));
        this.lerpCameraPosition(new THREE.Vector3(xz.x, targetY + this.targetYOffset, xz.y));
    }
}
