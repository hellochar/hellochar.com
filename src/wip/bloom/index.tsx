import * as React from "react";
import * as THREE from "three";

import { LineBasicMaterial } from "three";
import { map } from "../../math";
import { ISketch, SketchAudioContext } from "../../sketch";
import { Branch } from "./branch";
import { Component, ComponentClass } from "./component";
import { Flower } from "./flower";
import { Leaf } from "./leaf";
import scene from "./scene";
import { Whorl } from "./whorl";

class Bloom extends ISketch {
    public scene = scene;
    public camera!: THREE.PerspectiveCamera;
    public orbitControls!: THREE.OrbitControls;
    public composer!: THREE.EffectComposer;

    public component!: Component;

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.setClearColor(new THREE.Color("rgb(193, 255, 251)"));

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.1, 50);
        this.camera.position.y = 10;
        this.camera.position.z = 10;
        this.camera.position.multiplyScalar(0.5);

        this.orbitControls = new THREE.OrbitControls(this.camera);
        // this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.6;

        this.initComponent();
        this.scene.add(this.component);

        // for (let x = -5; x <= 5; x++) {
        //     for (let z = -5; z <= 5; z++) {
        //         const leaf = new SkinnedLeaf();
        //         // leaf.scale.set(0.9, 0.9, 0.9);
        //         leaf.position.x = x;
        //         leaf.position.y = 0.2;
        //         leaf.position.z = z;
        //         this.scene.add(leaf);
        //         this.leafMeshes.push(leaf);
        //         leaf.scale.set(0.01, 0.01, 0.01);
        //         // leaf.skeleton.bones[0].scale.set(0.01, 0.01, 0.01);
        //         // const helper = new THREE.SkeletonHelper(leaf.skeleton.bones[0]);
        //         // this.scene.add(helper);
        //     }
        // }
        // // console.log(leaf.skeleton);
        this.initPostprocessing();
    }

    public initPostprocessing() {
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

        // this doesn't work too well
        // const bokehPass = new THREE.BokehPass(this.scene, this.camera, {
        //     focus: 5,
        //     aperture: 0.00025,
        //     maxblur: 0.05,
        //     // width: this.canvas.width,
        //     // height: this.canvas.height,
        // });
        // bokehPass.renderToScreen = true;
        // this.composer.addPass(bokehPass);

        // const ssaoPass = new THREE.SSAOPass( this.scene, this.camera, this.canvas.width, this.canvas.height );
        // // ssaoPass.onlyAO = true;
        // ssaoPass.radius = 8;
        // ssaoPass.aoClamp = 0.2;
        // ssaoPass.lumInfluence = 0.6;
        // this.composer.addPass(ssaoPass);

        // this.renderer.setClearColor(new THREE.Color("rgb("))

        // const saoPass = new THREE.SAOPass( this.scene, this.camera, false, true );
        // saoPass.params.saoBias = 2.6;
        // saoPass.params.saoIntensity = 0.30;
        // saoPass.params.saoScale = 6;
        // saoPass.params.saoKernelRadius = 4;
        // saoPass.params.saoMinResolution = 0;
        // saoPass.params.saoBlur = true;
        // saoPass.params.saoBlurRadius = 16;
        // saoPass.params.saoBlurStdDev = 4;
        // saoPass.params.saoBlurDepthCutoff = 0.05;
        // saoPass.params.output = THREE.SAOPass.OUTPUT.Default;
        // this.composer.addPass(saoPass);

        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
    }

    public initComponent() {
        // this.component = Leaves.generate();
        // const branch2 = new Branch(1);
        // branch2.addToEnd(Flower.generate());
        // const branch = new Branch(3);
        // branch.addToEnd(Leaves.generate());
        // branch.addToEnd(branch2);
        const branch = new Branch(10);
        const helper = new THREE.SkeletonHelper(branch.skeleton.bones[0]);
        scene.add(helper);
        this.component = branch;
    }

    public animate() {
        this.component.update(this.timeElapsed);

        this.orbitControls.update();
        // this.renderer.render(this.scene, this.camera);
        this.composer.render();
    }
}

export default Bloom;
