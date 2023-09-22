import { EventEmitter } from "events";
import { Vector2 } from "three";
import { Action, ActionBuild, ActionBuildTransport, ActionDeconstruct, ActionDrop, ActionMove, ActionMultiple } from "../action";
import { build, footsteps } from "../audio";
import { Constructor } from "../constructor";
import { hasInventory, Inventory } from "../inventory";
import { MOVEMENTS } from "../keymap";
import { params } from "../params";
import { Cell, Fruit, GrowingCell, Tile, Tissue, Transport } from "./tile";
import { World } from "./world";

export class Player {
    public inventory = new Inventory(params.maxResources, this, Math.round(params.maxResources / 3), Math.round(params.maxResources / 3));
    private action?: Action;
    private events = new EventEmitter();
    private actionQueue: Action[] = [];
    public mapActions?: (player: Player, action: Action) => Action | Action[] | undefined;
    public constructor(public pos: Vector2, public world: World) { }
    public setActions(actions: Action[]) {
        this.actionQueue = actions;
    }
    public setAction(action: Action) {
        this.action = action;
        this.actionQueue = [];
    }
    public getAction() {
        return this.action;
    }
    public droopY() {
        const tile = this.world.tileAt(this.pos.x, this.pos.y);
        if (tile instanceof Cell) {
            return tile.droopY;
        } else {
            return 0;
        }
    }

    public droopPos() {
        const droopY = this.droopY();
        if (droopY !== 0) {
            const t = this.pos.clone();
            t.y += droopY;
            return t;
        }
        return this.pos;
    }

    public currentTile() {
        return this.world.tileAt(this.pos);
    }

    public on(event: string, cb: (...args: any[]) => void) {
        this.events.on(event, cb);
    }

    public step() {
        if (this.action === undefined) {
            this.action = this.actionQueue.shift() || { type: "none" };
        }
        if (this.mapActions) {
            const mappedAction = this.mapActions(this, this.action);
            if (Array.isArray(mappedAction)) {
                const [currentAction, ...futureActions] = mappedAction;
                this.action = currentAction;
                this.actionQueue.unshift(...futureActions);
            } else if (mappedAction != null) {
                this.action = mappedAction;
            } else {
                this.action = { type: "none" };
            }
        }
        const actionSuccessful = this.attemptAction(this.action);
        if (actionSuccessful) {
            this.events.emit("action", this.action);
        }
        this.action = undefined;
    }

    public attemptAction(action: Action): boolean {
        switch (action.type) {
            case "none":
                // literally do nothing
                return true;
            case "still":
                return this.attemptStill();
            case "move":
                return this.attemptMove(action);
            case "build":
                return this.attemptBuild(action);
            case "build-transport":
                return this.attemptBuildTransport(action);
            case "deconstruct":
                return this.attemptDeconstruct(action);
            case "drop":
                return this.attemptDrop(action);
            case "multiple":
                return this.attemptMultiple(action);
        }
    }
    public verifyMove(action: ActionMove) {
        const target = this.pos.clone().add(action.dir);
        return this.isWalkable(target);
    }

    public isWalkable(pos: Tile | Vector2) {
        if (pos instanceof Tile) {
            pos = pos.pos;
        }
        if (!this.world.isValidPosition(pos.x, pos.y)) {
            return false;
        }
        const targetTile = this.world.tileAt(pos.x, pos.y);
        if (!(targetTile instanceof Cell) || targetTile == null || targetTile.isObstacle) {
            // can't move!
            return false;
        }
        return true;
    }

    public isBuildCandidate(tile: Tile | null): tile is Tile {
        if (tile != null && !this.isWalkable(tile) && !tile.isObstacle) {
            // This Tile could conceivably be built upon. But are we close enough?
            const offset = tile.pos.clone().sub(this.pos);
            const areWeCloseEnough = MOVEMENTS.find((move) => move.dir.equals(offset)) != null;
            return areWeCloseEnough;
        } else {
            return false;
        }
    }
    public attemptMove(action: ActionMove) {
        if (this.verifyMove(action)) {
            footsteps.audio.currentTime = Math.random() * 0.05;
            footsteps.gain.gain.cancelScheduledValues(0);
            footsteps.gain.gain.value = 0.2;
            footsteps.gain.gain.linearRampToValueAtTime(0, footsteps.gain.context.currentTime + 0.05);
            // do the move
            this.pos.add(action.dir);
            this.autopickup();
            return true;
        } else {
            return false;
        }
    }
    public attemptStill() {
        this.autopickup();
        return true;
    }
    private autopickup() {
        // autopickup resources in the position as possible
        const cell = this.currentTile();
        if (hasInventory(cell)) {
            const inv = cell.inventory;
            inv.give(this.inventory, inv.water, inv.sugar);
        }
    }
    public tryConstructingNewCell<T>(position: Vector2, cellType: Constructor<T>) {
        position = position.clone();
        const targetTile = this.world.tileAt(position.x, position.y);
        if (targetTile == null) {
            // out of bounds/out of map
            return;
        }
        // disallow building a seed if there already is one
        // todo fix typings on constructor vs typeof
        if (this.world.fruit != null && (cellType as any) === Fruit) {
            return;
        }
        // disallow building over a seed
        if (targetTile instanceof Fruit) {
            return;
        }
        const waterCost = 1;
        const sugarCost = 1;
        const tileAlreadyExists = targetTile instanceof cellType && !((cellType as any) === Transport && targetTile instanceof Transport);
        if (!tileAlreadyExists &&
            !targetTile.isObstacle &&
            this.inventory.water >= waterCost &&
            this.inventory.sugar >= sugarCost) {
            this.inventory.add(-waterCost, -sugarCost);
            const newTile = new cellType(position, this.world);
            build.audio.currentTime = 0;
            build.gain.gain.cancelScheduledValues(0);
            build.gain.gain.value = 0.2;
            build.gain.gain.exponentialRampToValueAtTime(0.0001, build.gain.context.currentTime + 0.50);
            return newTile;
        } else {
            return undefined;
        }
    }

