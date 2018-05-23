import { logistic } from "../../../math";
import { Component, ComponentClass } from "../component";
import Perianth from "./perianth";
import Reproductive from "./reproductive";

export default class Flower extends Component {
    public constructor(public perianth: Perianth, public reproductive: Reproductive) {
        super();
        this.add(perianth);
        this.add(reproductive);
    }

    updateSelf(t: number) {
        const timeAlive = t - this.timeBorn;
        const logisticX = timeAlive / 2000 - 6;
        // HACKHACK scale by 15
        const s = logistic(logisticX) * 8;
        // const s = 1;
        this.scale.set(s, s, s);
    }

    static generate() {
        return new Flower(Perianth.generate(), Reproductive.generate());
    }
}
