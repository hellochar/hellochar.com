import { ISketch, SketchConstructor } from "./sketch";

export default function getSketches(context: __WebpackModuleApi.RequireContext) {
    const sketches: SketchConstructor[] = [];
    context.keys().forEach((key) => {
        if (key === "./index") {
            return; // skip
        }
        const sketchModule = context(key);
        const sketch = sketchModule.default as SketchConstructor;
        if (sketch == null) {
            console.warn("no default export for module ", sketchModule, "skipping");
            return;
        }
        if (sketch.id == null) {
            const match = /\.\/(\w+)$/.exec(key)!;
            const id = match[1];
            sketch.id = id;
        }
        sketches.push(sketch);
    });
    return sketches;
}
