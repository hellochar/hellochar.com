import * as React from "react";
import { Vector2 } from "three";

import { HoveredTileInfo } from ".";
import Mito from "..";
import { Constructor } from "../constructor";
import { World } from "../game";
import { Air, Cell, hasEnergy, Leaf, Root, Tile, Tissue, Transport } from "../game/tile";
import { hasInventory } from "../inventory";
import { params } from "../params";
import { findPositionsThroughNonObstacles, findPositionsThroughTissue } from "../pathfinding";
import TileHighlight from "../tutorial/tileHighlight";

interface HoverProps {
    mito: Mito;
}

export class Hover extends React.Component<HoverProps> {
    get scene() {
        return this.props.mito.scene;
    }
    public render() {
        const {hoveredTile} = this.props.mito;
        return <>
            <HoveredTileInfo tile={hoveredTile} />
            { this.maybeRenderHoveredTileHighlight(hoveredTile) }
            { this.maybeRenderPath() }
        </>;
    }

    public maybeRenderHoveredTileHighlight(tile?: Tile) {
        if (tile) {
            return <TileHighlight x={tile.pos.x} y={tile.pos.y} scene={this.scene} />;
        }
    }

    public maybeRenderPath() {
        const { autoplace, hoveredTile, scene, world } = this.props.mito;
        if (hoveredTile) {
            if (autoplace === Tissue) {
                return <PathHighlight tile={hoveredTile} scene={scene} world={world} walkable="non-obstacles" />;
            }
            if (autoplace === Transport) {
                return <PathHighlight tile={hoveredTile} scene={scene} world={world} walkable="tissue" />;
            }
        }
    }
}

class PathHighlight extends React.PureComponent<{world: World, tile: Tile, scene: THREE.Scene, walkable: "tissue" | "non-obstacles"}> {
    render() {
        const path = this.props.walkable === "non-obstacles"
            ? findPositionsThroughNonObstacles(this.props.world, this.props.tile.pos)
            : findPositionsThroughTissue(this.props.world, this.props.tile.pos);
        return <>
            {path.map(([x, y]) => <TileHighlight x={x} y={y} scene={this.props.scene} />)}
        </>;
    }
}
