import * as THREE from "three";

import { OpenPosePerson } from "./openPoseManager";

const KEYPOINTS_WIDTH = 640;
const KEYPOINTS_HEIGHT = 480;
const KEYPOINTS_ASPECT_RATIO = KEYPOINTS_WIDTH / KEYPOINTS_HEIGHT; // width / height of keypoint space, which ranges [320x240];

/**
 * Add this to the camera.
 */
export class PersonMesh extends THREE.Object3D {
    private keypoints: Keypoint[] = [];

    public keypointSpheres: KeypointSphere[] = [];

    constructor(public index: number) {
        super();

        for (let i = 0; i < 15; i++) {
            const keypoint = new Keypoint();
            this.keypoints.push(keypoint);
            const sphere = new KeypointSphere(keypoint);
            this.keypointSpheres.push(sphere);
            this.add(sphere);
        }
        // const [
        //     Head,
        //     Neck,
        //     RShoulder,
        //     RElbow,
        //     RWrist,
        //     LShoulder,
        //     LElbow,
        //     LWrist,
        //     RHip,
        //     RKnee,
        //     RAnkle,
        //     LHip,
        //     LKnee,
        //     LAnkle,
        //     Chest,
        // ] = this.keypoints;
    }

    // public getWorldPosition(target: THREE.Vector3) {
    //     const localHeadPosition = this.keypoints[0].position;
    //     target.copy(localHeadPosition);
    //     this.localToWorld(target);
    //     return target;
    // }

    updateFromOpenPosePerson(maybePerson: OpenPosePerson) {
        if (maybePerson == null) {
            // we lost the person; treat this as losing every keypoint
            this.lostPerson();
        } else {
            this.updateKeypoints(maybePerson.pose_keypoints_2d);
        }
        this.updateSpheres();
        if (this.isEverySphereInvisible()) {
            this.visible = false;
        } else {
            this.visible = true;
        }
    }

    private isEverySphereInvisible() {
        return this.keypointSpheres.every((s) => !s.visible);
    }

    private updateSpheres() {
        for (const sphere of this.keypointSpheres) {
            sphere.updateSizeAndPosition();
        }
    }

    lostPerson() {
        for (const keypoint of this.keypoints) {
            keypoint.update(0);
        }
    }

    updateKeypoints(poseKeypoints2D: number[]) {
        for (let i = 0; i < this.keypoints.length; i++) {
            const keypoint = this.keypoints[i];

            const indexX = i * 3;
            const indexY = i * 3 + 1;
            const indexConfidence = i * 3 + 2;
            const keypointX = poseKeypoints2D[indexX];
            const keypointY = poseKeypoints2D[indexY];
            const confidence = poseKeypoints2D[indexConfidence];

            keypoint.update(confidence, keypointX, keypointY);
        }
    }
}

class Keypoint {
    public offset = new THREE.Vector3();
    public position = new THREE.Vector3();
    public confidence: number = 0;
    constructor() {}
    update(confidence: number, keypointX?: number, keypointY?: number) {
        this.confidence = confidence;
        if (confidence !== 0) {
            this.offset.copy(this.position);
            // [1, 1] across the screen width, from left to right
            const worldX = (keypointX! / KEYPOINTS_WIDTH - 0.5) * 2;
            // [-1/aspectRatio, 1/aspectRatio] across the screen height, from bottom to top
            const worldY = -1 * (keypointY! / KEYPOINTS_HEIGHT - 0.5) * 2 / KEYPOINTS_ASPECT_RATIO;

            this.position.x = worldX;
            this.position.y = worldY;
            this.offset.subVectors(this.position, this.offset);
        } else {
            this.offset.setScalar(0);
        }
    }
}

class KeypointSphere extends THREE.Mesh {
    static geometry = (() => {
        return new THREE.SphereBufferGeometry(0.03, 10, 8);
    })();
    static material = (() => {
        return new THREE.MeshPhongMaterial({
            flatShading: true,
            color: "lightgray",
            shininess: 0,
            transparent: true,
            depthFunc: THREE.AlwaysDepth,
        });
    })();

    constructor(public keypoint: Keypoint) {
        super(KeypointSphere.geometry, KeypointSphere.material);
    }

    static noConfidenceScale = new THREE.Vector3().setScalar(0.01);
    static confidentScale = new THREE.Vector3().setScalar(1);

    public updateSizeAndPosition() {
        const { confidence } = this.keypoint;
        if (confidence === 0) {
            this.scale.lerp(KeypointSphere.noConfidenceScale, 0.1);
            if (this.scale.x < 0.01) {
                this.visible = false;
            }
        } else {
            this.visible = true;
            const oldPosition = this.position.clone();
            this.scale.lerp(KeypointSphere.confidentScale, 0.1);
            this.position.lerp(this.keypoint.position, 1.0); // was .5
            const rotateY = (this.position.x - oldPosition.x) * 5;
            const rotateX = (this.position.y - oldPosition.y) * 5;

            this.rotateY(rotateY);
            this.rotateX(rotateX);
        }
    }
}
