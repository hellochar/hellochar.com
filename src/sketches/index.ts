import getSketches from "../getSketches";

const modules = import.meta.glob<{ default: any }>(
    ['./**/index.{ts,tsx}', './*.{ts,tsx}', '!./index.ts'],
    { eager: true },
);

const sketches = getSketches(modules);
export default sketches;