    public attemptBuild(action: ActionBuild) {
        const existingCell = this.world.cellAt(action.position.x, action.position.y);
        if (existingCell != null && existingCell.constructor === action.cellType) {
            // already built, whatever.
            return true;
        }
        if (existingCell) {
            this.attemptDeconstruct({ type: "deconstruct", position: action.position, force: true });
        }
        const matureCell = this.tryConstructingNewCell(action.position, action.cellType);
        if (matureCell != null) {
            let cell: Cell;
            if (action.cellType.turnsToBuild) {
                cell = new GrowingCell(action.position, this.world, matureCell);
            } else {
                cell = matureCell;
            }
            cell.droopY = this.droopY();
            this.world.setTileAt(action.position, cell);
            if (this.isWalkable(cell)) {
                // move into the tissue cell
                this.attemptMove({
                    type: "move",
                    dir: action.position.clone().sub(this.pos),
                });
            }
            return true;
        } else {
            return false;
        }
    }

    // public attemptBuild(action: ActionBuild) {
    //     const existingCell = this.world.cellAt(action.position.x, action.position.y);
    //     if (existingCell instanceof action.cellType) {
    //         // already built, whatever.
    //         return true;
    //     }
    //     if (existingCell) {
    //         this.attemptDeconstruct({ type: "deconstruct", position: action.position, force: true });
    //     }
    //     const newCell = this.tryConstructingNewCell(action.position, action.cellType);
    //     if (newCell != null) {
    //         newCell.droopY = this.droopY();
    //         this.world.setTileAt(action.position, newCell);
    //         if (this.world.fruit == null && newCell instanceof Fruit) {
    //             this.world.fruit = newCell;
    //         }
    //         if (newCell instanceof Tissue) {
    //             // move into the tissue cell
    //             this.attemptMove({
    //                 type: "move",
    //                 dir: action.position.clone().sub(this.pos),
    //             });
    //         }
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    public attemptBuildTransport(action: ActionBuildTransport) {
        if (action.dir == null) {
            console.error("null dir", action);
            return true;
        }
        const existingCell = this.world.cellAt(action.position.x, action.position.y);
        if (existingCell) {
            this.attemptDeconstruct({ type: "deconstruct", position: action.position, force: true });
        }
        const newCell = this.tryConstructingNewCell(action.position, action.cellType);
        if (newCell != null) {
            newCell.dir = action.dir;
            this.world.setTileAt(action.position, newCell);
            // move into the next cell
            this.attemptMove({
                type: "move",
                dir: action.dir,
            });
            return true;
        } else {
            return false;
        }
    }
    public attemptDeconstruct(action: ActionDeconstruct): boolean {
        if (!action.position.equals(this.pos) || action.force) {
            const maybeCell = this.world.maybeRemoveCellAt(action.position);
            if (maybeCell != null) {
                // refund the resources back
                const refund = maybeCell.energy / params.cellEnergyMax;
                this.inventory.add(refund, refund);
                if (hasInventory(maybeCell)) {
                    maybeCell.inventory.give(this.inventory, maybeCell.inventory.water, maybeCell.inventory.sugar);
                }
                return true;
            }
        }
        return false;
    }
    public attemptDrop(action: ActionDrop) {
        // drop as much as you can onto the current tile
        const currentTile = this.currentTile();
        if (hasInventory(currentTile)) {
            const { water, sugar } = action;
            // first, pick up the opposite of what you can from the tile to try and make space
            currentTile.inventory.give(this.inventory, sugar, water);

            // give as much as you can
            this.inventory.give(currentTile.inventory, water, sugar);
            return true;
        } else {
            return false;
        }
    }

    public attemptMultiple(multiple: ActionMultiple) {
        let allSuccess = true;
        for (const action of multiple.actions) {
            allSuccess = this.attemptAction(action) && allSuccess;
        }
        return allSuccess;
    }
}
