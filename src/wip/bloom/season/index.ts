export type SeasonType = "growing" | "flowering" | "dying";

export interface Season {
    type: SeasonType;
    percent: number;
}
export let season: Season = {
    type: "growing",
    percent: 0,
};
