import { Component } from "../component";
import dna from "../dna";
import { Whorl } from "../whorl";
import Tepal from "./tepal";

export default class Calyx extends Component {
    public constructor(public petals: Whorl<Tepal>) {
        super();
        this.add(petals);
    }

    static generate() {
        const petals = Whorl.generate(dna.tepalWhorl);
        return new Calyx(petals);
    }
}
