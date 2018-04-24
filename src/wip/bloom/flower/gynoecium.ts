import { Component, ComponentClass } from "../component";
import { Whorl } from "../whorl";
import Carpel from "./carpel";

export default class Gynoecium extends Component {
    public constructor(public carpels: Whorl<Carpel>) {
        super();
        this.add(carpels);
    }

    static generate() {
        // const whorl = Whorl.generate({
        //     num: 1,
        //     startScale: 1,
        //     endScale: 1,
        //     startYRot: 0,
        //     endYRot: 0,
        //     startZRot: Math.PI / 2,
        //     endZRot: Math.PI / 2,
        //     generate: Carpel.generate,
        //     isBilateral: false,
        // });
        const whorl = new Whorl([Carpel.generate()]);
        return new Gynoecium(whorl);
    }
}
