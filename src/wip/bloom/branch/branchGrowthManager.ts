import * as THREE from "three";

import { Branch } from "./branch";

// export class BranchGrowthManager {
//     constructor(public branch: Branch, public skeleton: BoneSkeleton) {
//         // const bones = skeleton.bones;
//         // for (const bone of bones) {
//         //     // Every bone is a direct child of the previous (like a linked list).
//         //     // We set to 0.1 by default which basically looks like nothing.
//         //     // be careful - we can't set it too small or else we'll hit floating point
//         //     // precision errors (100 branches stacked on top of each other means a world scale
//         //     // of 1e-100 which is unexpressible)

//         //     bone.scale.set(0.1, 0.1, 0.1);

//         //     // bone.rotation.y = Math.random() * Math.PI * 2;
//         //     // bone.rotation.z = 0.2;
//         // }
//     }
// }
