import * as React from "react";
import * as ReactDOM from "react-dom";

import "../../src/monkeypatchThree";

import KioskApp from "./kioskApp";

import "../../src/index.scss";

const root = document.createElement("div");
document.body.appendChild(root);
root.className = "root";
ReactDOM.render(<KioskApp />, root);
