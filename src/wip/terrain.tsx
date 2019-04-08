import * as THREE from "three";

import PostPass from "../common/pass/post";
import { Noise } from "../common/perlin";
import { ISketch } from "../sketch";

export class Basic extends ISketch {
    public events = {};
    public scene = new THREE.Scene();
    public camera!: THREE.PerspectiveCamera;
    public geom = this.createNoiseTerrainGeometry();
    // public mat = new THREE.MeshStandardMaterial({
    public mat = new THREE.MeshLambertMaterial({
        color: "brown",
        side: THREE.DoubleSide,
    });
    public mesh = (() => {
        const mesh = new THREE.Mesh(this.geom, this.mat);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    })();
    public composer!: THREE.EffectComposer;
    public controls!: THREE.OrbitControls;

    private createNoiseTerrainGeometry() {
        const height = 256;
        const geom = new THREE.PlaneGeometry(height - 1, height - 1, height - 1, height - 1);
        geom.rotateX(-Math.PI / 2);
        const noise = new Noise(0);
        for (const vertex of geom.vertices) {
            const {x, z} = vertex;
            vertex.y = noise.octaveSimplex2(x / (height * 1), z / (height * 1)) * height / 8;
            vertex.y += (x - z) > 0 ? 20 : -20;
        }
        return geom;
    }

    public init() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.Uncharted2ToneMapping;
        this.renderer.toneMappingExposure = 0.9;
        this.renderer.toneMappingWhitePoint = 1.1;

        this.camera = new THREE.PerspectiveCamera(60, 1 / this.aspectRatio, 10, 5000);
        this.camera.position.set(0, 50, 70);
        this.camera.lookAt(0, 0, 0);

        this.composer = new THREE.EffectComposer(this.renderer);

        const ssaa = new (THREE as any).SSAARenderPass(this.scene, this.camera);
        ssaa.unbiased = true;
        ssaa.sampleLevel = 2;
        this.composer.addPass(ssaa);

        const sao = new THREE.SAOPass(this.scene, this.camera, false, true);
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

        this.scene.add(this.mesh);

        const light1 = new THREE.DirectionalLight("#f5f8fa", 1.2);
        light1.position.set(0.2, 1.0, 0.3).setLength(300);
        light1.target = this.scene;
        light1.castShadow = true;

        light1.shadow.mapSize.width = 2048 * 1;
        light1.shadow.mapSize.height = 2048 * 2;

        light1.shadow.bias = 0.0001;
        light1.shadow.radius = 1.5; // 1 is normal; 1.5 makes it a bit blurrier
        light1.shadow.camera.near = 100;
        light1.shadow.camera.far = 500;
        light1.shadow.camera.left = -180;
        light1.shadow.camera.right = 180;
        light1.shadow.camera.top = 180;
        light1.shadow.camera.bottom = -180;
        light1.shadow.camera.updateProjectionMatrix();
        light1.shadow.camera.visible = true;
        (window as any).light1 = light1;

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

        // this.scene.add(new THREE.AxesHelper(100));

        const path = simulateSingleErosionParticle(this.geom);
        this.geom.verticesNeedUpdate = true;
        // const g = new THREE.SphereGeometry(1, 10, 10);
        // const m = new THREE.MeshNormalMaterial();
        // for (const v of path) {
        //     const sphere = new THREE.Mesh(g, m);
        //     sphere.position.copy(v);
        //     this.scene.add(sphere);
        // }
    }

    private matLine = new THREE.LineBasicMaterial({ color: "white" });

    public animate(millisElapsed: number) {
        let path: any;
        for (let i = 0; i < 500 - this.frameCount; i++) {
            path = simulateSingleErosionParticle(this.geom);
        }
        this.geom.verticesNeedUpdate = true;

        // this.geom.computeFlatVertexNormals();
        // this.geom.computeVertexNormals();

        // if (this.frameCount % 60 === 0) {
        //     console.log(lostSoil);
        // }

        // if (this.frameCount % 60 === 0) {
        //     console.table(buckets);
        // }

        // const g = new THREE.Geometry();
        // g.vertices.push(...path);
        // this.scene.add(new THREE.Line(g, this.matLine));

        // const g = new THREE.SphereGeometry(1, 10, 10);
        // const m = new THREE.MeshNormalMaterial();
        // for (const v of path) {
        //     const sphere = new THREE.Mesh(g, m);
        //     sphere.position.copy(v);
        //     this.scene.add(sphere);
        // }
        // this.geom.computeFaceNormals();
        // this.geom.computeFlatVertexNormals();
        this.controls.update();
        this.composer.render();
    }

    resize(width: number, height: number) {
        this.camera.aspect = 1 / this.aspectRatio;
    }
}

