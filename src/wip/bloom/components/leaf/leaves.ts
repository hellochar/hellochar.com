import * as THREE from "three";

import dna from "../../dna";
import { Component } from "../component";
import { Whorl, WhorlParameters } from "../whorl";
import { Leaf } from "./leaf";

export default class Leaves extends Component {
    public constructor(public whorl: Whorl<Leaf>) {
        super();
        this.add(whorl);
    }

    static generate() {
        const whorl = Whorl.generate(dna.leafWhorlTemplate);
        return new Leaves(whorl);
    }
}
