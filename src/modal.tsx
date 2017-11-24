
import * as React from "react";

export interface IPhotoGalleryProps {
    children: Array<React.ReactElement<any>>;
}

export interface IPhotoGalleryState {
    isOpened?: boolean;
}

export class PhotoGallery extends React.Component<IPhotoGalleryProps, {}> {
    public render() {
        const children = this.props.children!.map((child) => (
            React.cloneElement(child, {
                className: child.props.className + " photo-gallery-item",
            })
        ));
        return (
            <div className="photo-gallery">
                {children}
            </div>
        );
    }
}