export default Basic;

const buckets: { [s: string]: number } = {};
const height = 256;
function simulateSingleErosionParticle(geom: THREE.Geometry) {
    const path: THREE.Vector3[] = [];
    // use grid coordinates: [x, y] = geom.vertices[y*width + x];
    const position = new THREE.Vector2(
        THREE.Math.randFloat(0, height),
        THREE.Math.randFloat(0, height),
    );
    const velocity = new THREE.Vector2();
    const velocityNorm = new THREE.Vector2();
    let waterAmount = 1;
    let collectedSoil = 0;
    const force = new THREE.Vector2();
    const newPosition = new THREE.Vector2();
    // erosion algorithm:
    // first, send the droplet down the terrain gradient, simulating velocity and position.
    // as it's descending, it collects soil depending on the speed and delta height to its target.
    // each step we always move distance 1, regardless of velocity (this is a simulation enhancement)
    // each step it either collects or deposits soil:
    //   soil gets deposited if the water is too slow, or at a minimum
    //   soil gets collected if the water is fast
    // each step the water evaporates a bit which affects the collected soil amount.
    // gets and sets are bilinear.
    for (let i = 0; i < 100; i++) {
        if (position.x < 1 || position.y < 1 || position.x > height - 2 || position.y > height - 2) {
            collectedSoil -= deposit(geom, position.x, position.y, 99999, collectedSoil);
            // collectedSoil -= deposit(geom, height / 2, height / 2, 999999, collectedSoil);
            // collectedSoil -= deposit(geom, THREE.Math.randFloat(0, height), THREE.Math.randFloat(0, height),
            //     999999, collectedSoil);
            break;
        }
        // compute force
        // TODO these are introducing a bias
        // bilinearSlope(force, geom, position.x, position.y);
        gridGradient(force, geom, Math.round(position.x), Math.round(position.y));

        const angleBucket = (Math.floor(THREE.Math.radToDeg(force.angle()) / 10) * 10).toFixed(0);
        buckets[angleBucket] = (buckets[angleBucket] || 0) + 1;
        // console.log();

        // drag
        force.x += -velocity.x * 0.5;
        force.y += -velocity.y * 0.5;

        // compute velocity
        velocity.add(force);
        velocityNorm.copy(velocity).normalize();

        // compute new position
        newPosition.set(position.x + velocityNorm.x, position.y + velocityNorm.y);

        // compute height difference
        const hOld = bilinearGet(geom, position.x, position.y);
        const hNew = bilinearGet(geom, newPosition.x, newPosition.y);
        const hDiff = hNew - hOld;
        path.push(geom.vertices[Math.floor(position.y) * height + Math.floor(position.x)].clone());
        // compute soil deposit or collection at this step
        // hDiff is positive: deposit
        if (hDiff > 0) {
            // fill old position
            // how much should we deposit?
            // 1) no more than our collected soil amount.
            // 2) more than 0 - we want to deposit *some* amount, lets say a parameter
            // 3) not more than hDiff itself
            // 4) at most, enough to fill the pit.

            // Where do we deposit? on the old position. But the old position is in between 4 grid cells. So what should we do?
            // 1) bilinearly deposit (this might make hills)
            // 2) take the 4 grid points, find the points that are
            // lower than hNew, deposit into them weighted by their
            // height diff to hNew.
            const amountDeposited = deposit(geom, position.x, position.y, hNew, collectedSoil);
            collectedSoil -= amountDeposited;
        } else {
            // hDiff is negative: erode
            // how much should we erode?
            // 1) no more than our "carry capacity", the maximum amount of soil this mass of water can carry
            // 2) more if we're faster (scale by speed)
            // 3) more if we're bigger (scale by waterAmount)
            // 4) more if the diff is higher (scaled by hDiff)

            // todo: maybe change speed to be e.g. tanh from 0 to 1
            const speed = velocity.length(); // e.g. 5
            // if (speed > 1) {
            //     speed = 0;
            // }
            const erosionSpeed = 8;
            const erodeAmount = speed * waterAmount * -hDiff * erosionSpeed; // e.g. 50

            // where do we erode?
            // 1) take the 4 grid points, find points that are higher
            // than hNew, collect from them weighted by their height diff
            // to hNew
            const amountEroded = erode(geom, position.x, position.y, hNew, erodeAmount);
            collectedSoil += amountEroded;

            const amountOfSoilWaterCanCarry = 1;
            const carryCapacity = waterAmount * amountOfSoilWaterCanCarry - collectedSoil;

            if (collectedSoil > carryCapacity) {
                // we're overloaded; some of the soil will be deposited
                const wantedDepositAmount = (collectedSoil - carryCapacity) * 0.5;
                const amountDeposited = deposit(geom, position.x, position.y, hOld, wantedDepositAmount);
                collectedSoil -= amountDeposited;
            }
        }
        // compute evaporation
        waterAmount = Math.max(waterAmount - 0.02, 0);
        // update state
        position.copy(newPosition);
        // break early if: no more water, or not moving
        if (waterAmount <= 0) {
            collectedSoil -= deposit(geom, position.x, position.y, 99999, collectedSoil);
            break;
        }
    }
    lostSoil += collectedSoil;
    geom.verticesNeedUpdate = true;
    return path;
}
let lostSoil = 0;

const vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
function erode(geom: THREE.Geometry, x: number, y: number, bottomHeight: number, erodeAmount: number): number {
    // e.g. bottomHeight = 10, erodeAmount = 10
    const ix = Math.floor(x),
            iy = Math.floor(y),
            ix1 = ix + 1,
            iy1 = iy + 1;
    // go clockwise from top-left
    vertices[0].set(ix, iy, 0);
    vertices[1].set(ix1, iy, 0);
    vertices[2].set(ix1, iy1, 0);
    vertices[3].set(ix, iy1, 0);

    // we'll take at most 50% of the soil height
    const erodibility = 0.5;

    let totalSoilAvailable = 0;
    for (const v of vertices) {
        // compute soil available to take
        // vertices have height 5, 10, 30, 50
        // v.z's are 0, 0, 10, 20
        v.z = Math.max(0, (geom.vertices[v.y * height + v.x].y - bottomHeight) * erodibility);
        totalSoilAvailable += v.z;
        // totalSoilAvailable = 30
    }

    // 30 > 10 => true
    if (totalSoilAvailable > erodeAmount) {
        // erode soil weighted by individual cell amounts
        for (const v of vertices) {
            const percentage = v.z / totalSoilAvailable;
            const amountSoil = erodeAmount * percentage;
            geom.vertices[v.y * height + v.x].y -= amountSoil;
        }
        return erodeAmount;
    } else {
        // erode soil with full erodibility and return how much soil we actually collected
        let totalSoilEroded = 0;
        for (const v of vertices) {
            // new y's: 5, 10, 20, 30
            geom.vertices[v.y * height + v.x].y -= v.z;
            totalSoilEroded += v.z;
        }
        if (totalSoilEroded !== totalSoilAvailable) {
            throw new Error("eroded a different amount than how much we said we had");
        }
        return totalSoilEroded;
    }
}

