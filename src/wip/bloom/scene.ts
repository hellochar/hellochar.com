import * as THREE from "three";

const SHOW_HELPERS = true;

const scene = new THREE.Scene();

const groundGeom = new THREE.PlaneGeometry(100, 100, 100, 100);
groundGeom.rotateX(-Math.PI / 2);
const ground = new THREE.Mesh(groundGeom, new THREE.MeshLambertMaterial({
    // color: new THREE.Color("rgb(45, 29, 3)"),
    color: new THREE.Color("rgb(220, 220, 231)"),
    dithering: true,
}));
ground.receiveShadow = true;
scene.add(ground);
if (SHOW_HELPERS) {
    scene.add(new THREE.AxesHelper(10));
}

const hemisphereLight = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(60, 60, 80)", 0.3);
// const light = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(210, 250, 255)", 0.3);
scene.add(hemisphereLight);

const ambientLight = new THREE.AmbientLight("rgb(173, 216, 230)", 0.4);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(
    "rgb(234, 249, 244)",
    1.1,
    200,
    Math.PI / 10,
    1.0,
    1,
);
spotLight.position.set(10, 100, 10);

spotLight.castShadow = true;

spotLight.shadow.mapSize.width = 2048 * 2;
spotLight.shadow.mapSize.height = 2048 * 2;

spotLight.shadow.bias = -0.001; // try not to make leaves self-shadow
spotLight.shadow.radius = 1.5; // 1 is normal; 1.5 makes it a bit blurrier
spotLight.shadow.camera.near = 70;
spotLight.shadow.camera.far = 110;
spotLight.shadow.camera.fov = 12;
spotLight.shadow.camera.updateProjectionMatrix();

scene.add(spotLight);

if (SHOW_HELPERS) {
    const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    scene.add(spotLightHelper);

    const shadowCameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
    scene.add(shadowCameraHelper);
}

const particles = (() => {
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
    return points;
})();
scene.add(particles);

export default scene;
