import * as THREE from "three";

import { Component } from "./component";

export class Leaf extends Component {
    public lamina: THREE.Mesh;
    constructor(petioleLength = 0) {
        super();
        const material = new THREE.MeshLambertMaterial({
            // color: new THREE.Color("rgb(165, 190, 63)"),
            // color: new THREE.Color("rgb(252, 161, 222)"),
            vertexColors: THREE.FaceColors,
            side: THREE.DoubleSide,
            // wireframe: true,
        });
        if (petioleLength > 0) {
            const petiole = (() => {
                // const geom = new THREE.PlaneGeometry(1, 0.1);
                const geom = new THREE.BoxBufferGeometry(petioleLength, 0.01, 0.04);
                // geom.rotateX(-Math.PI / 2);
                geom.translate(petioleLength / 2, 0, 0);
                const mesh = new THREE.Mesh(
                    geom,
                    material,
                );
                mesh.castShadow = true;
                // mesh.receiveShadow = true;
                return mesh;
            })();
            this.add(petiole);
        }
        const lamina = this.lamina = (() => {
            // const geometry = new THREE.Geometry();
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            for (let i = 0; i < 100; i++) {
                const theta = (i + 50) / 100 * Math.PI * 2;
                // const vertex = Leaf.leafPerimeter1(theta);
                const vertex = Leaf.leafPerimeter2(theta);
                shape.lineTo(vertex.x, vertex.z);
                // geometry.vertices.push(vertex);
            }
            // geometry.colorsNeedUpdate = true;
            // geometry.verticesNeedUpdate = true;
            // for (let i = 2; i < 100; i++) {
            //     const face = new THREE.Face3(0, i - 1, i);
            //     const color = Math.random() < 0.5 ? new THREE.Color(0xffffff) : new THREE.Color("rgb(252, 161, 222)");
            //     face.color = color;
            //     geometry.faces.push(face);
            // }
            // // correct global y offset from the perimeter function
            // const yOffset = geometry.vertices[geometry.vertices.length / 2].y;
            // geometry.translate(0, -yOffset, 0);

            // geometry.computeFaceNormals();
            // geometry.computeVertexNormals();
            // geometry.mergeVertices();

            // const geometry = new THREE.ShapeGeometry(shape, 40);
            const geometry = new THREE.ExtrudeGeometry(shape, {
                curveSegments: 12,
                steps: 1,
                amount: 0.001,
                bevelThickness: 0.005,
                bevelSize: 0.3,
                bevelSegments: 1,
            });
            geometry.rotateX(-Math.PI / 2);
            geometry.translate(0.3 + 0.1, 0, 0); // translate bevelSize
            for (const vertex of geometry.vertices) {
                const { x, z } = vertex;
                const dist2 = x * x + z * z;
                // const unDroop = dist2 / 1.2 - dist2 * dist2 / 7;
                const unDroop = Math.sqrt(dist2) * 1 - dist2 / 2.45;
                const y = unDroop;
                vertex.x *= 1 - unDroop / 2;
                vertex.z *= 1 - unDroop / 2;
                vertex.y += y;
                vertex.x += Math.random() * 0.01 - 0.005;
                vertex.y += Math.random() * 0.01 - 0.005;
                vertex.z += Math.random() * 0.01 - 0.005;
            }
            for (const face of geometry.faces) {
                const {x, y, z} = geometry.vertices[face.c];
                const dist = Math.sqrt(x*x + y*y + z*z);
                const color = new THREE.Color("rgb(135, 27, 32)").lerp(new THREE.Color("rgb(245, 255, 73)"), Math.min(1, dist));
                face.color = color;
            }
            geometry.verticesNeedUpdate = true;
            geometry.scale(0.6, 0.6, 0.6);
            geometry.rotateZ(-Math.PI / 6);
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            geometry.mergeVertices();

            const mesh = new THREE.Mesh(
                geometry,
                material,
            );
            // material.wireframe = true;
            mesh.castShadow = true;
            // mesh.receiveShadow = true;
            return mesh;
        })();
        lamina.position.x = petioleLength;
        lamina.position.y = 0.04;
        this.add(lamina);
    }

    updateSelf(time: number) {
        // const geom = this.lamina.geometry as THREE.Geometry;
        // for (const vertex of geom.vertices) {
        //     const oldY = vertex.y;
        //     const { x, z } = vertex;
        //     const dist2 = x * x + z * z;
        //     const unDroop = dist2 / (1.2 + time * 0.0001) - dist2 * dist2 / 100;
        //     const y = unDroop;
        //     vertex.y = unDroop;
        //     const yDist = y - oldY;
        //     vertex.x *= 1 - yDist / 2;
        //     vertex.z *= 1 - yDist / 2;
        // }
        // geom.verticesNeedUpdate = true;
        // geom.computeVertexNormals();
        // geom.computeFaceNormals();
    }

    // cardate
    static leafPerimeter1 = (theta: number) => {
        const r = (3 + 3 * Math.cos(theta) + 1 / (0.1 + Math.pow(Math.sin(theta / 2), 2))) / 16;

        // leaves droop far away
        const droop = r * r;
        const y = -droop;

        // const modifiedR = r - y;
        // const modifiedR = Math.sqrt(1 - y * y);
        const modifiedR = r;
        const x = modifiedR * Math.cos(theta);
        const z = modifiedR * Math.sin(theta);
        return new THREE.Vector3(x, y, z);
    }

    // obovate-ish
    static leafPerimeter2 = (theta: number) => {
        // ranges from -0.4 to +0.6, we want to translate in x +0.4
        const r = (1 + Math.cos(theta) + 4 / (1 + Math.pow(Math.cos(theta - Math.PI / 2), 2))) / 10;
        const x = r * Math.cos(theta) + 0.4;
        const z = r * Math.sin(theta);
        const dist2 = x * x + z * z;
        const unDroop = Math.pow(x, 5);
        const y = unDroop;
        return new THREE.Vector3(x, y, z);
    }

    static generate() {
        return new Leaf();
    }
}
