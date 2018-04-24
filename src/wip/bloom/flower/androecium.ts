import { Component, ComponentClass } from "../component";
import { Whorl } from "../whorl";
import Stamen from "./stamen";

export default class Androecium extends Component {
    public constructor(public stamens: Whorl<Stamen>) {
        super();
        this.add(stamens);
    }

    static generate() {
        const stamens = Whorl.generate({
            num: 3,
            endScale: 0.2,
            startScale: 0.5,
            startYRot: 0,
            endYRot: Math.PI,
            startZRot: 0,
            endZRot: 0,
            isBilateral: true,
            generate: Stamen.generate,
        })
        return new Androecium(stamens);
    }
}
