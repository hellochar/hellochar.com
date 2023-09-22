import { parse } from "query-string";

const mathRandomSeed: string | undefined = parse(location.search).randomSeed;

if (mathRandomSeed != null) {
    // https://gist.github.com/blixt/f17b47c62508be59987b
    let _seed = Number(mathRandomSeed) % 2147483647;
    if (_seed <= 0) {
        _seed += 2147483646;
    }

    Math.random = () => {
        const next = (_seed = _seed * 16807 % 2147483647);
        return (next - 1) / 2147483646;
    }
}
