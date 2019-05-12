import * as React from "react";
import * as THREE from "three";

import lazy from "../../../common/lazy";
import { SceneObject } from "./sceneObject";

export const TILE_HIGHLIGHT = lazy(() => {
    const geometry = new THREE.PlaneBufferGeometry(1, 1);
    const edgesGeometry = new THREE.EdgesGeometry(geometry, 1); // or WireframeGeometry( geometry )
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.75 });
    const lineSegments = new THREE.LineSegments(edgesGeometry, material);
    lineSegments.position.z = 10;
    return lineSegments;
});

export interface TileHighlightProps {
    x: number;
    y: number;
    scene: THREE.Scene;
}
export default class TileHighlight extends React.PureComponent<TileHighlightProps, {}> {
    private object = TILE_HIGHLIGHT().clone();
    constructor(props: TileHighlightProps) {
        super(props);
        this.object.position.x = this.props.x;
        this.object.position.y = this.props.y;
    }
    render() {
        return <SceneObject object={this.object} parent={this.props.scene} />;
    }
}
