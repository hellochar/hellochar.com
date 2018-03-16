import * as THREE from "three";

import { applyBranch, Branch } from "./branch";
import { VARIATIONS } from "./transforms";
import { UpdateVisitor } from "./updateVisitor";

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

    public updateSubtree(depth: number, ...visitors: UpdateVisitor[]) {
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
            child.point.copy(this.point);
            child.color.copy(this.color);
            applyBranch(branch, child.point, child.color);

            // take far away points and move them into the center again to keep points from getting too out of hand
            if (child.point.lengthSq() > 50 * 50) {
                VARIATIONS.Spherical(child.point);
            }

            if (SuperPoint.globalSubtreeIterationIndex % 307 === 0) {
                for (const v of visitors) {
                    v.visit(child);
                }
            }

            child.updateSubtree(depth - 1, ...visitors);
        }
    }

    public recalculate(
        initialX: number,
        initialY: number,
        initialZ: number,
        depth: number,
        ...visitors: UpdateVisitor[]) {
        SuperPoint.globalSubtreeIterationIndex = 0;
        this.point.set(initialX, initialY, initialZ);
        // console.time("updateSubtree");
        this.updateSubtree(depth, ...visitors);
        // console.timeEnd("updateSubtree");
        this.rootGeometry.verticesNeedUpdate = true;
    }
}
