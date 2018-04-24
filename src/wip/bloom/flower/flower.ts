import { Component, ComponentClass } from "../component";
import Perianth from "./perianth";
import Reproductive from "./reproductive";

export default class Flower extends Component {
    public constructor(public perianth: Perianth, public reproductive: Reproductive) {
        super();
        this.add(perianth);
        this.add(reproductive);
    }
    static generate() {
        return new Flower(Perianth.generate(), Reproductive.generate());
    }
}
