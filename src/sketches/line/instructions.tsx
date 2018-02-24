import * as classnames from "classnames";
import * as React from "react";

export interface InstructionsState {
    leapMotionControllerValid: boolean;
    lastRenderedFrame: number;
    globalFrame: number;
}

export class Instructions extends React.Component<{}, InstructionsState> {
    // tslint:disable-next-line:member-access
    state = {
        leapMotionControllerValid: false,
        globalFrame: 0,
        lastRenderedFrame: -Infinity,
    };

    public render() {
        const numSecondsToShowInstructions = 10;
        const shouldShow = !(this.state.globalFrame - this.state.lastRenderedFrame < 60 * numSecondsToShowInstructions) && this.state.leapMotionControllerValid;
        return (
            <div className={classnames("line-instructions", {visible: shouldShow} )}>
                <img className="instructions-image" src="/assets/images/leap motion instructions overhead.png" />
                <p style={{fontSize: "40px", color: "white", position: "absolute", top: "80%"}}>
                    Reach your fingers, palms down, at the TV.
                </p>
            </div>
        );
    }

    public setGlobalFrame(f: number) {
        this.setState({ globalFrame: f });
    }

    public setLastRenderedFrame(lastRenderedFrame: number) {
        this.setState({ lastRenderedFrame });
    }

    public setLeapMotionControllerValid(valid: boolean) {
        this.setState({ leapMotionControllerValid: valid });
    }
}
