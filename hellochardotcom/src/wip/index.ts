import getSketches from "../getSketches";

const wipSketches = getSketches(require.context("./", true, /\.\/\w+$/));

export = wipSketches;
