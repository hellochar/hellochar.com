import dna from "../../dna";
import { Component } from "../component";
import { Whorl } from "../whorl";
import Tepal from "./tepal";

export default class Calyx extends Component {
    public constructor(public tepals: Whorl<Tepal>) {
        super();
        this.add(tepals);
    }

    static generate() {
        const tepals = Whorl.generate(dna.tepalWhorl);
        return new Calyx(tepals);
    }
}
