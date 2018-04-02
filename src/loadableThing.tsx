import * as React from 'react';
import * as Loadable from 'react-loadable';

export const LoadableThingComponent = Loadable({
  loader: () => import('./thing').then((mod) => mod.default),
  loading: () => <div>Loading</div>,
});

export default class LoadableThing extends React.Component {
    render() {
        return <LoadableThingComponent />;
    }
}
