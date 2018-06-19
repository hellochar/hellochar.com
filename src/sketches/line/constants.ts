import { parse } from "query-string";

export const NUM_PARTICLES = Number(parse(location.search).p) ||
    // cheap mobile detection
    (screen.width > 1024 ? 1000000 : 200000);
