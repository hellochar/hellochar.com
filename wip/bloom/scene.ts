import * as THREE from "three";

export class BloomScene extends THREE.Scene {
    /**
     * Inclination angle of the sun/moon in the sky. 0 = right at the horizon, Math.PI/2 = at the top
     */
    private theta = Math.PI / 2 * 0.8;
    /**
     * xz angle.
     */
    private phi = Math.PI / 2;

    private distance = 110;

    public nightTime = Math.random() < 0.1;

    public sky = (() => {
        const sky = new THREE.Sky();
        sky.scale.setScalar(25);
        const uniforms = sky.material.uniforms;
        // turbidity affects how brightly the sun/moon shines. You want turbidity ~8 for nighttime.
        uniforms.turbidity.value = 1;
        // rayleigh is the big thing that affects "daytime" or "nighttime". rayleigh 0 = full night, rayleigh 1 = full day
        uniforms.rayleigh.value = 0.8;
        // uniforms.rayleigh.value = 0.0;
        // how bright the sun's light halo is
        // 0.1 = all light on the sun
        // 0 = no halo; sunlight is distributed to the "ground"
        uniforms.mieCoefficient.value = 0.008;
        // how focused the sun halo is.
        // 0 = halo is dispersed across whole top hemisphere
        // 0.95 = halo is pretty focused
        uniforms.mieDirectionalG.value = 0.87;

        // how bright the whole scene is;
        // 0.1 = extremely brightened (like we pow things by 0.1)
        // 1 = normal
        uniforms.luminance.value = 1.01;

        sky.material.uniforms.sunPosition.value.set(
            this.distance * Math.cos(this.phi),
            this.distance * Math.sin(this.phi) * Math.sin(this.theta),
            this.distance * Math.sin(this.phi) * Math.cos(this.theta),
        );

        if (this.nightTime) {
            // turbidity affects how brightly the sun/moon shines. You want turbidity ~8 for nighttime.
            uniforms.turbidity.value = 5;
            // rayleigh is the big thing that affects "daytime" or "nighttime". rayleigh 0 = full night, rayleigh 1 = full day
            uniforms.rayleigh.value = 0.0;

            uniforms.mieCoefficient.value = 0.012;
            uniforms.mieDirectionalG.value = 0.70;
        }

        this.add(sky);
        return sky;
    })();

    public ground = (() => {
        const groundGeom = new THREE.CircleBufferGeometry(8, 120);
        groundGeom.rotateX(-Math.PI / 2);
        const ground = new THREE.Mesh(groundGeom, new THREE.MeshLambertMaterial({
            color: new THREE.Color("rgb(220, 220, 231)"),
            dithering: true,
        }));
        ground.receiveShadow = true;
        this.add(ground);
        return ground;
    })();

    public hemisphereLight = (() => {
        const light = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(60, 60, 80)", 0.3);
        this.add(light);
        return light;
    })();

    public ambientLight = (() => {
        const light = new THREE.AmbientLight("rgb(173, 216, 230)", 0.4);
        this.add(light);
        return light;
    })();

    public spotLight = (() => {
        const spotLight = new THREE.SpotLight(
            "rgb(234, 249, 244)",
            1.3,
            200,
            Math.PI / 30,
            1.0,
            1.25,
        );
        spotLight.position.copy(this.sky.material.uniforms.sunPosition.value);

        spotLight.castShadow = true;

        spotLight.shadow.mapSize.width = 2048 * 2;
        spotLight.shadow.mapSize.height = 2048 * 2;

        spotLight.shadow.bias = 0.000;
        spotLight.shadow.radius = 1.5; // 1 is normal; 1.5 makes it a bit blurrier
        spotLight.shadow.camera.near = 90;
        spotLight.shadow.camera.far = 101;
        spotLight.shadow.camera.fov = 12;
        spotLight.shadow.camera.updateProjectionMatrix();

        this.add(spotLight);
        return spotLight;
    })();

    public particles = (() => {
        const geom = new THREE.Geometry();
        for (let i = 0; i < 10000; i++) {
            const vertex = new THREE.Vector3(Math.random() * 30 - 15, Math.random() * 30, Math.random() * 30 - 15);
            vertex.multiplyScalar(0.25);
            geom.vertices.push(vertex);
        }
        geom.verticesNeedUpdate = true;
        const points = new THREE.Points(
            geom,
            new THREE.PointsMaterial({
                color: "rgb(249, 237, 69)",
                transparent: true,
                opacity: 0.25,
                size: 0.01,
                sizeAttenuation: true,
            }),
        );
        // points.castShadow = true;
        this.add(points);
        return points;
    })();

    public rocks = (() => {
        const geom = new THREE.SphereGeometry(1, 4, 4);
        geom.vertices.forEach((v) => {
            v.x += Math.random() * 0.2 - 0.1;
            v.y += Math.random() * 0.2 - 0.1;
            v.z += Math.random() * 0.2 - 0.1;
        });
        geom.verticesNeedUpdate = true;
        geom.computeFaceNormals();
        geom.computeFlatVertexNormals();

        const material = new THREE.MeshLambertMaterial({
            color: "gray",
            side: THREE.DoubleSide,
            flatShading: true,
        });

        const rocks: THREE.Mesh[] = [];
        for (let i = 0; i < 20; i++) {
            const mesh = new THREE.Mesh(geom, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const radius = THREE.Math.randFloat(1, 5);
            const angle = THREE.Math.randFloat(0, Math.PI * 2);
            mesh.scale.setScalar(0.1);
            mesh.scale.x *= Math.pow(2, THREE.Math.randFloat(0.5, 2));
            mesh.scale.z *= Math.pow(2, THREE.Math.randFloat(0.7, 1.2));
            mesh.position.x = radius * Math.cos(angle);
            mesh.position.z = radius * Math.sin(angle);
            mesh.position.y = THREE.Math.randFloat(-0.03, 0.03);
            this.add(mesh);
            rocks.push(mesh);
        }
        return rocks;
    })();

    constructor() {
        super();
    }

    setTimeOfDay(t: number) {
        this.theta = THREE.Math.mapLinear(t, 0.0, 0.99, 0, Math.PI);

        // if (theta > Math.PI) {
        //     spotLight.intensity = 0;
        // }

        let sunlightScalar = Math.min(1, Math.exp(Math.max(0, Math.sin(this.theta) * 4)) - 1);
        if (this.nightTime) {
            sunlightScalar *= 0.33;
        }
        // console.log(sunlightScalar);
        // const sunlightScalar = 1;
        this.spotLight.intensity = 0.3 + 1 * sunlightScalar;
        this.ambientLight.intensity = 0.2 + 0.2 * sunlightScalar;
        this.hemisphereLight.intensity = 0.15 + 0.15 * sunlightScalar;
        // const rayleigh = THREE.Math.mapLinear(Math.sin(theta), 0, 1, ;
        this.sky.material.uniforms.sunPosition.value.set(
            this.distance * Math.cos(this.phi),
            this.distance * Math.sin(this.phi) * Math.sin(this.theta),
            this.distance * Math.sin(this.phi) * Math.cos(this.theta),
        );
        this.spotLight.position.copy(this.sky.material.uniforms.sunPosition.value);
    }
}
