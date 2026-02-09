import * as $ from "jquery";
import * as React from "react";
import * as THREE from "three";

import { Curtain } from "../../common/curtain";
import { ISketch } from "../../sketch";
import { CameraController, CameraFocusOnBoxController, CameraFocusOnObjectController } from "./camera";
import { Branch, NUTRIENT_PER_SECOND } from "./components/branch";
import { Bud } from "./components/branch/bud";
import { Component } from "./components/component";
import { Flower, Petal, Tepal } from "./components/flower";
import { Leaf } from "./components/leaf";
import dna, { randomizeDna } from "./dna";
import { DyingObject } from "./dyingObject";
import { BloomScene } from "./scene";
import { season } from "./season";
import { DyingSeasonalEffect, FloweringSeasonalEffect, GrowingSeasonalEffect, SeasonalEffect } from "./season/seasonalEffects";

export class Bloom extends ISketch {
    public scene = new BloomScene();
    public camera!: THREE.PerspectiveCamera;
    public orbitControls!: THREE.OrbitControls;
    public composer!: THREE.EffectComposer;

    public component?: THREE.Object3D;

    private componentBoundingBox: THREE.Box3 = new THREE.Box3();

    public season = season;

    public seasonalEffect: SeasonalEffect = new GrowingSeasonalEffect();

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 0.01, 50);
        this.camera.position.y = 1;
        this.camera.position.z = 1;
        this.scene.add(this.camera);

        this.orbitControls = new THREE.OrbitControls(this.camera);
        // this.orbitControls.autoRotate = true;
        // this.orbitControls.autoRotateSpeed = 1.6;

        // do this before adding the flowers or anything
        this.initCubeTexture();

        randomizeDna(this.envMap);
        this.preloadTextures();

        this.initComponent();
        if (this.component != null) {
            this.scene.add(this.component);
        }

        this.initPostprocessing();

        this.initAudio();

    }

    private gain!: GainNode;
    private audio!: HTMLAudioElement;
    private initAudio() {
        const ctx = this.audioContext;
        this.audio = (
            $("<audio autoplay loop>")
                .append(`<source src="/assets/audio/bloom.mp3" type="audio/mp3">`)
                .append(`<source src="/assets/audio/bloom.wav" type="audio/wav">`) as JQuery<HTMLAudioElement>
        )[0];
        const source = ctx.createMediaElementSource(this.audio);
        this.gain = ctx.createGain();

        this.gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime);
        this.gain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 5);

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

        this.scene.add(petal, tepal, leaf);

        // do a single render with a dummy leaf, tepal, and petal
        this.renderer.render(this.scene, this.camera);

        this.scene.remove(petal, tepal, leaf);
    }

    public envMap!: THREE.CubeTexture;
    public initCubeTexture() {
        const cubeCamera = new THREE.CubeCamera(1, 100, 1024);
        cubeCamera.position.set(0, 1, 0);
        this.scene.add(cubeCamera);
        cubeCamera.update(this.renderer, this.scene);

        this.envMap = cubeCamera.renderTarget.texture as THREE.CubeTexture;
    }

    public initPostprocessing() {
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;
    }

    public initComponent() {
        const branch = new Branch(6, 0);
        // const helper = new THREE.SkeletonHelper(branch.meshManager.skeleton.bones[0]);
        // scene.add(helper);
        this.component = branch;

        // const flower = Flower.generate();
        // flower.rotation.z = -Math.PI / 4;
        // flower.position.y = 0.3;
        // this.component = flower;

        // const petal = Petal.generate(dna.petalTemplate);
        // petal.position.y = 0.3;
        // petal.rotation.z = Math.PI / 3;
        // this.component = petal;
        // const skeletonHelper = new THREE.SkeletonHelper(petal.mesh.skeleton.bones[0]);
        // scene.add(skeletonHelper);

        // const tepal = Tepal.generate(dna.tepalTemplate);
        // tepal.position.y = 0.3;
        // tepal.rotation.z = Math.PI / 3;
        // this.component = tepal;
        // const skeletonHelper = new THREE.SkeletonHelper(tepal.mesh.skeleton.bones[0]);
        // scene.add(skeletonHelper);

        // const leaf = new Leaf(dna.leafTemplate);
        // leaf.position.y = 0.3;
        // leaf.rotation.z = Math.PI / 3;
        // this.component = leaf;
        // const skeletonHelper = new THREE.SkeletonHelper(leaf.lamina.skeleton.bones[0]);
        // scene.add(skeletonHelper);
    }

    private r1: HTMLDivElement | null = null;
    private r2: HTMLPreElement | null = null;

    private curtain: Curtain | null = null;

    public elements = [
        // <div style={{ textAlign: "left" }}>
        //     <div ref={(r) => this.r1 = r} />
        //     <pre ref={(r) => this.r2 = r} />
        // </div>,
        <Curtain ref={(curtainRef) => this.curtain = curtainRef} />,
    ];

    private triedReload = false;

    public animate(ms: number) {
        this.setSeason();

        try {
            this.updateComponentAndComputeBoundingBox();
        } catch {}

        try {
            this.updateSeasonalEffect();
        } catch {}

        try {
            // const numCameraUpdates = Math.ceil(ms / 17);
            // for (let i = 0; i < numCameraUpdates; i++) {
            //     this.updateCamera();
            // }
        } catch {}

        try {
            this.updateDyingObjects(ms);
        } catch {}

        if (this.r2 != null) {
            this.r2.style.background = "white";
            // this.r1.textContent = this.audioContext.state;
            // this.r1.textContent = `${nutrientsPerSecond}`;
            // this.r2.textContent = `${this.canvas.width},${this.canvas.height}, ${window.devicePixelRatio}, ${this.renderer.getPixelRatio()}\n${(1000 / ms).toFixed(2)}`;
            // this.r2.textContent = JSON.stringify(season) + "\n" + this.audio.currentTime;
            // this.r1.textContent = `${this.feedParticles.pointsStartIndex}, ${this.feedParticles.numActivePoints}`;
        }
        // this.debugObjectCounts();

        this.orbitControls.update();
        // this.renderer.render(this.scene, this.camera);
        try {
            this.composer.render();
        } catch {}

        try {
            // song is 10 and a half minutes long
            if (season.type === "dying" && season.percent > 1) {
                this.triggerReload();
            }
        } catch {}
    }

    public setSeason() {
        const [flowerTime, dieTime, restartTime] = [
            (5 * 60 + 20),
            (8 * 60 + 16),
            (10 * 60 + 14),
        ];
        // const currentTime = this.audio.currentTime * 10;
        // if (currentTime < flowerTime) {
        //     season.type = "growing";
        //     season.percent = THREE.Math.clamp(currentTime / flowerTime, 0, 1);
        // } else if (currentTime < dieTime) {
        //     season.type = "flowering";
        //     season.percent = THREE.Math.clamp((currentTime - flowerTime) / (dieTime - flowerTime), 0, 1);
        // } else {
        //     season.type = "dying";
        //     season.percent = THREE.Math.clamp((currentTime - dieTime) / (restartTime - dieTime), 0, 1);
        // }
        season.type = "flowering";
        season.percent = 1;
        // const timeOfDay = THREE.Math.clamp(Math.min(currentTime / restartTime, 1), 0, 1);
        // this.scene.setTimeOfDay(timeOfDay);
        this.scene.setTimeOfDay(0.2);
    }

    public updateSeasonalEffect() {
        if (season.type === "flowering" && !(this.seasonalEffect instanceof FloweringSeasonalEffect)) {
            this.seasonalEffect = new FloweringSeasonalEffect(this);
        } else if (season.type === "dying" && !(this.seasonalEffect instanceof DyingSeasonalEffect)) {
            this.seasonalEffect = new DyingSeasonalEffect(this);
        }

        this.seasonalEffect.update();
    }

    public updateDyingObjects(ms: number) {
        const toDelete: Set<DyingObject> = new Set();
        for (const obj of this.dyingObjects) {
            obj.update(ms);
            if (obj.parent == null) {
                toDelete.add(obj);
            }
        }
        this.dyingObjects = this.dyingObjects.filter((o) => !toDelete.has(o));
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

    public dyingObjects: DyingObject[] = [];

    public cameraController: CameraController = (() => {
        const c = new CameraFocusOnBoxController(this, this.componentBoundingBox, true, 1, 0.0);
        c.lifeTime *= 1.5;
        return c;
    })();
    public focusTargets: THREE.Object3D[] = [];

    private updateComponentAndComputeBoundingBox() {
        this.componentBoundingBox.min.set(-0.1, 0, -0.1);
        this.componentBoundingBox.max.set(0.1, 0.3, 0.1);
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
                if (obj instanceof Leaf && obj.growthPercentage < 0.25 && season.type !== "flowering") {
                    this.focusTargets.push(obj);
                } else if (obj instanceof Flower) {
                    this.focusTargets.push(obj);
                }
            }
        });
    }

    public triggerDeath(obj: Component) {
        const objParent = obj.parent;
        const dyingObject = new DyingObject(obj);
        this.dyingObjects.push(dyingObject);
        this.scene.add(dyingObject);
        if (objParent != null && objParent instanceof Component && objParent.children.length === 0) {
            // this is a container component with nothing left; just kill it off
            if (objParent.parent != null) {
                objParent.parent.remove(objParent);
            }
        }
    }

    private updateCamera() {
        if (this.cameraController.timeAlive > this.cameraController.lifeTime) {
            this.cameraController = this.newCameraController();
            if (Math.random() < 0.1) {
                this.cameraController.targetPosLerp *= 10;
            }
        }
        this.cameraController.updateCamera();
    }

    public newCameraController() {
        // just focus on the bare tree at the end
        if (season.type === "dying" && season.percent > 0.8) {
            return new CameraFocusOnBoxController(this, this.componentBoundingBox, true);
        }
        if (season.type === "flowering" && season.percent > 0.8) {
            return new CameraFocusOnBoxController(this, this.componentBoundingBox, true);
        }
        // probably, look at individual leaves
        if (season.type === "dying" && Math.random() < 0.5 && !(this.cameraController instanceof CameraFocusOnObjectController)) {
            // the last one is the newest dying object
            const focus = this.dyingObjects[this.dyingObjects.length - 1];
            if (focus != null) {
                const dist = THREE.Math.randFloat(0.1, 0.8);
                const c = new CameraFocusOnObjectController(this, focus, 0.15, dist);
                c.targetPosLerp = 0.15;
                c.lifeTime = 8000;
                return c;
            }
        }
        const shouldDoFocusShot = season.type === "flowering" || Math.random() < 0.5;
        if (shouldDoFocusShot && this.focusTargets.length > 0) {
            // focus on a random target
            const focusTarget = this.focusTargets[THREE.Math.randInt(0, this.focusTargets.length - 1)];
            const shouldLocalFocus = focusTarget instanceof Flower ? Math.random() < 0.9 : Math.random() < 0.5;
            if (focusTarget instanceof Flower) {
                // get up real close
                const flowerShot = new CameraFocusOnObjectController(this, focusTarget, 0.1, 0.1, shouldLocalFocus);
                flowerShot.lifeTime = THREE.Math.randFloat(10000, 20000);
                return flowerShot;
            } else {
                return new CameraFocusOnObjectController(this, focusTarget);
            }
        } else {
            // just use a default one
            return new CameraFocusOnBoxController(this, this.componentBoundingBox, false);
        }
    }

    private debugObjectCounts() {
        const counts = new Map<string, number>();
        let numActive = 0;
        let total = 0;
        this.scene.traverse((obj) => {
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
