import * as classnames from "classnames";
import * as React from "react";

const NUM_IMAGES_PER_ROW = 5;

export interface ImagesProps extends React.HTMLAttributes<HTMLDivElement> {
    children: Array<React.ReactElement<any>>;
}

export interface ImagesState {
    fullScreen: boolean;
    selectedImageIndex: number;
}

export class Images extends React.Component<ImagesProps, ImagesState> {
    public state = {
        fullScreen: false,
        selectedImageIndex: 0,
    };

    public componentDidMount() {
        document.addEventListener("keyup", this.handleKeyUp);
    }

    public componentWillUnmount() {
        document.removeEventListener("keyup", this.handleKeyUp);
    }

    public render() {
        const { children, className, ...restProps } = this.props;
        const finalClassName = classnames("images", className);
        const rowElements: React.ReactNode[] = [];
        for (let rowIndex = 0; rowIndex < children.length / 5; rowIndex++) {
            const rowChildren: React.ReactNode[] = children.slice(rowIndex * 5, (rowIndex + 1) * 5) as any;
            rowElements.push(
                <div className="images-row" key={rowIndex}>
                    {
                        rowChildren.map((child, i) => (
                            <div key={i} className="image-wrapper" onClick={() => this.handleThumbnailClick(i + 5 * rowIndex)}>
                                {child}
                            </div>
                        ))
                    }
                </div>,
            );
        }
        return (
            <div className={finalClassName} {...restProps}>
                {rowElements}
                {this.maybeRenderFullScreen()}
            </div>
        );
    }

    private maybeRenderFullScreen() {
        if (this.state.fullScreen) {
            return (
                <div className="images-fullscreen">
                    <div className="images-fullscreen-image-wrapper">
                        { this.renderFullScreenChild() }
                        <button className="images-fullscreen-button images-fullscreen-button-previous" onClick={this.handleNavPrevious}>&#x3008;</button>
                        <button className="images-fullscreen-button images-fullscreen-button-next" onClick={this.handleNavNext}>&#x3009;</button>
                        <button className="images-fullscreen-button images-fullscreen-button-exit" onClick={this.handleNavExit}>&#215;</button>
                    </div>
                </div>
            );
        }
    }

    private renderFullScreenChild() {
        const child = this.props.children[this.state.selectedImageIndex];
        // specially treat imgs - clicking on them will auto-next
        if (child.type === "img") {
            return React.cloneElement(child, {
                onClick: this.handleNavNext,
            });
        } else {
            return child;
        }
    }

    private handleKeyUp = (evt: KeyboardEvent) => {
        if (evt.key === "Escape") {
            this.handleNavExit();
        } else if (evt.key === "ArrowLeft") {
            this.handleNavPrevious();
        } else if (evt.key === "ArrowRight" ) {
            this.handleNavNext();
        }
    }

    private handleThumbnailClick(selectedImageIndex: number) {
        this.setState({
            fullScreen: true,
            selectedImageIndex,
        });
    }

    private handleNavPrevious = () => {
        const selectedImageIndex = ((this.state.selectedImageIndex - 1) + this.props.children.length) % this.props.children.length;
        this.setState({ selectedImageIndex });
    }

    private handleNavNext = () => {
        const selectedImageIndex = ((this.state.selectedImageIndex + 1) + this.props.children.length) % this.props.children.length;
        this.setState({ selectedImageIndex });
    }

    private handleNavExit = () => {
        this.setState({ fullScreen: false });
    }
}
