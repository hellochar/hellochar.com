import clm from "clmtrackr";
import { parse } from "query-string";
import * as React from "react";
import * as THREE from "three";

import { AFFINES, Branch, SuperPoint, VARIATIONS } from "../common/flame";
import { createInterpolatedVariation } from "../common/flame/transforms";
import { ISketch, SketchAudioContext } from "../sketch";

const DEPTH = 1;

const CIRCLE_CLAWS: Branch[] = [
    {
        color: new THREE.Color(1, 1.5, 1).multiplyScalar(1 / DEPTH),
        affine: AFFINES.TowardsOriginNegativeBias,
        variation: VARIATIONS.Spherical,
    },
    {
        color: new THREE.Color(1.4, -0.5, -1).multiplyScalar(1 / DEPTH),
        affine: AFFINES.TowardsOrigin2,
        variation: VARIATIONS.Polar,
    },
];

export const Webcam = new (class implements ISketch {
    public id = "webcam";
    public ctracker = new clm.tracker();
    public scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private controls: THREE.OrbitControls;
    private pointsMaterial = new THREE.PointsMaterial({
        vertexColors: THREE.VertexColors,
        size: 0.014,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
    });
    private lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 0.7,
    });
    private superPoints: SuperPoint[];
    // private face: THREE.Points;

    public init(renderer: THREE.WebGLRenderer, audioContext: SketchAudioContext) {
        this.renderer = renderer;
        this.initVideo();
        this.setupCamera();
        this.setupCameraControls();
        // this.setupFaceMesh();
        this.setupAndAddSuperPoints();
    }

    public setupCamera() {
        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        this.camera.position.z = 3;
        this.camera.position.y = 1;
        this.camera.lookAt(new THREE.Vector3());
    }

    public setupCameraControls() {
        const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls = controls;
    }

    public setupAndAddSuperPoints() {
        this.superPoints = (new Array(71)).fill(null).map(() => {
            return this.createAndAddFlameSubtreeToScene(new THREE.Vector3());
        });
    }

    public createAndAddFlameSubtreeToScene(rootPoint: THREE.Vector3) {
        const geometry = new THREE.Geometry();
        geometry.vertices = [];
        geometry.colors = [];
        const superPoint = new SuperPoint(
            new THREE.Vector3(0, 0, 0),
            new THREE.Color(0, 0, 0),
            geometry,
            CIRCLE_CLAWS,
        );
        superPoint.recalculate(rootPoint.x, rootPoint.y, rootPoint.z, DEPTH);

        const pointCloud = new THREE.Points(geometry, this.pointsMaterial);
        pointCloud.rotateX(-Math.PI / 2);
        this.scene.add(pointCloud);

        const line = new THREE.Line(geometry, this.lineMaterial);
        line.rotateX(-Math.PI / 2);
        this.scene.add(line);

        return superPoint;
    }

    // public setupFaceMesh() {
    //     const geometry = new THREE.Geometry();
    //     geometry.vertices = (new Array(71)).fill(null).map(() => {
    //         return new THREE.Vector3(
    //             Math.random() * 2 - 1,
    //             Math.random() * 2 - 1,
    //             Math.random() * 2 - 1,
    //         );
    //     });
    //     geometry.colors = (new Array(71)).fill(null).map(() => new THREE.Color("white"));
    //     this.face = new THREE.Points(geometry, this.pointsMaterial);
    //     this.scene.add(this.face);
    // }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    public initVideo() {
        const constraints: MediaStreamConstraints = {
            video: true,
        };

        this.ctracker.init();
        navigator.getUserMedia(
            constraints,
            (localMediaStream) => {
                const video = document.getElementsByTagName("video")[0];
                video.src = window.URL.createObjectURL(localMediaStream);
                this.ctracker.start(video);
                video.style.display = "none";
                // video.style.position = "absolute";
                // video.style.zIndex = "1";
                // video.style.opacity = "0.25";
            },
            (e) => {
                console.log('Reeeejected!', e);
            },
        );
    }

    public animate() {
        const positions = this.ctracker.getCurrentPosition();
        console.log(positions);
        if (positions) {
            positions.forEach(([x, y], idx) => {
                this.superPoints[idx].recalculate(
                    THREE.Math.mapLinear(x, 0, 800, -3, 3),
                    THREE.Math.mapLinear(y, 0, 800, 3, -3),
                    1,
                    DEPTH,
                );
            });
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
})();
