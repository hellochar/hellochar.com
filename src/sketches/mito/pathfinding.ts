import { AStarFinder, DiagonalMovement, Grid } from "pathfinding";
import { Vector2 } from "three";

import { height, width, World } from ".";
import { DIRECTION_VALUES, DIRECTIONS } from "./directions";
import { Tissue } from "./tile";

export function findPath(world: World, target: Vector2): Vector2[] {
    // const matrix = world.gridCells.map((row) => row.map((cell) => (cell instanceof Tissue) ? 0 : 1));
    const grid = new Grid(width, height);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            grid.setWalkableAt(x, y, world.tileAt(x, y) instanceof Tissue);
        }
    }
    const finder = new AStarFinder({ diagonalMovement: DiagonalMovement.Always });
    // positions comes back as an array of [x, y] positions that are all adjacent to each other
    const positions = finder.findPath(
        world.player.pos.x, world.player.pos.y,
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

function directionFor(fromX: number, fromY: number, toX: number, toY: number): Vector2 | undefined {
    const dx = toX - fromX;
    const dy = toY - fromY;
    return DIRECTION_VALUES.find(({x, y}) => x === dx && y === dy)
}
