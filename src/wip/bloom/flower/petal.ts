import { logistic } from "../../../math";
import { Component } from "../component";
import { dna } from "../dna";
import { LeafOld } from "../leaf/leafOld";
import { LeafTemplate } from "../veinMesh/leafTemplate";

export default class Petal extends Component {
    public mesh: THREE.SkinnedMesh;
    constructor(template: LeafTemplate) {
        super();
        // // can't really do this yet
        // noisyEdge: true,

        this.mesh = template.instantiateLeaf();
        this.add(this.mesh);
    }

    updateSelf(t: number) {
        const logisticX = (t - this.timeBorn) / 1000 - 6;
        const s = logistic(logisticX);
        // const s = 1;
        this.scale.set(s, s, s);
    }

    static generate(template: LeafTemplate) {
        return new Petal(template);
    }
}
