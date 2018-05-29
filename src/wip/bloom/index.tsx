import * as $ from "jquery";
import * as React from "react";
import * as THREE from "three";

import { ISketch, SketchAudioContext } from "../../sketch";
import { Branch, NUTRIENT_PER_SECOND } from "./branch";
import { CameraController, CameraFocusOnBoxController, CameraFocusOnObjectController } from "./cameraController";
import { Component } from "./component";
import { Curtain } from "./curtain";
import dna, { randomizeDna } from "./dna";
import { FeedParticles } from "./feedParticles";
import { Flower, Petal, Tepal } from "./flower";
import { Leaf } from "./leaf";
import { mouse } from "./mouse";
import { OpenPoseManager } from "./openPoseManager";
import { PersonMesh } from "./personMesh";
import scene from "./scene";

class Bloom extends ISketch {
    public events = {
        mousemove: (e: JQuery.Event) => {
            mouse.x = THREE.Math.mapLinear(e.offsetX!, 0, this.canvas.width, -1, 1);
            mouse.y = THREE.Math.mapLinear(e.offsetY!, 0, this.canvas.height, 1, -1);
        },
        mousedrag: (e: JQuery.Event) => {
            mouse.x = THREE.Math.mapLinear(e.offsetX!, 0, this.canvas.width, -1, 1);
            mouse.y = THREE.Math.mapLinear(e.offsetY!, 0, this.canvas.height, 1, -1);
        },
    };

    public scene = scene;
    public camera!: THREE.PerspectiveCamera;
    public orbitControls!: THREE.OrbitControls;
    public composer!: THREE.EffectComposer;

    public component?: THREE.Object3D;
    // public component!: Branch;

    private componentBoundingBox: THREE.Box3 = new THREE.Box3();

    public peopleMeshes: PersonMesh[] = [];

    public openPoseManager!: OpenPoseManager;

