import * as $ from "jquery";
import * as React from "react";
import * as ReactDOM from "react-dom";

import "./bootstrapWindowHack";
import * as Sketch from "./sketch";
import * as Line from "./line/";

const root = document.createElement("div");
document.body.appendChild(root);

const sketchParent = document.createElement("div");
document.body.appendChild(sketchParent);

Sketch.initializeSketch(Line.sketch2, $(sketchParent), {});

ReactDOM.render(
    <div>
        Hello world 123!
    </div>,
    root
);