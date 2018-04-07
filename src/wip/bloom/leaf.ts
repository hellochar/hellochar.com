import * as THREE from "three";

import { Component } from "./component";

export interface LeafParameters {
    petioleLength: number;
    innerColor: THREE.Color;
    outerColor: THREE.Color;
    perimeter: (theta: number) => THREE.Vector3;
    realtimeDroop: boolean;
    shapeVertices?: (vertex: THREE.Vector3) => void,
    shapeGeometry?: (geometry: THREE.Geometry) => void,
    noisyEdge: boolean;
}

// would be nice to emulate both succulents, and flat leaves, broad, thin, curly.
export class Leaf extends Component {
    public lamina: THREE.Mesh;
    constructor(public parameters: LeafParameters) {
        super();
        const { petioleLength, innerColor, outerColor, perimeter, realtimeDroop, shapeGeometry, shapeVertices, noisyEdge } = parameters;
        const material = new THREE.MeshLambertMaterial({
            // color: innerColor,
            // color: new THREE.Color("rgb(252, 161, 222)"),
            vertexColors: THREE.FaceColors,
            side: THREE.DoubleSide,
            // wireframe: true,
        });
        if (petioleLength > 0) {
            const petiole = (() => {
                // const geom = new THREE.PlaneGeometry(1, 0.1);
                const mat = new THREE.MeshLambertMaterial({
                    color: innerColor,
                    side: THREE.DoubleSide,
                });
                const geom = new THREE.BoxBufferGeometry(petioleLength, 0.01, 0.04);
                // geom.rotateX(-Math.PI / 2);
                geom.translate(petioleLength / 2, 0, 0);
                const mesh = new THREE.Mesh(
                    geom,
                    mat,
                );
                mesh.castShadow = true;
                mesh.receiveShadow = true;
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
                // const vertex = Leaf.leafPerimeter2(theta);
                const vertex = perimeter(theta);
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
                // TODO droop shouldn't be handled here, it should be an iterative solution
                // that changes in real time
                if (shapeVertices != null) {
                    shapeVertices(vertex);
                }
                if (noisyEdge) {
                    vertex.x += Math.random() * 0.01 - 0.005;
                    vertex.y += Math.random() * 0.01 - 0.005;
                    vertex.z += Math.random() * 0.01 - 0.005;
                }
            }
            // color faces
            for (const face of geometry.faces) {
                const {x, y, z} = geometry.vertices[face.c];
                const dist = Math.sqrt(x*x + y*y + z*z);
                // const color = new THREE.Color("rgb(135, 27, 32)").lerp(new THREE.Color("rgb(245, 255, 73)"), Math.min(1, dist));
                const color = innerColor.clone().lerp(outerColor, Math.min(1, dist));
                face.color = color;
            }
            geometry.verticesNeedUpdate = true;
            if (shapeGeometry) {
                shapeGeometry(geometry);
            }

            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            geometry.mergeVertices();

            const mesh = new THREE.Mesh(
                geometry,
                material,
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        })();
        lamina.position.x = petioleLength;
        // lamina.position.y = 0.04;
        this.add(lamina);
    }

    updateSelf(time: number) {
        time *= 10;
        if (this.parameters.realtimeDroop) {
            const geom = this.lamina.geometry as THREE.Geometry;
            for (const vertex of geom.vertices) {
                const oldY = vertex.y;
                const { x, z } = vertex;
                const dist2 = x * x + z * z;
                const unDroop = dist2 / (2.7 + time * 0.0001) - dist2 * dist2 / 10;
                const y = unDroop;
                vertex.y = unDroop;
                const yDist = y - oldY;
                vertex.x *= 1 - yDist / 4;
                vertex.z *= 1 - yDist / 4;
            }
            geom.verticesNeedUpdate = true;
            geom.computeVertexNormals();
            geom.computeFaceNormals();
        }
    }

    // cardate
    static leafPerimeter1 = (theta: number) => {
        const r = (3 + 3 * Math.cos(theta) + 1 / (0.1 + Math.pow(Math.sin(theta / 2), 2))) / 16;

        // leaves droop far away
        // const droop = r * r;
        // const y = -droop;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        return new THREE.Vector3(x, 0, z);
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
        // nice green thing
        return new Leaf({
            petioleLength: 0.5,
            perimeter: Leaf.leafPerimeter1,
            realtimeDroop: false,
            shapeVertices: (vertex) => {
                const {x, y, z} = vertex;
                const r2 = x * x + z * z;
                const droop = -Math.abs(z) / 3 + r2 / 5;
                vertex.y -= droop;
            },
            shapeGeometry: (geom) => {
                geom.scale(1, 1, 0.5);
            },
            innerColor: new THREE.Color("rgb(165, 190, 63)"),
            outerColor: new THREE.Color("rgb(165, 190, 63)"),
            noisyEdge: false,
        });
    }
}
