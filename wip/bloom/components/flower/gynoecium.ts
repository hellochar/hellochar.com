import { Component, ComponentClass } from "../component";
import { Whorl } from "../whorl";
import Carpel from "./carpel";

export default class Gynoecium extends Component {
    public constructor(public carpels: Whorl<Carpel>) {
        super();
        this.add(carpels);
    }

    static generate() {
        const whorl = new Whorl([Carpel.generate()]);
        return new Gynoecium(whorl);
    }
}
