import * as THREE from "three";

const SHOW_HELPERS = false;

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

const light = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(60, 60, 80)", 0.6);
// const light = new THREE.HemisphereLight("rgb(173, 216, 230)", "rgb(210, 250, 255)", 0.3);
scene.add(light);

const spotLight = new THREE.SpotLight(
    "rgb(234, 249, 244)",
    1.2,
    200,
    Math.PI / 10,
    1.0,
    1,
);
spotLight.position.set(10, 100, 10);

spotLight.castShadow = true;

spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;

spotLight.shadow.camera.near = 50;
spotLight.shadow.camera.far = 150;
spotLight.shadow.camera.fov = 10;

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
