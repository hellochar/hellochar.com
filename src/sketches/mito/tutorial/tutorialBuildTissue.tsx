import * as React from "react";

import { Entity } from "..";
import { Action } from "../action";
import { World } from "../game";
import { Air, Leaf, Root, Soil, Tile, Tissue } from "../game/tile";
import { BUILD_HOTKEYS } from "../keymap";
import TileHighlight from "./tileHighlight";
import { Tutorial } from "./tutorial";

export class TutorialBuildTissue extends Tutorial {
    state = {
        counter: 0,
    };
    render() {
        const buildCandidateHighlights: JSX.Element[] = [];
        for (const candidate of findBuildCandidateTiles(this.props.mito.world)) {
            buildCandidateHighlights.push(
                <TileHighlight
                    key={candidate.pos.x + "," + candidate.pos.y}
                    x={candidate.pos.x}
                    y={candidate.pos.y}
                    scene={this.props.scene}
                />,
            );
        }

        return (
            <>
                {buildCandidateHighlights}

                <div className="tutorial-build tutorial-build-tissue">
                    Build <b>Tissue (T) to grow</b>.
                </div>
            </>
        );
    };

    onActionPerformed(action: Action) {
        if (action.type === "build" && action.cellType === Tissue) {
            this.setState({ counter: this.state.counter + 1 });
        }
    }

    isFulfilled() {
        return this.state.counter >= 3;
    }
}

function findBuildCandidateTiles(
        world: World,
        predicate?: ((tile: Tile) => boolean)) {
    const entityPredicate: (tile: Tile) => boolean = (t) => (world.player.isWalkable(t));
    const candidates: Set<Tile> = new Set();
    for (const entity of world.entities()) {
        if (entity instanceof Tile && entityPredicate(entity)) {
            for (const [, neighbor] of world.tileNeighbors(entity.pos)) {
                if (!(neighbor instanceof Tissue) && !neighbor.isObstacle) {
                    if (predicate == null) {
                        candidates.add(neighbor);
                    } else if (predicate(neighbor)) {
                        candidates.add(neighbor);
                    }
                }
            }
        }
    }
    return candidates;
}

export class TutorialBuildRoot extends Tutorial {
    state = {
        counter: 0,
    };
    constructor(props: any) {
        super(props);
        BUILD_HOTKEYS.r = Root;
    }
    render() {
        const buildCandidateHighlights: JSX.Element[] = [];
        for (const candidate of findBuildCandidateTiles(this.props.mito.world, (t) => t instanceof Soil)) {
            buildCandidateHighlights.push(
                <TileHighlight
                    key={candidate.pos.x + "," + candidate.pos.y}
                    x={candidate.pos.x}
                    y={candidate.pos.y}
                    scene={this.props.scene}
                />,
            );
        }

        return (
            <>
                {buildCandidateHighlights}

                <div className="tutorial-build tutorial-build-root">
                    Great job! Now, build <b>Roots (R) to gather water</b>.
                </div>
            </>
        );
    };

    onActionPerformed(action: Action) {
        if (action.type === "build" && action.cellType === Root) {
            this.setState({ counter: this.state.counter + 1 });
        }
    }

    isFulfilled() {
        return this.state.counter >= 3;
    }
}

export class TutorialBuildLeaf extends Tutorial {
    state = {
        counter: 0,
    };
    constructor(props: any) {
        super(props);
        BUILD_HOTKEYS.f = Leaf;
    }
    render() {
        const buildCandidateHighlights: JSX.Element[] = [];
        for (const candidate of findBuildCandidateTiles(this.props.mito.world, (t) => t instanceof Air)) {
            buildCandidateHighlights.push(
                <TileHighlight
                    key={candidate.pos.x + "," + candidate.pos.y}
                    x={candidate.pos.x}
                    y={candidate.pos.y}
                    scene={this.props.scene}
                />,
            );
        }

        return (
            <>
                {buildCandidateHighlights}

                <div className="tutorial-build tutorial-build-leaf">
                    Fantastic. build <b>Leaf (F) to convert Water to Sugar</b>.
                </div>
            </>
        );
    };

    onActionPerformed(action: Action) {
        if (action.type === "build" && action.cellType === Leaf) {
            this.setState({ counter: this.state.counter + 1 });
        }
    }

    isFulfilled() {
        return this.state.counter >= 3;
    }
}