    public feedParticles!: FeedParticles;

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 50);
        this.camera.position.y = 1;
        this.camera.position.z = 1;
        this.scene.add(this.camera);

        this.orbitControls = new THREE.OrbitControls(this.camera);
        this.orbitControls.autoRotate = true;
        this.orbitControls.autoRotateSpeed = 0.6;

        this.openPoseManager = new OpenPoseManager();

        // do this before adding the flowers or anything
        this.initCubeTexture();

        randomizeDna(this.envMap);
        this.preloadTextures();

        this.initComponent();
        if (this.component != null) {
            this.scene.add(this.component);
        }

        this.initPostprocessing();

        this.feedParticles = new FeedParticles();
        this.scene.add(this.feedParticles);

        for (let i = 0; i < 20; i++) {
            const personMesh = new PersonMesh(i);
            this.peopleMeshes[i] = personMesh;
            personMesh.position.z = -1;
            this.camera.add(personMesh);
            // this.scene.add(personMesh);
        }

        this.initAudio();

        // scene.add(this.person);

        // const bhelper = new THREE.Box3Helper(this.componentBoundingBox);
        // scene.add(bhelper);

    }

    private gain!: GainNode;
    private initAudio() {
        const ctx = this.audioContext;
        const audio = (
            $("<audio autoplay loop>")
                .append(`<source src="/assets/audio/bloom.mp3" type="audio/mp3">`)
                .append(`<source src="/assets/audio/bloom.wav" type="audio/wav">`) as JQuery<HTMLAudioElement>
        )[0];
        const source = ctx.createMediaElementSource(audio);
        this.gain = ctx.createGain();
        source.connect(this.gain);
        this.gain.connect(ctx.gain);
    }

    private preloadTextures() {
        const petal = Petal.generate(dna.petalTemplate);
        petal.visible = false;
        const tepal = Tepal.generate(dna.tepalTemplate);
        tepal.visible = false;
        const leaf = Leaf.generate(dna.leafTemplate);
        leaf.visible = false;

        scene.add(petal, tepal, leaf);

        // do a single render with a dummy leaf, tepal, and petal
        this.renderer.render(this.scene, this.camera);

        scene.remove(petal, tepal, leaf);
    }

    public envMap!: THREE.CubeTexture;
    public initCubeTexture() {
        const cubeCamera = new THREE.CubeCamera(1, 100, 1024);
        cubeCamera.position.set(0, 1, 0);
        scene.add(cubeCamera);
        cubeCamera.update(this.renderer, scene);

        this.envMap = cubeCamera.renderTarget.texture as THREE.CubeTexture;
    }

    public initPostprocessing() {
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

        // this doesn't work too well
        // const bokehPass = new THREE.BokehPass(this.scene, this.camera, {
        //     focus: 1,
        //     aperture: 0.00025,
        //     maxblur: 0.05,
        //     // width: this.canvas.width,
        //     // height: this.canvas.height,
        // });
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
        const branch = new Branch(10);
        // const helper = new THREE.SkeletonHelper(branch.meshManager.skeleton.bones[0]);
        // scene.add(helper);
        this.component = branch;

        // const flower = Flower.generate();
        // // flower.rotation.z = -Math.PI / 4;
        // this.component = flower;

        // const petal = Petal.generate(dna.petalTemplate);
        // petal.position.y = 0.3;
        // petal.rotation.z = Math.PI / 3;
        // this.component = petal;
        // const skeletonHelper = new THREE.SkeletonHelper(petal.mesh.skeleton.bones[0]);
        // scene.add(skeletonHelper);

        // const leaf = new Leaf(dna.leafTemplate);
        // leaf.position.x = 0;
        // leaf.position.y = 0.2;
        // leaf.position.z = 0;
        // this.component = leaf;
        // const skeletonHelper = new THREE.SkeletonHelper(leaf.lamina.skeleton.bones[0]);
        // scene.add(skeletonHelper);

        // this.component = new THREE.Object3D();
        // for (let x = -5; x <= 5; x++) {
        //     for (let z = -5; z <= 5; z++) {
        //         randomizeDna();
        //         const leaf = new Leaf(dna.leafTemplate);
        //         leaf.position.x = x;
        //         leaf.position.y = 0.2;
        //         leaf.position.z = z;
        //         this.component.add(leaf);
        //         // leaf.scale.set(0.01, 0.01, 0.01);
        //         // leaf.skeleton.bones[0].scale.set(0.01, 0.01, 0.01);
        //         // const helper = new THREE.SkeletonHelper(leaf.skeleton.bones[0]);
        //         // this.scene.add(helper);
        //     }
        // }

        // const flower = Flower.generate();
        // this.component = flower;

    }

    private r1: HTMLDivElement | null = null;
    private r2: HTMLPreElement | null = null;

    private curtain: Curtain | null = null;

    public elements = [
        <div style={{ textAlign: "left" }}>
            <div ref={(r) => this.r1 = r} />
            <pre ref={(r) => this.r2 = r} />
        </div>,
        <Curtain ref={(curtainRef) => this.curtain = curtainRef} />,
    ];

    private triedReload = false;

    public animate(ms: number) {
        const nutrientsPerSecond = 10.2 + Math.log(this.openPoseManager.getLatestFramePeople().length + 1) / 3;
        NUTRIENT_PER_SECOND.value = nutrientsPerSecond;
        this.updateComponentAndComputeBoundingBox();
        this.updateCamera();
        this.updatePersonMeshes();
        this.feedParticles.animate(ms);

        if (this.r1 != null) {
            this.r1.style.background = "white";
            this.r1.textContent = this.audioContext.state;
            // this.r1.textContent = `${nutrientsPerSecond}`;
            // this.r1.textContent = `${this.feedParticles.pointsStartIndex}, ${this.feedParticles.numActivePoints}`;
        }
        this.debugObjectCounts();

        this.orbitControls.update();
        // this.renderer.render(this.scene, this.camera);
        this.composer.render();

        // song is 10 and a half minutes long
        if (this.timeElapsed > (10 * 60 + 40) * 1000) {
            this.triggerReload();
        }
    }

    public triggerReload() {
        const outtroFadeOutSeconds = 5;
        if (!this.triedReload) {
            if (this.curtain != null) {
                this.curtain.setState({ closed: true });
            }
            this.gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + outtroFadeOutSeconds);
            setTimeout(() => {
                location.reload();
            }, outtroFadeOutSeconds * 1000 + 1000);
            this.triedReload = true;
        }
    }

    private updatePersonMeshes() {
        const people = this.openPoseManager.getLatestFramePeople();
        for (const personMesh of this.peopleMeshes) {
            personMesh.updateFromOpenPoseFrame(people);
            if (personMesh.visible) {
                const p = new THREE.Vector3();
                personMesh.getWorldHeadPosition(p);
                if (Math.random() < 0.1) {
                    this.feedParticles.addPoint(p);
                }
            }
        }
    }

    public cameraController: CameraController = new CameraFocusOnBoxController(this, this.componentBoundingBox);
    public focusTargets: THREE.Object3D[] = [];

    private updateComponentAndComputeBoundingBox() {
        this.componentBoundingBox.min.set(-0.2, 0, -0.2);
        this.componentBoundingBox.max.set(0.2, 0.2, 0.2);
        const pos = new THREE.Vector3();
        if (this.component == null) {
            return;
        }
        this.focusTargets = [];
        this.component.traverse((obj) => {
            if (obj instanceof Component) {
                const newBorn = obj.timeBorn == null;
                if (newBorn) {
                    obj.timeBorn = this.timeElapsed;
                }
                if (obj.updateSelf) {
                    obj.updateSelf(this.timeElapsed);
                }
                if (!newBorn) {
                    // this is a cheaper way of doing obj.getWorldPosition() - the difference is that it
                    // lags by like 1 frame. This is why we only use non-newborns, so that they have
                    // one frame to initialize their scales and positions
                    pos.setFromMatrixPosition(obj.matrixWorld);

                    // the obj.rotation.y is nan sometimes, idk why
                    if (!Number.isNaN(pos.x)) {
                        this.componentBoundingBox.expandByPoint(pos);
                    }
                }
                if (obj instanceof Flower) {
                    this.focusTargets.push(obj);
                }
            }
        });
    }

    private updateCamera() {
        if (this.cameraController.timeAlive > 20000) {
            if (Math.random() < 0.5) {
                this.cameraController = new CameraFocusOnBoxController(this, this.componentBoundingBox);
            } else {
                // focus on a random target
                const focusTarget = this.focusTargets[THREE.Math.randInt(0, this.focusTargets.length - 1)];
                this.cameraController = new CameraFocusOnObjectController(this, focusTarget);
            }
        }
        this.cameraController.updateCamera();
    }

    private debugObjectCounts() {
        const counts = new Map<string, number>();
        let numActive = 0;
        let total = 0;
        scene.traverse((obj) => {
            const name = obj.constructor.name;
            counts.set(name, (counts.get(name) || 0) + 1);
            if (obj.matrixAutoUpdate) {
                numActive++;
            }
            total++;
        });
        if (this.r2 != null) {
            const entries = Array.from(counts.entries());
            entries.sort(([_, countA], [__, countB]) => countB - countA);
            this.r2.textContent = [
                `Total: ${total} (${numActive})`,
                ...entries.map( ([name, count]) => `${name}: ${count}` ),
            ].join("\n");
        }
    }

    public resize(width: number, height: number) {
        this.camera.aspect = 1 / this.aspectRatio;
        this.camera.updateProjectionMatrix();
    }
}

export default Bloom;
