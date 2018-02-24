import { parse } from "query-string";
import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../sketch";

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let controls: THREE.OrbitControls;

function init(_renderer: THREE.WebGLRenderer, _audioContext: SketchAudioContext) {
    scene = new THREE.Scene();

    renderer = _renderer;

    const aspectRatio = renderer.domElement.height / renderer.domElement.width;
    camera = new THREE.PerspectiveCamera(60, 1 / aspectRatio, 0.01, 1000);
    camera.position.z = 3;
    camera.position.y = 1;
    camera.lookAt(new THREE.Vector3());
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;
    controls.maxDistance = 10;
    controls.minDistance = 0.1;
    controls.enableKeys = false;
    controls.enablePan = false;
}

function animate() {
    controls.update();
    renderer.render(scene, camera);
}

function mousemove(event: JQuery.Event) {
}

function mousedown(event: JQuery.Event) {
}

function dblclick() {
}

function resize() {
    camera.aspect = renderer.domElement.width / renderer.domElement.height;
    camera.updateProjectionMatrix();
}

export const Genetics: ISketch = {
    id: "genetics",
    init,
    animate,
    dblclick,
    mousemove,
    mousedown,
    resize,
};
