export interface Constructor<T> {
    new(...args: any[]): T;
    displayName: string;

    diffusionWater?: number;
    diffusionSugar?: number;
    turnsToBuild?: number;
}
