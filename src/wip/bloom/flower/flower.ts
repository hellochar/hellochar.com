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
        const s = logistic(logisticX) * 3;
        // const s = 1;
        this.scale.setScalar(s);
    }

    static generate() {
        return new Flower(Perianth.generate(), Reproductive.generate());
    }
}
