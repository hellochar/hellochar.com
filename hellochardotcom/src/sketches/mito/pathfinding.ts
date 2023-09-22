import { AStarFinder, DiagonalMovement, Grid } from "pathfinding";
import { Vector2 } from "three";

import { height, width } from ".";
import { ActionMove } from "./action";
import { World } from "./game";
import { Cell, Tissue } from "./game/tile";
import { MOVEMENTS } from "./keymap";

export function findPositionsThroughTissue(world: World, target: Vector2, includeTargetIfNonTissue = false) {
    const grid = newGrid((x, y, g) => {
        const tile = world.tileAt(x, y);
        if (tile != null && world.player.isWalkable(tile)) {
            g.setWalkableAt(x, y, true);
        }
    });
    grid.setWalkableAt(target.x, target.y, true);
    const path = findPositions(grid, world.player.pos, target);
    if (!(world.tileAt(target) instanceof Cell) && !includeTargetIfNonTissue) {
        // get rid of trying to actually walk past the edge
        path.pop();
        return path;
    }
    return path;
}

export function findPositionsThroughNonObstacles(world: World, target: Vector2) {
    const grid = newGrid((x, y, g) => {
        const tile = world.tileAt(x, y)!;
        if (tile instanceof Tissue || (!(tile instanceof Cell) && !tile.isObstacle)) {
            g.setWalkableAt(x, y, true);
        }
    });

    return findPositions(grid, world.player.pos, target);
}

export function pathFrom(positions: Array<[number, number]>) {
    const actions: ActionMove[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
        const [fromX, fromY] = positions[i];
        const [toX, toY] = positions[i + 1];
        const direction = actionMoveFor(fromX, fromY, toX, toY);
        if (direction == null) {
            throw new Error("couldn't find corresponding movement action");
        }
        actions.push(direction);
    }
    return actions;
}

function findPositions(grid: Grid, start: Vector2, target: Vector2) {
    const finder = new AStarFinder({ diagonalMovement: DiagonalMovement.Always });
    // positions comes back as an array of [x, y] positions that are all adjacent to each other
    return finder.findPath(
        start.x, start.y,
        target.x, target.y,
        grid) as Array<[number, number]>;
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

export function actionMoveFor(fromX: number, fromY: number, toX: number, toY: number): ActionMove | undefined {
    const dx = toX - fromX;
    const dy = toY - fromY;
    return MOVEMENTS.find(({dir}) => dir.x === dx && dir.y === dy);
}
