import { Component, ComponentClass } from "../component";
import Androecium from "./androecium";
import Gynoecium from "./gynoecium";

export default class Reproductive extends Component {
    public constructor(public androecium: Androecium, public gynoecium: Gynoecium) {
        super();
        this.add(androecium);
        this.add(gynoecium);
    }

    static generate() {
        const gynoecium = Gynoecium.generate();
        return new Reproductive(Androecium.generate(), gynoecium);
    }
}
