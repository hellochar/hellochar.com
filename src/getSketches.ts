import { SketchConstructor } from "./sketch";

export default function getSketches(modules: Record<string, { default?: SketchConstructor }>) {
    const sketches: SketchConstructor[] = [];
    for (const [key, sketchModule] of Object.entries(modules)) {
        const sketch = sketchModule.default;
        if (sketch == null) {
            console.warn("no default export for module ", key, "skipping");
            continue;
        }
        if (sketch.id == null) {
            // Extract name from paths like "./waves.ts" or "./cymatics/index.ts"
            const match = /\.\/(\w+)/.exec(key);
            if (match) {
                sketch.id = match[1];
            }
        }
        sketches.push(sketch);
    }
    return sketches;
}
