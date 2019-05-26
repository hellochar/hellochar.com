import * as React from "react";

import { Action } from "../action";
import { ACTION_KEYMAP, MOVEMENT_KEYS } from "../keymap";
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
                    Use WASD, QEZC.
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
        return this.state.counter >= 2;
    }
}

interface TutorialMovementKeyHintProps {
    x: number;
    y: number;
    keyChar: string;
    parent: THREE.Object3D;
}

class TutorialMovementKeyHint extends React.PureComponent<TutorialMovementKeyHintProps, {}> {
    private mesh: THREE.Mesh;
    constructor(props: TutorialMovementKeyHintProps) {
        super(props);
        this.mesh = MOVEMENT_KEY_MESHES.get(this.props.keyChar)!.clone();
    }

    render() {
        const action = MOVEMENT_KEYS[this.props.keyChar];
        const x = this.props.x + action.dir.x;
        const y = this.props.y + action.dir.y;
        this.mesh.position.set(x, y, 2);
        return <SceneObject parent={this.props.parent} object={this.mesh} />;
    }
}
