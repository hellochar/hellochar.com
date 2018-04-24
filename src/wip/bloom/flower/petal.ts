import { dna } from "../dna";
import { LeafOld } from "../leaf/leafOld";

// hack extend Leaf for now
export default class Petal extends LeafOld {
    constructor() {
        super({
            realtimeDroop: true,
            shapeVertices: (vertex) => {
                const { x, z } = vertex;
                const dist2 = x * x + z * z;
                // const unDroop = dist2 / 1.2 - dist2 * dist2 / 7;

                // nice for those deep blues in the screenshot
                const unDroop = Math.abs(z) / 2;

                // looks good for large yellow broad flowers
                // const unDroop = Math.sqrt(dist2) * 1 - dist2 / 2.45;
                const y = unDroop;
                vertex.x *= 1 - unDroop / 4;
                vertex.z *= 1 - unDroop / 4;
                vertex.y += y;
            },
            shapeGeometry: (geometry) => {
                // TODO scale such that the entire leaf is size 1
                geometry.scale(0.6, 0.6, 0.6);
                // TODO change rotation
                geometry.rotateZ(-Math.PI / 6);
                geometry.scale(1, 1, 0.5);
            },
            noisyEdge: true,
            innerColor: dna.colors.petalInnerColor,
            outerColor: dna.colors.petalOuterColor,
            // innerColor: new THREE.Color("rgb(255, 235, 107)"),
            // outerColor: new THREE.Color("rgb(255, 131, 22)"),
            perimeter: LeafOld.leafPerimeter2,
            petioleLength: 0,
        });
    }

    static generate() {
        return new Petal();
    }
}
