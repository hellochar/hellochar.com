import * as THREE from "three";

import { Component } from "../component";

export default class Carpel extends Component {
    static ovaryMeshTemplate = (() => {
        const geom = new THREE.SphereBufferGeometry(0.05);
        const material = new THREE.MeshLambertMaterial({
            color: "darkgreen",
        });
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    })();

    static styleMeshTemplate = (() => {
        const styleHeight = THREE.Math.randFloat(0.3, 0.8);
        const geom = new THREE.CylinderGeometry(1, 1, styleHeight, 20, 20);
        geom.translate(0, styleHeight / 2, 0);
        for (const vertex of geom.vertices) {
            const y = THREE.Math.mapLinear(vertex.y, 0, styleHeight, 0, 1);
            const r =
                0.005
                + 0.04 * 2 / (1 + Math.exp(20 * y * y))
                + 0.005 * 2 / (1 + Math.exp(20 * (1 - y)));
            vertex.x *= r;
            vertex.z *= r;
        }
        geom.verticesNeedUpdate = true;
        const material = new THREE.MeshLambertMaterial({
            // TODO better random color
            color: "white",
        });
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    })();

    static stigmaMeshTemplate = (() => {
        // take a sphere and then depress it
        const geom = new THREE.SphereGeometry(0.02, 80, 20);
        geom.scale(1, 0.3, 1);
        for (const vertex of geom.vertices) {
            // normalize it into the unit sphere
            const x = THREE.Math.mapLinear(vertex.x, 0, 0.02, 0, 1);
            const z = THREE.Math.mapLinear(vertex.z, 0, 0.02, 0, 1);
            const dist2FromYAxis = x * x + z * z;
            const yTranslate =
                -0.005 * 2 / (1 + Math.exp(15 * dist2FromYAxis))
                - 0.005 * 2 / (1 + Math.exp(5 * (1 - dist2FromYAxis)))
            const yAngle = Math.atan2(z, x);
            // const rScale = (1 + 1.0 * Math.pow(Math.cos(yAngle / 2 * 3), 2)) / 2;
            const rScale = 1;
            vertex.x *= rScale;
            vertex.z *= rScale;
            vertex.y += yTranslate;
        }
        geom.verticesNeedUpdate = true;
        geom.computeFaceNormals();
        geom.computeVertexNormals();
        const material = new THREE.MeshLambertMaterial({
            color: "white",
        });
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    })();

    public ovary: (typeof Carpel)["ovaryMeshTemplate"];
    public style: (typeof Carpel)["styleMeshTemplate"];
    public stigma: (typeof Carpel)["stigmaMeshTemplate"];

    constructor() {
        super();
        this.ovary = Carpel.ovaryMeshTemplate.clone();
        this.add(this.ovary);
        this.style = Carpel.styleMeshTemplate.clone();
        this.ovary.add(this.style);
        this.stigma = Carpel.stigmaMeshTemplate.clone();
        this.style.add(this.stigma);
        this.stigma.position.y = 0.5 + 0.005;
    }
    static generate() {
        return new Carpel();
    }
}
