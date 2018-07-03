import * as THREE from "three";

// import Worker = require('worker-loader!./worker');
import { DataTexture, Texture, Vector2 } from "three";
import { ExplodeShader } from "../../common/explodeShader";
import GPUComputationRenderer, { GPUComputationRendererVariable } from "../../common/gpuComputationRenderer";
import { QUALITY } from "../../quality";
import { ISketch } from "../../sketch";
import WebcamBackgroundSubtractor from "../webcamBackgroundSubtractor";
import { DontMovePoints } from "./dontMovePoints";

const COMPUTE_PARTICLE_STATE = require("./computeParticleState.frag");

export const VIDEO_WIDTH = 256;
export const VIDEO_HEIGHT = 128;

class DontMove extends ISketch {
    public scene = new THREE.Scene();
    private camera = new THREE.OrthographicCamera(0, 1, 0, 1, 1, 1000);
    public filter = new THREE.ShaderPass(ExplodeShader);
    public composer!: THREE.EffectComposer;

    public computation!: GPUComputationRenderer;
    public particleStateVariable!: GPUComputationRendererVariable;
    public points!: DontMovePoints;

    public backgroundSubtractor = new WebcamBackgroundSubtractor(VIDEO_WIDTH, VIDEO_HEIGHT);

    public init() {
        this.backgroundSubtractor.init();
        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
        this.filter.uniforms.iResolution.value = this.resolution;
        // this.filter.renderToScreen = true;
        // this.composer.addPass(this.filter);
        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;

        const sideLength = QUALITY === "high" ? 1024 : 256;
        this.computation = new GPUComputationRenderer(sideLength, sideLength, this.renderer);
        const initialValueTexture = this.computation.createTexture();
        this.particleStateVariable = this.computation.addVariable("particleState", COMPUTE_PARTICLE_STATE, initialValueTexture);
        this.computation.setVariableDependencies( this.particleStateVariable, [ this.particleStateVariable ]);
        this.particleStateVariable.minFilter = THREE.LinearFilter;
        this.particleStateVariable.magFilter = THREE.LinearFilter;
        this.particleStateVariable.material.uniforms.iGlobalTime = { value: 0 };
        this.particleStateVariable.material.uniforms.boundsMin = { value: new Vector2(-0.5, -0.5) };
        this.particleStateVariable.material.uniforms.boundsMax = { value: new Vector2(0.5, 0.5) };
        const zeroData: Uint8Array = new Uint8Array(VIDEO_WIDTH * VIDEO_HEIGHT);
        const texture = new DataTexture(zeroData, VIDEO_WIDTH, VIDEO_HEIGHT, THREE.LuminanceFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.particleStateVariable.material.uniforms.foreground = { value: texture };

        this.particleStateVariable.material.defines.VIDEO_WIDTH = VIDEO_WIDTH;
        this.particleStateVariable.material.defines.VIDEO_HEIGHT = VIDEO_HEIGHT;
        const err = this.computation.init();
        if (err) {
            console.error(err);
        }
        const opacity = QUALITY === "high" ? 0.2 : 0.1;
        const pointSize = QUALITY === "high" ? 2 : 5;
        // this.points = new DontMovePoints(sideLength, opacity, pointSize * 0.1);
        this.points = new DontMovePoints(sideLength, 1, 0.2);
        this.points.material.uniforms.foreground.value = texture;
        this.scene.add(this.points);
        this.setupCamera();
    }

    public setupCamera() {
        this.camera.position.z = 500;
        this.camera.lookAt(new THREE.Vector3());
        this.resize(this.renderer.domElement.width, this.renderer.domElement.height);
    }

    public resize(elementWidth: number, elementHeight: number) {
        let width = 1, height = 1;
        if (elementWidth > elementHeight) {
            height = 1;
            width = 1 * elementWidth / elementHeight;
        } else {
            width = 1;
            height = 1 * elementHeight / elementWidth;
        }
        this.camera.left = -width / 2;
        this.camera.bottom = -height / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.updateProjectionMatrix();

        this.particleStateVariable.material.uniforms.boundsMin.value.set(this.camera.left, this.camera.bottom);
        this.particleStateVariable.material.uniforms.boundsMax.value.set(this.camera.right, this.camera.top);
    }

    get aspectRatio() {
        return this.renderer.domElement.height / this.renderer.domElement.width;
    }

    public animate() {
        const fgmask = this.backgroundSubtractor.update();
        if (fgmask != null) {
            // const fgmaskData = fgmask.data.slice();
            const texture = this.particleStateVariable.material.uniforms.foreground.value as DataTexture;
            texture.image.data.set(fgmask.data);
            texture.needsUpdate = true;
            // this.particleStateVariable.material.uniforms.foreground.value.image.data = fgmask.data;
        }
        if (this.timeElapsed > 3000) {
            this.particleStateVariable.material.uniforms.iGlobalTime.value = (this.timeElapsed - 3000.) / 1000.;
            this.computation.compute();
            this.points.material.uniforms.stateVariable.value = this.computation.getCurrentRenderTarget(this.particleStateVariable).texture;
        }

        const t = this.timeElapsed / 10000;
        this.filter.uniforms.iMouse.value = new THREE.Vector2(Math.sin(t) / 2, Math.cos(t) / 2);
        // this.composer.render();
        this.renderer.render(this.scene, this.camera);
    }
}

export default DontMove;
