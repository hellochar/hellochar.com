import * as React from "react";

interface SceneObjectProps {
    object: THREE.Object3D;
    parent: THREE.Object3D;
    // children?: SceneObject[];
}
export class SceneObject extends React.PureComponent<SceneObjectProps, {}> {
    // render() {
    //     if (this.props.children) {
    //         return <>
    //             {
    //                 this.props.children.map((child) => React.cloneElement(child, { parent: this.props.object }))
    //             }
    //         </>;
    //     }
    // }

    render() {
        return null;
    }

    componentDidMount() {
        this.props.parent.add(this.props.object);
    }

    componentWillUnmount() {
        this.props.parent.remove(this.props.object);
    }
}
