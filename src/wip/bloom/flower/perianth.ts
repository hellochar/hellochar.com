import { Component, ComponentClass } from "../component";
import Calyx from "./calyx";
import Corolla from "./corolla";

export default class Perianth extends Component {
    public constructor(public calyx: Calyx, public corolla: Corolla) {
        super();
        this.add(calyx);
        this.add(corolla);
        corolla.position.y = 0.015;
        calyx.position.y = -0.015;
    }
    static generate() {
        return new Perianth(Calyx.generate(), Corolla.generate());
    }
}
