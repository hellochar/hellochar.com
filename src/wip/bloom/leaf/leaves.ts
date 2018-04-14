import { Leaf } from ".";
import { Component } from "../component";
import dna from "../dna";
import { Whorl } from "../whorl";

export default class Leaves extends Component {
    public constructor(public whorl: Whorl<Leaf>) {
        super();
        this.add(whorl);
    }

    static generate() {
        const whorl = Whorl.generate({
            num: 6,
            startZRot: Math.PI / 6,
            endZRot: Math.PI / 6,
            startYRot: 0,
            endYRot: Math.PI * 2,
            endScale: 0.5,
            startScale: 0.5,
            generate: () => Leaf.generate(dna.leafTemplate),
            isBilateral: false,
        });
        return new Leaves(whorl);
    }
}
