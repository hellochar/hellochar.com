import * as React from "react";

import { FullPageSketch } from "../../src/routes/fullPageSketch";
import { BloomInstallation } from "./bloomInstallation";

const KioskApp = () => (
    <FullPageSketch sketchClass={BloomInstallation} isKiosk={true} />
);

export default KioskApp;
