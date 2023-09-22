import { Transform } from "./transforms";

export interface Branch {
    color: THREE.Color;
    affine: Transform;
    variation: Transform;
}

/**
 * @param branch branch to apply
 * @param point point to apply to
 * @param color color to apply to
 */
export function applyBranch(branch: Branch, point: THREE.Vector3, color: THREE.Color) {
    // apply the affine transform to the point
    branch.affine(point);

    // apply the nonlinear variation to the point
    branch.variation(point);

    // interpolate towards the affine color
    // color.lerp(affine.color, 0.5);
    color.add(branch.color);
}
