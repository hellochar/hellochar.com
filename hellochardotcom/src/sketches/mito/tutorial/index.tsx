import * as React from "react";

import Mito from "..";
import { Action } from "../action";
import { Fruit, Transport, Vein } from "../game/tile";
import { BUILD_HOTKEYS } from "../keymap";
import { Tutorial } from "./tutorial";
import {TutorialBuildLeaf, TutorialBuildRoot, TutorialBuildTissue} from "./tutorialBuildTissue";
import TutorialMovement from "./tutorialMovement";

interface NewPlayerTutorialProps {
    mito: Mito;
}

interface NewPlayerTutorialState {
    time: number;
    step: number;
}

export class NewPlayerTutorial extends React.PureComponent<NewPlayerTutorialProps, NewPlayerTutorialState> {
    static STEPS = [
        TutorialMovement,
        TutorialBuildTissue,
        TutorialBuildRoot,
        TutorialBuildLeaf,
    ];

    state = {
        time: 0,
        step: 0,
    };

    handleFulfilled = () => {
        this.setState({ step: this.state.step + 1}, () => {
            if (this.isFinished()) {
                BUILD_HOTKEYS.T = Transport;
                BUILD_HOTKEYS.F = Fruit;
                // BUILD_HOTKEYS.v = Vein;
            }
        });
    }
    public tutorialRef: Tutorial | null = null;
    handleCurrentTutorialRef = (ref: Tutorial) => {
        this.tutorialRef = ref;
    }

    isFinished() {
        return this.state.step >= NewPlayerTutorial.STEPS.length;
    }
    // private steps = [
    //     {
    //         content: (
    //         <div className="guide-build-root">
    //             Build a Root to suck in Water.
    //         </div>
    //         ),
    //         isFulfilled() {
    //             User builds a Root.
    //         },
    //         mount() {
    //             // find a buildable ground tile and highlight that
    //         },
    //         unmount() {
    //             // remove highlight
    //         }
    //     },
    //     {
    //         content: (
    //             <div className="guide-build-leaf">
    //                 Build a Leaf above-ground to convert Water to Sugar.
    //             </div>
    //         ),
    //         isFulfilled() {
    //             user builds 5 leaves above-ground.
    //         }
    //         mount() {
    //             // highlight a tile above the ground
    //         },
    //         unmount() {
    //             // unhighlight tile
    //         }
    //     },
    //     {
    //         content: (
    //             <div className="guide-drop-water">
    //                 Press 1 to drop Water next to the Leaf.
    //                 <br />
    //                 Leaves work automatically.
    //             </div>
    //         ),
    //         isFulfilled() {
    //             user drops water adjacent to Leaf.
    //         },
    //         mount() {
    //         },
    //         unmount() {
    //         }
    //     },
    //     {
    //         waitUntil() {
    //             a tile is below 70% hp
    //         },
    //         content: (
    //             <div className="guide-drop-sugar">
    //                 Every Cell needs Sugar to live.
    //                 <br />
    //                 Press 2 to drop Sugar on hungry Cells.
    //             </div>
    //         ),
    //         isFulfilled() {
    //             user drops sugar on <70% hp tile
    //         },
    //         mount() {
    //             // highlight hungry tile
    //         },
    //         unmount() {
    //             // unhighlight hungry tile
    //         }
    //     },
    //     {
    //         waitUntil() {
    //             user has > 50 tiles
    //         },
    //         content: (
    //             <div className="guide-build-fruit">
    //                 Your plant is growing!
    //                 <br/>
    //                 Win the game by building {fruit_image}The Fruit{fruit_image},
    //                 and loading it with 1000 Sugar!
    //             </div>
    //         ),
    //         isFulfilled() {
    //             user has built fruit tile
    //         }
    //     }
    // ];

    componentDidMount() {
        this.props.mito.world.player.on("action", (action: Action) => {
            if (this.tutorialRef) {
                this.tutorialRef.onActionPerformed(action);
            }
        });
    }

    render() {
        /*
           ___________________________________________X
           |------>    2 of 7                         |
           <back   use wasd to move around        next>
           -------------------------------------------
        */
        const currentTutorialType = NewPlayerTutorial.STEPS[this.state.step];
        if (currentTutorialType) {
            return (
                <div className="new-player-tutorial ui-popup ui-popup-top">
                    {/* <div className="popup-title progress-bar">{this.state.step + 1} of {NewPlayerTutorial.STEPS.length}</div> */}
                    {/* <button className="next">-> Next</button> */}
                    {/* {this.state.step > 0 ? <button>&lt;- Back</button> : null} */}
                    <div className="popup-content tutorial-content">
                        {React.createElement(currentTutorialType, {
                            ref: this.handleCurrentTutorialRef,
                            mito: this.props.mito,
                            time: this.state.time,
                            scene: this.props.mito.scene,
                            onFulfilled: this.handleFulfilled,
                        } as any)}
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}
