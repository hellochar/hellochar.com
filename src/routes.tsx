import * as React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { TitleMaker } from "./routes/titleMaker";

import sketches = require("./sketches");
import wipSketches = require("./wip");

const sketchRoutes = sketches.map(sketchClass => {
    const path = `/${sketchClass.id}`;
    return (
        <Route
            key={path}
            path={path}
            component={() => <FullPageSketch sketchClass={sketchClass} />}
        />
    );
});

const wipSketchRoutes = wipSketches.map(sketchClass => {
    const path = `/wip/${sketchClass.id}`;
    return (
        <Route
            key={path}
            path={path}
            component={() => <FullPageSketch sketchClass={sketchClass} />}
        />
    );
});

const WipListing = () => (
    <>
        <h1>
            <a href="/">Home</a>
        </h1>
        <ul>
            {wipSketches.map(sketch => (
                <li>
                    <a href={`/wip/${sketch.id}`}>{sketch.id}</a>
                </li>
            ))}
        </ul>
    </>
);

const SlidesIntroCC = () => {
    return (
        <iframe
            className="slides"
            src="https://docs.google.com/presentation/d/e/2PACX-1vT1rzydBsfDy4wx_Y4xcGdMzz_y1WzYMfvuHJB1xbdHtxxozoH3XFLikmc8a3wbEUIKTWBmRh3-8pAq/embed?start=false&loop=false"
            frameBorder="0"
            allowFullScreen
        />
    );
};

const SlidesDiveCC = () => {
    return (
        <iframe
            className="slides"
            src="https://docs.google.com/presentation/d/e/2PACX-1vS8RZPhfhg8DgBzsSlnCWc8MbGKkedX9qv_JKtuNQItsjSaF7MhFvlHdeP7OpO0cSaaZnv1NhLz53dE/embed?start=false&loop=false"
            frameBorder="0"
            allowFullScreen
        />
    );
};

const SlidesProgrammerCC = () => {
    return (
        <iframe
            className="slides"
            src="https://docs.google.com/presentation/d/e/2PACX-1vRwS01XFUlFf4lsFtoaVpFV2RzHOYKU8qT4O2M_uxmEWROsRYOadeMECjTrC1-V4nCYSpb4byLyy0Tw/embed?start=false&loop=false"
            frameBorder="0"
            allowFullScreen
        />
    );
};

const PrivacyPolicyTwilightDungeons = () => {
    return (
        <main className="content privacy-policy">
            <h1>Privacy Policy</h1>
            <p>
                I, Xiaohan Zhang, develop Twilight Dungeons as a free app. This
                App is provided by Xiaohan Zhang at no cost and is intended
                for use as is.
            </p>
            <p>
                This page is used to inform visitors regarding my policies with
                the collection, use, and disclosure of Personal Information if
                anyone decided to use my App.
            </p>
            <p>
                If you choose to use my App, then you agree to the
                collection and use of information in relation to this policy.
                The Personal Information that I collect is used for providing
                and improving the App. I will not use or share your
                information with anyone except as described in this Privacy
                Policy.
            </p>
            <p>
                The terms used in this Privacy Policy have the same meanings as
                in our Terms and Conditions, which is accessible at Twilight
                Dungeons unless otherwise defined in this Privacy Policy.
            </p>
            <p>
                <strong>Information Collection and Use</strong>
            </p>
            <p>
                For a better experience, while using our App, I may require
                you to provide us with certain personally identifiable
                information. The information that I request will be retained on
                your device and is not collected by me in any way.
            </p>
            <div>
                <p>
                    The App does use third party services that may collect
                    information used to identify you.
                </p>
                <p>
                    Links to privacy policies of third party service providers
                    used by the App:
                </p>

                <ul>
                    <li>
                        <a
                            href="https://www.google.com/policies/privacy/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Google Play Services
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://unity3d.com/legal/privacy-policy"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Unity
                        </a>
                    </li>
                </ul>
            </div>
            <p>
                <strong>Log Data</strong>
            </p>
            <p>
                In case of an unexpected error or crash in the App, I
                collect data and information (through third party products) on
                your phone called Log Data. This Log Data may include
                information such as your device Internet Protocol ("IP")
                address, device name, operating system version, the
                configuration of the app when utilizing the App, the time and
                date of your use of the App, and other statistics.
            </p>
            <p>
                <strong>Service Providers</strong>
            </p>{" "}
            <p>
                I may employ third-party companies and individuals due to the
                following reasons:
            </p>
            <ul>
                <li>To facilitate the App;</li>
                <li>To provide the App on our behalf;</li>
                <li>To perform App-related services; or</li>
                <li>To assist us in analyzing how our App is used.</li>
            </ul>
            <p>
                I want to inform users of the App that these third parties
                have access to your Personal Information. The reason is to
                perform the tasks assigned to them on our behalf. However, they
                are obligated not to disclose or use the information for any
                other purpose.
            </p>
            <p>
                <strong>Security</strong>
            </p>
            <p>
                I value your trust in providing us your Personal Information,
                thus we are striving to use commercially acceptable means of
                protecting it. But remember that no method of transmission over
                the internet, or method of electronic storage is 100% secure and
                reliable, and I cannot guarantee its absolute security.
            </p>
            <p>
                <strong>Children's Privacy</strong>
            </p>
            <p>
                The App does not address anyone under the age of 13. I do
                not knowingly collect personally identifiable information from
                children under 13 years of age. In the case I discover that a
                child under 13 has provided me with personal information, I
                immediately delete this from our servers. If you are a parent or
                guardian and you are aware that your child has provided us with
                personal information, please contact me so that I will be able
                to do necessary actions.
            </p>
            <p>
                <strong>Changes to This Privacy Policy</strong>
            </p>
            <p>
                I may update our Privacy Policy from time to time. Thus, you are
                advised to review this page periodically for any changes. I will
                notify you of any changes by posting the new Privacy Policy on
                this page.
            </p>
            <p>This policy is effective as of 2021-01-01.</p>
            <p>
                <strong>Contact Us</strong>
            </p>
            <p>
                If you have any questions or suggestions about my Privacy
                Policy, do not hesitate to contact me at
                hellocharlien@hotmail.com.
            </p>
        </main>
    );
};

export const Routes = () => (
    <Switch>
        <Redirect from="/wip/mito" to="/mito" />
        {sketchRoutes}
        {wipSketchRoutes}
        <Route
            path="/privacy-policy-td"
            component={PrivacyPolicyTwilightDungeons}
        />
        <Route path="/slides/introcc" component={SlidesIntroCC} />
        <Route path="/slides/divecc" component={SlidesDiveCC} />
        <Route path="/slides/ccse" component={SlidesProgrammerCC} />
        <Route path="/wip" component={WipListing} />
        <Route path="/admin/titleMaker" component={TitleMaker} />
        <Route path="/" component={HomePage} />
    </Switch>
);
