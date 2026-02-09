import * as THREE from "three";

import lazy from "../../../../common/lazy";
import { season } from "../../season";
import { Component } from "../component";

const styleHeight = THREE.Math.randFloat(0.3, 0.8) + Math.random() * Math.random() * Math.random();

export default class Carpel extends Component {
    static ovaryMeshTemplate = lazy(() => {
        const geom = new THREE.SphereBufferGeometry(0.05);
        const material = new THREE.MeshLambertMaterial({
            color: "darkgreen",
        });
        const mesh = new THREE.Mesh(geom, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    });

    static styleMeshTemplate = lazy(() => {
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
    });

    static stigmaMeshTemplate = lazy(() => {
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

        const color = new THREE.Color(`hsl(${THREE.Math.randInt(0, 60)}, 100%, ${THREE.Math.randInt(75, 100)}%)`);
        const stigmaMaterial = new THREE.MeshLambertMaterial({
            color,
        });

        const bufferGeom = new THREE.BufferGeometry().fromGeometry(geom);

        const mesh = new THREE.Mesh(bufferGeom, stigmaMaterial);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    });

    public ovary: THREE.Mesh;
    public style: THREE.Mesh;
    public stigma: THREE.Mesh;

    constructor() {
        super();
        this.ovary = Carpel.ovaryMeshTemplate().clone();
        this.ovary.scale.setScalar(0.001);
        this.add(this.ovary);
        this.style = Carpel.styleMeshTemplate().clone();
        this.ovary.add(this.style);
        this.stigma = Carpel.stigmaMeshTemplate().clone();
        this.style.add(this.stigma);
        this.stigma.position.y = styleHeight + 0.005;
    }

    private styleGrowStart = 0.25 * THREE.Math.randFloat(0.8, 1.2);
    private styleGrowEnd = 0.75 * THREE.Math.randFloat(0.9, 1.1);

    updateSelf(ms: number) {
        if (season.type === "growing") {
            this.style.scale.setScalar(0.001);
        }
        this.ovary.scale.lerp(new THREE.Vector3(1, 1, 1), 0.001);
        if (season.type === "flowering") {
            const styleScale = THREE.Math.smootherstep(season.percent, this.styleGrowStart, this.styleGrowEnd) * 0.99 + 0.01;
            this.style.scale.setScalar(styleScale);
        }
    }

    static generate() {
        return new Carpel();
    }
}
