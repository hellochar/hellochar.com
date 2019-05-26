import { Vector2 } from "three";
import { height, width } from "..";
import lazy from "../../../common/lazy";
import { Noise } from "../../../common/perlin";
import { map } from "../../../math";
import { params } from "../params";
import { Fountain, Rock, Soil, Tile } from "./tile";
import { World } from "./world";

export interface Environment {
    climate: {
        turnsBetweenRainfall: number,
        rainDuration: number,
        waterPerDroplet: number,
    };
    waterGravityPerTurn: number;
    evaporationRate: number;
    evaporationBottom: number;
    floorCo2: number;
    fill: FillFunction[];
}

export type FillFunction = (pos: Vector2, world: World) => Tile | undefined;

export const Temperate = lazy(() => {
    const noiseWater = new Noise();
    const noiseRock = new Noise();
    const noiseHeight = new Noise();

    const environment: Environment = {
        climate: {
            turnsBetweenRainfall: 800,
            rainDuration: 50,
            waterPerDroplet: 2,
        },
        evaporationRate: 0.0002,
        evaporationBottom: 0.6,
        floorCo2: 0.5,
        waterGravityPerTurn: 0.001,
        fill: [
            (pos, world) => {
                const {x, y} = pos;
                const soilLevel = height / 2
                    - 4 * (noiseHeight.perlin2(0, x / 5) + 1) / 2
                    - 16 * (noiseHeight.perlin2(10, x / 20 + 10));
                const rockThreshold = map(y - height / 2, 0, height / 2, -0.7, 0.3);
                const isRock = noiseRock.simplex2(x / 5, y / 5) < rockThreshold;
                if (y > soilLevel) {
                    if (isRock) {
                        const rock = new Rock(pos, world);
                        return rock;
                    } else {
                        const heightScalar = Math.pow(map(y - height / 2, 0, height / 2, 0.5, 1), 2);
                        const simplexScalar = 0.2;
                        // this 0.1 factor makes a *huge* difference
                        const simplexValue = noiseWater.simplex2(x * simplexScalar, y * simplexScalar) + 0.2;
                        const water = Math.round(Math.max(1, Math.min(
                            // should be soil_max_water, isn't cuz of dependency cycles messing up instantiation
                            20, simplexValue > 0.4 ? 20 * heightScalar : 0)));
                        if (heightScalar * simplexValue > 1 / params.fountainAppearanceRate) {
                            const emitWaterScalar = Math.min(heightScalar * simplexValue, 1);
                            return new Fountain(pos, water, world, Math.round(params.fountainTurnsPerWater / emitWaterScalar));
                        } else {
                            return new Soil(pos, water, world);
                        }
                    }
                }
            },
        ],
    };
    return environment;
});

export const Desert = lazy(() => {
    const noiseHeight = new Noise();
    const noiseRock = new Noise();

    const e: Environment = {
        climate: {
            rainDuration: 220,
            turnsBetweenRainfall: 3000,
            waterPerDroplet: 8,
        },
        evaporationRate: 0.002,
        evaporationBottom: 0.7,
        waterGravityPerTurn: 0.02,
        floorCo2: 0.95,
        fill: [
            (pos, world) => {
                const {x, y} = pos;
                const soilLevel = height / 2
                    - 2 * (noiseHeight.perlin2(0, x / 20) + 1) / 2
                    - 3 * (noiseHeight.perlin2(10, x / 100 + 10));

                const rockThreshold = map(y, height / 2, height, -0.8, -0.4);
                const isRock = noiseRock.simplex2(x / 4, y / 4) < rockThreshold;
                if (y > soilLevel) {
                    if (isRock) {
                        return new Rock(pos, world);
                    }
                    const water = Math.floor(Math.max(0, map(y, height * 0.75, height, 1, 9)));
                    return new Soil(pos, water, world);
                }
            },
        ],
    };
    return e;
});

export const Rocky = lazy(() => {
    const noiseRock = new Noise();
    const noiseHeight = new Noise();

    const e: Environment = {
        climate: {
            turnsBetweenRainfall: 1200,
            rainDuration: 120,
            waterPerDroplet: 3,
        },
        waterGravityPerTurn: 0.1,
        evaporationBottom: 0.6,
        evaporationRate: 0.001,
        floorCo2: 1,
        fill: [
            (pos, world) => {
                const {x, y} = pos;
                const soilLevel = height * 0.55
                    - 4 * (noiseHeight.perlin2(0, x / 5) + 1) / 2
                    - 16 * (noiseHeight.perlin2(10, x / 20 + 10))
                    - map(x, 0, width, 10, -10);
                const rockLevel = y
                    - 6 * (noiseHeight.perlin2(0, x / 25) + 1) / 2
                    - 20 * (noiseHeight.perlin2(10, x / 150 + 10));
                const rockThreshold = (rockLevel < height * 0.5) ? -1 : -0.15;
                const isRock = noiseRock.simplex2(x / 10, y / 10) < rockThreshold;
                if (isRock) {
                    const rock = new Rock(pos, world);
                    return rock;
                } else if (y > soilLevel) {
                    return new Soil(pos, 3, world);
                }
            },
        ],
    };
    return e;
});

export const ALL_ENVIRONMENTS = {
    Temperate,
    Desert,
    Rocky,
};
