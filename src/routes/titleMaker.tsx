import * as React from "react";

export class TitleMaker extends React.PureComponent<{}, {}> {
    render() {
        return (
            <div id="titleMaker">
                <div className="titleMaker-container">
                    <h1 className="titleMaker-title">Cymatics</h1>
                    <div className="titleMaker-line" />
                </div>
            </div>
        );
    }
}
