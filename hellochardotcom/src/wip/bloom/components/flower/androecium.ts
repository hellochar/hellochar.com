import dna from "../../dna";
import { Component } from "../component";
import { Whorl } from "../whorl";
import Stamen from "./stamen";

export default class Androecium extends Component {
    public constructor(public stamens: Whorl<Stamen>) {
        super();
        this.add(stamens);
    }

    static generate() {
        const stamens = Whorl.generate(dna.stamenWhorl);
        return new Androecium(stamens);
    }
}
