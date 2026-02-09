import * as THREE from "three";

import PostPass from "../common/pass/post";
import { ISketch } from "../sketch";

export class Basic extends ISketch {
    public events = {};
    public scene = new THREE.Scene();
    public camera!: THREE.PerspectiveCamera;
    public mesh = (() => {
        const meshes = [];
        const geom = new THREE.SphereGeometry(50, 35, 35);
        const colorOptions = [
            // "#0f9960",
            "#d9822b",
            // "#db3737",
            // "#00b3a4",
"#5C7080",
"#BFCCD6",
        ];
        const materials = colorOptions.map((c) => new THREE.MeshStandardMaterial({
            color: c,
            roughness: 1,
            metalness: 0,
        }));
        for (let i = 0; i < 100; i++) {
            const mesh = new THREE.Mesh(geom, materials[THREE.Math.randInt(0, materials.length - 1)]);
            mesh.position.x = THREE.Math.randFloat(-250, 250);
            mesh.position.z = THREE.Math.randFloat(-250, 250);
            mesh.position.y = THREE.Math.randFloat(0, 250);
            mesh.scale.setScalar(THREE.Math.randFloat(0.5, 1.0));
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            meshes.push(mesh);
        }
        const obj = new THREE.Object3D();
        obj.add(...meshes);
        return obj;
    })();
    public composer!: THREE.EffectComposer;
    public controls!: THREE.OrbitControls;

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.Uncharted2ToneMapping;
        this.renderer.toneMappingExposure = 0.9;
        this.renderer.toneMappingWhitePoint = 1.1;

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 10, 5000);
        this.camera.position.set(0, 350, 700);
        this.camera.lookAt(0, 0, 0);

        this.composer = new THREE.EffectComposer(this.renderer);
        // this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));

        const ssaa = new (THREE as any).SSAARenderPass(this.scene, this.camera);
        ssaa.unbiased = true;
        ssaa.sampleLevel = 2;
        this.composer.addPass(ssaa);

        const sao = new THREE.SAOPass(this.scene, this.camera, false, true);
        // sao.params.output = THREE.SAOPass.OUTPUT.SAO;
        sao.params.saoBias = 0.2;
        sao.params.saoIntensity = 0.030;
        sao.params.saoScale = 90;
        sao.params.saoKernelRadius = 40;
        sao.params.saoBlur = true;
        this.composer.addPass(sao);

        const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(this.canvas.width, this.canvas.height), 0.4, 0.7, 0.85);
        this.composer.addPass(bloomPass);

        const adaptiveToneMappingPass = new THREE.AdaptiveToneMappingPass(true, 256);
        this.composer.addPass(adaptiveToneMappingPass);

        const post = new PostPass();
        this.composer.addPass(post);

        this.composer.passes[this.composer.passes.length - 1].renderToScreen = true;

        this.controls = new THREE.OrbitControls(this.camera, this.canvas);

        this.mesh.position.y = 200;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        // const floorGeom = new THREE.PlaneGeometry(1000, 1000, 10, 10);
        const floorGeom = new THREE.CircleBufferGeometry(400, 100);
        floorGeom.rotateX(-Math.PI / 2);
        const floor = new THREE.Mesh(floorGeom, new THREE.MeshStandardMaterial({
            roughness: 1,
            color: "#202020",
            side: THREE.DoubleSide,
            metalness: 0,
        }));
        this.scene.add(floor);
        floor.castShadow = true;
        floor.receiveShadow = true;

        const light1 = new THREE.DirectionalLight("#f5f8fa", 0.8);
        light1.position.set(0.2, 1, 0.3).setLength(1000);
        light1.target = this.scene;
        light1.castShadow = true;

        light1.shadow.mapSize.width = 2048 * 2;
        light1.shadow.mapSize.height = 2048 * 2;

        light1.shadow.bias = 0.000;
        light1.shadow.radius = 1.5; // 1 is normal; 1.5 makes it a bit blurrier
        light1.shadow.camera.near = 100;
        light1.shadow.camera.far = 2000;
        light1.shadow.camera.left = -1000;
        light1.shadow.camera.right = 1000;
        light1.shadow.camera.top = 1000;
        light1.shadow.camera.bottom = -1000;
        light1.shadow.camera.updateProjectionMatrix();

        this.scene.add(light1);

        this.scene.add(new THREE.DirectionalLightHelper(light1));
        this.scene.add(new THREE.CameraHelper(light1.shadow.camera));

        this.scene.add(new THREE.AmbientLight("#182026", 3));

        this.scene.add(new THREE.HemisphereLight("#E3F9F7", "#182026", 0.3));

        const sky = new THREE.Sky();
        sky.scale.setScalar(500000);
        const uniforms = sky.material.uniforms;
        uniforms.turbidity.value = 1;
        uniforms.rayleigh.value = 0.8;
        uniforms.mieCoefficient.value = 0.03;
        uniforms.mieDirectionalG.value = 0.87;
        uniforms.luminance.value = 1.01;

        sky.material.uniforms.sunPosition.value.copy(light1.position);
        this.scene.add(sky);

        this.scene.add(new THREE.AxesHelper(100));

    }

    public animate(millisElapsed: number) {
        const dt = millisElapsed / 1000;
        this.mesh.rotation.x += 0.3 * dt;
        this.mesh.rotation.y += 0.5 * dt;
        this.controls.update();
        this.composer.render();
    }

    resize(width: number, height: number) {
        this.camera.aspect = 1 / this.aspectRatio;
    }
}

export default Basic;
