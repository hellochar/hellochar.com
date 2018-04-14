import * as THREE from "three";

import { Component } from "./component";

export class Leaf extends Component {
    constructor() {
        super();
    }

    static generate() {
        return new Leaf();
    }
}
