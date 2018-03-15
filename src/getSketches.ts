import { ISketch } from "./sketch";

export default function getSketches(context: __WebpackModuleApi.RequireContext) {
    const sketches: ISketch[] = [];
    context.keys().forEach((key) => {
        if (key === "./index") {
            return; // skip
        }
        const sketchModule = context(key);
        const sketch = sketchModule.default as ISketch;
        if (sketch.id == null) {
            const match = /\.\/(\w+)$/.exec(key)!;
            const id = match[1];
            sketch.id = id;
        }
        sketches.push(sketch);
    });
    return sketches;
}
