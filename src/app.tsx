import * as React from "react";
import { BrowserRouter } from "react-router-dom";

import { GATracker } from "./analytics";
import { Routes } from "./routes";

const App = () => {
    return (
        <BrowserRouter>
            <>
                <GATracker />
                <Routes />
            </>
        </BrowserRouter>
    );
}

export default App;
