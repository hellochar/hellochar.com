import * as React from "react";

import { Action, ActionMove } from "../action";
import { ACTION_KEYMAP } from "../keymap";
import { MOVEMENT_KEY_MESHES } from "../movementKeyMeshes";
import { SceneObject } from "./sceneObject";
import { Tutorial } from "./tutorial";

export default class TutorialMovement extends Tutorial {
    state = {
        counter: 0,
    };
    render() {
        const keyHints: JSX.Element[] = [];
        for (const [key] of MOVEMENT_KEY_MESHES) {
            const x = this.props.mito.world.player.pos.x;
            const y = this.props.mito.world.player.pos.y;
            keyHints.push(<TutorialMovementKeyHint x={x} y={y} key={key} keyChar={key} parent={this.props.scene} />);
        }
        return (
            <>
                {keyHints}

                <div className="guide-movement">
                    Use WASD, QEZC to move around.
                </div>
            </>
        );
    };

    onActionPerformed(action: Action) {
        if (action.type === "move") {
            this.setState({ counter: this.state.counter + 1 });
        }
    }

    isFulfilled() {
        return this.state.counter >= 3;
    }
}

class TutorialMovementKeyHint extends React.PureComponent<{x: number, y: number, keyChar: string, parent: THREE.Object3D}, {}> {
    render() {
        const mesh = MOVEMENT_KEY_MESHES.get(this.props.keyChar);
        if (mesh == null) {
            throw new Error("wtf");
        }
        const action = ACTION_KEYMAP[this.props.keyChar] as ActionMove;
        const x = this.props.x + action.dir.x;
        const y = this.props.y + action.dir.y;
        mesh.position.set(x, y, 2);
        return <SceneObject parent={this.props.parent} object={mesh} />;
    }
}
