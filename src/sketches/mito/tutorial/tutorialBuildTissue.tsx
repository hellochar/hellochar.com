import * as React from "react";

import { World } from "..";
import { Action } from "../action";
import { Tissue, Tile } from "../tile";
import TileHighlight from "./tileHighlight";
import { Tutorial } from "./tutorial";

export default class TutorialBuildTissue extends Tutorial {
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

                <div className="tutorial-build-tissue">
                    Build three Tissue to expand your reach.
                    {this.state.counter > 0 ? <><br />Building costs 1 water and 1 sugar.</> : null}
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

function findBuildCandidateTiles(world: World) {
    const candidates: Set<Tile> = new Set();
    for (const entity of world.entities()) {
        if (entity instanceof Tissue) {
            for (const [, neighbor] of world.tileNeighbors(entity.pos)) {
                if (!(neighbor instanceof Tissue) && !neighbor.isObstacle) {
                    candidates.add(neighbor);
                }
            }
        }
    }
    return candidates;
}
