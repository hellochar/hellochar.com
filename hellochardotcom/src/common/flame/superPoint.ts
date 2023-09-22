import * as THREE from "three";

import { applyBranch, Branch } from "./branch";
import { VARIATIONS } from "./transforms";
import { UpdateVisitor } from "./updateVisitor";

const tempPoint = new THREE.Vector3();
const tempColor = new THREE.Color();

export class SuperPoint {
    public children?: SuperPoint[];
    public lastPoint: THREE.Vector3 = new THREE.Vector3();
    private static globalSubtreeIterationIndex = 0;

    constructor(
        public point: THREE.Vector3,
        public color: THREE.Color,
        public rootGeometry: THREE.Geometry,
        public branches: Branch[],
    ) {
        this.lastPoint.copy(point);
        rootGeometry.vertices.push(point);
        rootGeometry.colors.push(color);
    }

    public updateSubtree(depth: number, shouldLerp: boolean, ...visitors: UpdateVisitor[]) {
        if (depth === 0) { return; }

        if (this.children === undefined) {
            this.children = this.branches.map(() => {
                return new SuperPoint(
                    new THREE.Vector3(),
                    new THREE.Color(0, 0, 0),
                    this.rootGeometry,
                    this.branches,
                );
            });
        }

        for (let idx = 0, l = this.children.length; idx < l; idx++) {
            SuperPoint.globalSubtreeIterationIndex++;
            const child = this.children[idx];
            const branch = this.branches[idx];
            // reset the child's position to your updated position so it's ready to get stepped
            child.lastPoint.copy(child.point);

            tempColor.copy(this.color);
            if (shouldLerp) {
                tempPoint.copy(this.point);
                applyBranch(branch, tempPoint, tempColor);
                child.point.lerp(tempPoint, 0.8);
            } else {
                child.point.copy(this.point);
                applyBranch(branch, child.point, tempColor);
            }
            child.color.lerp(tempColor, 0.75);

            // take far away points and move them into the center again to keep points from getting too out of hand
            if (child.point.lengthSq() > 50 * 50) {
                VARIATIONS.Spherical(child.point);
            }

            if (SuperPoint.globalSubtreeIterationIndex % 307 === 0) {
                for (const v of visitors) {
                    v.visit(child);
                }
            }

            child.updateSubtree(depth - 1, shouldLerp, ...visitors);
        }
    }

    public recalculate(
        initialX: number,
        initialY: number,
        initialZ: number,
        depth: number,
        shouldLerp: boolean,
        ...visitors: UpdateVisitor[]) {
        SuperPoint.globalSubtreeIterationIndex = 0;
        this.point.set(initialX, initialY, initialZ);
        // console.time("updateSubtree");
        this.updateSubtree(depth, shouldLerp, ...visitors);
        // console.timeEnd("updateSubtree");
        this.rootGeometry.verticesNeedUpdate = true;
    }
}
