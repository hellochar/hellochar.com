import * as React from "react";

import Mito from "..";
import { Action } from "../action";
import { TutorialMovement, TutorialStep } from "./steps";

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
    ];

    state = {
        time: 0,
        step: 0,
    };

    handleFulfilled = () => {
        this.setState({ step: this.state.step + 1});
    }
    private tutorialStep: TutorialStep | null = null;
    handleCurrentTutorialStepRef = (ref: TutorialStep) => {
        this.tutorialStep = ref;
    }
    // private steps = [
    //     {
    //         content: (
    //         <div className="guide-movement">
    //             Use WASD, QEZC to move around.
    //         </div>
    //         ),
    //         onActionPerformed(action: Action) {
    //             if (action.type === "move") {
    //                 this.counter++;
    //             }
    //         },
    //         isFulfilled() {
    //             user moves around 2 times
    //         },
    //         mount() {
    //             // Show movement hotkey helper.
    //         },
    //         unmount() {
    //             // remove movement hotkey helper.
    //         },
    //     },
    //     {
    //         content: (
    //         <div className="guide-build-tissue">
    //             Build Tissue to expand your reach.
    //             { if (counter > 1) {
    //                 Building costs 1 water and 1 sugar.
    //               }
    //             }
    //         </div>
    //         ),
    //         onActionPerformed(action: Action) {
    //             if (action.type === "build") {
    //                 this.counter++;
    //             }
    //         }
    //         isFulfilled() {
    //             user builds 3 tissue.
    //         },
    //         mount() {
    //             // highlight a line 3 tiles downwards
    //             // as it's built, remove highlight

    //             // or, highlight all buildable tiles
    //         },
    //         unmount() {
    //             // unhighlight tiles
    //         },
    //     },
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
            if (this.tutorialStep) {
                this.tutorialStep.onActionPerformed(action);
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
        const currentTutorialStepType = NewPlayerTutorial.STEPS[this.state.step];
        if (currentTutorialStepType) {
            return (
                <div className="new-player-tutorial ui-popup ui-popup-bottom">
                    <div className="build-title progress-bar">{this.state.step + 1} of {NewPlayerTutorial.STEPS.length}</div>
                    {/* <button className="next">-> Next</button> */}
                    {/* {this.state.step > 0 ? <button>&lt;- Back</button> : null} */}
                    <div className="content">
                        {React.createElement(currentTutorialStepType, {
                            ref: this.handleCurrentTutorialStepRef,
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
