import * as React from "react";
import * as THREE from "three";

import devlog from "../common/devlog";
import { ISketch, SketchAudioContext } from "../sketch";

// goal - compute particle positions from the vertex shader

class RenderToTexture extends ISketch {
    public scene = new THREE.Scene();
    private camera!: THREE.PerspectiveCamera;

    public mesh!: THREE.Mesh;
    public material!: THREE.MeshBasicMaterial;
    public renderTarget!: THREE.WebGLRenderTarget;
    public renderTarget2!: THREE.WebGLRenderTarget;
    public currentTarget!: THREE.WebGLRenderTarget;

    public init() {
        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 1000);
        this.camera.position.z = 5;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.renderTarget = new THREE.WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);
        this.renderTarget2 = new THREE.WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);
        // we render onto target 2, using target 1 as the material map
        this.currentTarget = this.renderTarget2;
        this.material = new THREE.MeshBasicMaterial({
            // map: this.renderTarget.texture,
            color: 0xff00ff,
        });
        const geom = new THREE.CubeGeometry(1, 1, 1);
        geom.faces.forEach((f) => devlog(f));
        // geom.faces.forEach((f) => f.materialIndex = 0);
        this.mesh = new THREE.Mesh(geom, new THREE.MultiMaterial([
            new THREE.MeshBasicMaterial({
                wireframe: true,
                color: 0xffffff,
                wireframeLinewidth: 5,
            }),
            this.material,
        ]));
        this.scene.add(this.mesh);
    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    public animate() {
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.02;
        const nextTarget = (this.currentTarget === this.renderTarget) ? this.renderTarget2 : this.renderTarget;
        // this.renderer.setRenderTarget(this.currentTarget);
        // this.material.map = nextTarget.texture;
        // this.renderer.render(this.scene, this.camera, this.currentTarget, true);
        this.renderer.render(this.scene, this.camera, undefined, true);

        this.currentTarget = nextTarget;
    }
}

export default RenderToTexture;
