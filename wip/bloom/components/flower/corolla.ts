import dna from "../../dna";
import { Component, ComponentClass } from "../component";
import { Whorl } from "../whorl";
import Petal from "./petal";

export default class Corolla extends Component {
    public constructor(public petals: Whorl<Petal>) {
        super();
        this.add(petals);
    }

    static generate() {
        const petals = Whorl.generate(dna.petalWhorlTemplate);
        return new Corolla(petals);
    }
}