// xy = position, z = soil need
function deposit(geom: THREE.Geometry, x: number, y: number, targetHeight: number, availableSoil: number): number {
    // we'll get up to 4 separate "soil needs", their sum will be totalSoilNeed
    // if totalSoilNeed >= availableSoil, drop all the soil weighted to soil need
    // if totalSoilNeed < availableSoil, drop the soil and return the amount of soil leftover

    const ix = Math.floor(x),
            iy = Math.floor(y),
            ix1 = ix + 1,
            iy1 = iy + 1;
    // go clockwise from top-left
    vertices[0].set(ix, iy, 0);
    vertices[1].set(ix1, iy, 0);
    vertices[2].set(ix1, iy1, 0);
    vertices[3].set(ix, iy1, 0);

    let totalSoilNeed = 0;
    for (const v of vertices) {
        if (v.x < 0 || v.y < 0 || v.x > height - 1 || v.y > height - 1) {
            return 0;
        }
        // compute soil need
        v.z = Math.max(0, targetHeight - geom.vertices[v.y * height + v.x].y);
        totalSoilNeed += v.z;
    }
    if (totalSoilNeed > availableSoil) {
        // drop all soil, weighted by individual soil need
        let totalSoilDropped = 0;
        for (const v of vertices) {
            const percentage = v.z / totalSoilNeed;
            const amountSoil = availableSoil * percentage;
            geom.vertices[v.y * height + v.x].y += amountSoil;
            totalSoilDropped += amountSoil;
        }
        if (totalSoilDropped > totalSoilNeed) {
            throw new Error("dropped more soil than we needed");
        }
        if (Math.abs(totalSoilDropped - availableSoil) > 1e-10) {
            throw new Error("should've dropped all our available soil but didn't");
        }
        return availableSoil;
    } else {
        // fill all soil and return how much soil is remaining
        for (const v of vertices) {
            // this should put it right at targetHeight
            geom.vertices[v.y * height + v.x].y += v.z;
            if (geom.vertices[v.y * height + v.x].y < targetHeight - 1e-5) {
                throw new Error(`didn't hit targetHeight: actual ${geom.vertices[v.y * height + v.x].y}, expected ${targetHeight}`);
            }
            availableSoil -= v.z;
        }
        if (availableSoil < 0) {
            throw new Error("deposited more soil than we had");
        }
        return availableSoil;
    }
}

const gradXY = new THREE.Vector2();
const gradX1Y = new THREE.Vector2();
const gradX1Y1 = new THREE.Vector2();
const gradXY1 = new THREE.Vector2();
function bilinearSlope(vec: THREE.Vector2, geom: THREE.Geometry, x: number, y: number) {
    const ix = Math.floor(x),
            iy = Math.floor(y),
            ix1 = ix + 1,
            iy1 = iy + 1,
            fx = x - ix,
            fy = y - iy;
    gridGradient(gradXY, geom, ix, iy);
    gridGradient(gradX1Y, geom, ix1, iy);
    gridGradient(gradX1Y1, geom, ix1, iy1);
    gridGradient(gradXY1, geom, ix, iy1);

    // upper horizontal
    gradXY.lerp(gradX1Y, fx);
    // lower horizontal
    gradXY1.lerp(gradX1Y1, fx);
    // vertical
    const grad = gradXY.lerp(gradXY1, fy);

    vec.copy(grad);
}

function gridGradient(vec: THREE.Vector2, geom: THREE.Geometry, x: number, y: number) {
    if (x < 1 || y < 1 || x > height - 2 || y > height - 2) {
        throw new Error("out of bounds gradient!");
    }
    const h01 = geom.vertices[y * height + (x - 1)].y;
    const h21 = geom.vertices[y * height + (x + 1)].y;
    const h11 = geom.vertices[y * height + x].y;
    const h10 = geom.vertices[(y - 1) * height + x].y;
    const h12 = geom.vertices[(y + 1) * height + x].y;

    vec.set(-(h21 - h01) / 2, -(h12 - h10) / 2);

    // // second order symmetric derivative
    // const dx = h01 + h21 - 2 * h11;
    // const dy = h10 + h12 - 2 * h11;
    // vec.set(-dx, -dy);
}

function bilinearGet(geom: THREE.Geometry, x: number, y: number) {
    if (x < 0 || y < 0 || x > height - 1 || y > height - 1) {
        throw new Error("out of bounds");
    }
    const ix = Math.floor(x),
            iy = Math.floor(y),
            ix1 = ix + 1,
            iy1 = iy + 1,
            fx = x - ix,
            fy = y - iy;
    const hxy = geom.vertices[iy * height + ix].y;
    const hx1y = geom.vertices[iy * height + ix1].y;
    const hx1y1 = geom.vertices[iy1 * height + ix1].y;
    const hxy1 = geom.vertices[iy1 * height + ix].y;

    const hFromY0X0X1 = THREE.Math.lerp(hxy, hx1y, fx);
    const hFromY1X0X1 = THREE.Math.lerp(hxy1, hx1y1, fx);
    const hInterpolated = THREE.Math.lerp(hFromY0X0X1, hFromY1X0X1, fy);
    return hInterpolated;
}
