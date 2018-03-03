import * as React from "react";
import * as THREE from "three";

import { CylinderBufferGeometry, Mesh } from "three";
import { ISketch, SketchAudioContext } from "../sketch";

// goal - compute particle positions from the vertex shader

const stemGeom = new CylinderBufferGeometry(1, 1, 20);
stemGeom.translate(0, 10, 0);
stemGeom.rotateX(Math.PI / 2);
const stemMat = new THREE.MeshPhongMaterial({
    color: 0x446622,
    side: THREE.DoubleSide,
});
function makeStem() {
    return new THREE.Mesh(stemGeom, stemMat);
}

const leafGeom = new THREE.CircleBufferGeometry( 3, 32 );
const leafMat = new THREE.MeshPhongMaterial({
    color: 0x4466dd,
    side: THREE.DoubleSide,
});
function makeLeaf() {
    return new THREE.Mesh(leafGeom, leafMat);
}

const flower = (() => {
    const points = [];
    for ( let i = 0; i < 10; i ++ ) {
        points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
    }
    const geometry = new THREE.LatheGeometry( points);

    return new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
    }) );
})();

const Bloom = new (class extends ISketch {
    public scene = new THREE.Scene();
    private camera: THREE.PerspectiveCamera;

    public init() {
        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        this.camera.position.set(0, 50, 50);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        const controls = new THREE.OrbitControls(this.camera);

        const floor = new Mesh(new THREE.PlaneBufferGeometry(500, 500), new THREE.MeshPhongMaterial({
            color: 0x448844,
            side: THREE.DoubleSide,
        }));
        floor.rotateX(Math.PI / 2);
        floor.receiveShadow = true;
        this.scene.add(floor);

        this.scene.add(new THREE.AxesHelper(10));

        let position = new THREE.Vector3();
        for (let i = 0; i < 10; i++) {
            const offset = new THREE.Vector3(THREE.Math.randFloatSpread(5), 3, THREE.Math.randFloatSpread(5)).setLength(20);
            const newPosition = position.clone().add(offset);
            const stem = makeStem();
            stem.castShadow = true;
            stem.position.copy(position);
            stem.lookAt(newPosition);
            stem.matrixWorldNeedsUpdate = true;
            this.scene.add(stem);
            position = newPosition;
            // console.log(position);
            // this.scene.add(new THREE.ArrowHelper(offset.clone().normalize(), stem.position, 20));
        }

        // this.scene.add(leaf);
        this.scene.add(flower);

        const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        this.scene.add(light);

        const light2 = new THREE.DirectionalLight(0xff2288, 1);
        light2.position.set(100, 1000, 0);
        light2.castShadow = true;
        light2.shadow.mapSize.width = 1024;  // default
        light2.shadow.mapSize.height = 1024; // default
        light2.shadow.camera.left = -512;
        light2.shadow.camera.right = 512;
        light2.shadow.camera.bottom = -512;
        light2.shadow.camera.top = 512;
        light2.shadow.camera.near = 0.5;    // default
        light2.shadow.camera.far = 2500;     // default
        this.scene.add(light2);

        const helper = new THREE.CameraHelper(light2.shadow.camera);
        console.log(light2);
        this.scene.add(helper);
    }

    public animate() {
        this.renderer.render(this.scene, this.camera);
    }
})();

export default Bloom;
