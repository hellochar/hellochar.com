import * as React from "react";

export class TitleMaker extends React.PureComponent<{}, {}> {
    render() {
        return (
            <div id="titleMaker">
                <link href="https://fonts.googleapis.com/css?family=Dosis|Share" rel="stylesheet" />
                <div className="titleMaker-container">
                    <h1 className="titleMaker-title">Xiaohan Zhang</h1>
                    {/* <div className="titleMaker-line" /> */}
                    <h1 className="titleMaker-secondary">hellochar.com</h1>
                </div>
            </div>
        );
    }
}
