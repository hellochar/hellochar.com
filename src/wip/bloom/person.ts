import * as THREE from "three";

import { OpenPoseKeypoints, OpenPosePerson } from "./openPoseManager";

/**
 * Add this to the camera.
 */
export class PersonMesh extends THREE.Object3D {
    static material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
    private geom: THREE.Geometry;
    private lineSegments: THREE.LineSegments;

    private vertexArray: THREE.Vector3[];

    constructor(public index: number) {
        super();
        this.vertexArray = [];
        for (let i = 0; i < 15; i++) {
            const vertex = new THREE.Vector3();
            this.vertexArray.push(vertex);
            // this.geom.vertices.push(vertex);
        }
        const [
            Head,
            Neck,
            RShoulder,
            RElbow,
            RWrist,
            LShoulder,
            LElbow,
            LWrist,
            RHip,
            RKnee,
            RAnkle,
            LHip,
            LKnee,
            LAnkle,
            Chest,
        ] = this.vertexArray;

        this.geom = new THREE.Geometry();

        const line = (p1: THREE.Vector3, p2: THREE.Vector3) => {
            this.geom.vertices.push(p1);
            this.geom.vertices.push(p2);
        }

        line(Head, Neck);

        line(Neck, RShoulder);
        // line(RShoulder, RElbow);
        // line(RElbow, RWrist);

        line(Neck, LShoulder);
        // line(LShoulder, LElbow);
        // line(LElbow, LWrist);

        line(LShoulder, RShoulder);

        line(Neck, Chest);

        line(RShoulder, Chest);
        line(LShoulder, Chest);

        // line(Chest, RHip);
        // line(RHip, RKnee);
        // line(RKnee, RAnkle);

        // line(Chest, LHip);
        // line(LHip, LKnee);
        // line(LKnee, LAnkle);

        this.lineSegments = new THREE.LineSegments(this.geom, PersonMesh.material);
        this.add(this.lineSegments);
    }

    public getWorldHeadPosition(target: THREE.Vector3) {
        const localHeadPosition = this.vertexArray[0];
        target.copy(localHeadPosition);
        // target.z = 0;
        this.lineSegments.localToWorld(target);
        return target;
    }

    updateFromOpenPoseFrame(people: OpenPosePerson[]) {
        const maybePerson = people[this.index];
        if (maybePerson == null) {
            this.visible = false;
        } else {
            this.visible = true;
            this.updateVertices(maybePerson.pose_keypoints_2d);
        }
    }

    updateVertices(poseKeypoints2D: number[]) {
        const keypointsWidth = 640;
        const keypointsHeight = 480;
        for (let i = 0; i < 15; i++) {
            const vertex = this.vertexArray[i];
            const indexX = i * 3;
            const indexY = i * 3 + 1;

            const pixelX = poseKeypoints2D[indexX];
            const pixelY = poseKeypoints2D[indexY];

            const aspectRatio = keypointsWidth / keypointsHeight; // width / height of keypoint space, which ranges [320x240];

            // [1, 1] across the screen width, from left to right
            const worldX = (pixelX / keypointsWidth - 0.5) * 2 * 0.333;
            // [-1/aspectRatio, 1/aspectRatio] across the screen height, from bottom to top
            const worldY = -1 * (pixelY / keypointsHeight - 0.5) * 2 / aspectRatio * 0.333;

            vertex.x = worldX;
            vertex.y = worldY;
            // how far away from the camera this is
        }
        this.geom.verticesNeedUpdate = true;
    }
}
