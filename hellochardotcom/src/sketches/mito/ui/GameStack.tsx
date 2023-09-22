import * as React from "react";

import Mito, { GameState } from "../index";
import { Instructions } from "./Instructions";

export interface GameStackProps {
    mito: Mito;
    state: GameState;
}
export class GameStack extends React.PureComponent<GameStackProps> {
    handlePlay = () => {
        this.props.mito.gameState = "main";
    };
    public render() {
        const style: React.CSSProperties = {
            width: "100%",
            height: "100%",
            position: "absolute",
            background: "rgba(255, 255, 255, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
        };
        if (this.props.state === "main") {
            return null;
        } else if (this.props.state === "win") {
            return (<div className="screen-win" style={style}>
                You won!
                </div>);
        } else if (this.props.state === "lose") {
            return (<div className="screen-lose" style={style}>
                You lost!
                </div>);
        } else if (this.props.state === "instructions") {
            return <Instructions play={this.handlePlay} />;
        }
    }
}
