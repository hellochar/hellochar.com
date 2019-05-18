import { AStarFinder, DiagonalMovement, Grid } from "pathfinding";
import { Vector2 } from "three";

import { height, width } from ".";
import { DIRECTION_VALUES } from "./directions";
import { World } from "./game";
import { Cell, Tissue } from "./game/tile";

export function findPathThroughTissue(world: World, target: Vector2, expandOne: boolean): Vector2[] {
    const grid = newGrid((x, y, g) => {
        const tile = world.tileAt(x, y);
        if (tile instanceof Tissue) {
            g.setWalkableAt(x, y, true);
            if (expandOne) {
                for (const [, neighbor] of world.tileNeighbors(tile.pos)) {
                    g.setWalkableAt(neighbor.pos.x, neighbor.pos.y, true);
                }
            }
        }
    });
    return findPath(grid, world.player.pos, target);
}

export function findPathThroughNonObstacles(world: World, target: Vector2) {
    const grid = newGrid((x, y, g) => {
        const tile = world.tileAt(x, y)!;
        if (tile instanceof Tissue || (!(tile instanceof Cell) && !tile.isObstacle)) {
            g.setWalkableAt(x, y, true);
        }
    });

    return findPath(grid, world.player.pos, target);
}

function findPath(grid: Grid, start: Vector2, target: Vector2) {
    const finder = new AStarFinder({ diagonalMovement: DiagonalMovement.Always });
    // positions comes back as an array of [x, y] positions that are all adjacent to each other
    const positions = finder.findPath(
        start.x, start.y,
        target.x, target.y,
        grid);
    const path: Vector2[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
        const [fromX, fromY] = positions[i];
        const [toX, toY] = positions[i + 1];
        const direction = directionFor(fromX, fromY, toX, toY);
        if (direction == null) {
            throw new Error("couldn't find direction");
        }
        path.push(direction);
    }
    return path;
}

function newGrid(fn: (x: number, y: number, grid: Grid) => void) {
    const grid = new Grid(width, height);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            grid.setWalkableAt(x, y, false);
        }
    }

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            fn(x, y, grid);
        }
    }
    return grid;
}

export function directionFor(fromX: number, fromY: number, toX: number, toY: number): Vector2 | undefined {
    const dx = toX - fromX;
    const dy = toY - fromY;
    return DIRECTION_VALUES.find(({x, y}) => x === dx && y === dy)
}
