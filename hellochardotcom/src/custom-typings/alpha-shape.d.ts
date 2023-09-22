declare module 'alpha-shape' {
    function AlphaShapeFn(alpha: number, points: Array<number[]>): Array<[number, number]>;
    export = AlphaShapeFn;
}
