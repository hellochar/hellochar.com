import * as classnames from "classnames";
import * as React from "react";

import CARDS from "./cards";
import { iconExtractors, TRAITS_EXTRACTED } from "./extract";
import { Card, Icon, IconGainPoints, IconLosePoints, IconType } from "./interfaces";
import TRAITS from "./traits";

const iconRenderers: { [K in IconType]: React.SFC<{ icon: Icon }> } = {
    allowed: () => (
        <div className="icon allowed"><i className="fa fa-thumbs-o-up"></i></div>
    ),
    coinToss: () => (
        <div className="icon coinToss"><img src="/assets/noun_cointoss_cc.svg" /></div>
    ),
    interrupt: () => (
        <div className="icon interrupt"><i className="fa fa-hand-paper-o"></i></div>
    ),
    gainPoints: ({icon}) => {
        return <div className="icon gainPoints">+{icon.points}</div>;
    },
    losePoints: ({icon}) => {
        return <div className="icon losePoints">-{icon.points}</div>;
    },
    group: () => (
        <div className="icon group"><i className="fa fa-users" /></div>
    ),
    targetted: () => (
        <div className="icon targetted"><i className="fa fa-crosshairs" /></div>
    ),
    uninterruptable: () => (
        <div className="icon uninterruptable"><i className="fa fa-shield" /></div>
    ),
    thumbs: () => (
        <div className="icon thumbs">
            <i className="fa fa-thumbs-o-up"></i>
            <i className="fa fa-thumbs-o-down"></i>
        </div>
    ),
    guess: () => (
        <div className="icon guess">
            <div className="cardshape">?</div>
        </div>
    ),
    card: ({icon}) => (
        <div className="icon card">
            <div className="cardshape text">
                <div className="text-container">{icon.text}</div>
            </div>
        </div>
    ),
    command: () => (
        <div className="icon command">
            <img src="/assets/noun_command_cc.svg" />
        </div>
    ),
    check: () => (
        <div className="icon check">
            <i className="fa fa-check"></i>
        </div>
    ),
    disallow: ({ icon }) => (
        <div className="icon disallow">
            { icon.disallowed != null ? <IconRenderer icon={icon.disallowed} /> : null }
            <div className="no-entry">🚫</div>
        </div>
    ),
    eye: () => (
        <div className="icon eye"><i className="fa fa-eye"></i></div>
    ),
    heart: () => (
        <div className="icon heart"><div className="heart-container">&#10084;</div></div>
    ),
    arrowDown: () => (
        <div className="icon arrowDown">↴</div>
    ),
    arrowUp: () => (
        <div className="icon arrowUp">↴</div>
    ),
    return: () => (
        <div className="icon return">
            <i className="fa fa-reply"></i>
        </div>
    ),
    keep: () => (
        <div className="icon keep">
            {/* <div className="cardshape"></div> */}
            <img src="/assets/keep_icon.png" />
        </div>
    ),
    pointOther: () => (
        <div className="icon pointOther">
            <img src="/assets/noun_point_other_cc.svg" />
        </div>
    ),
    multiCard: ({icon}) => {
        const {count = 2} = icon;
        const cardShapes: JSX.Element[] = [];
        for (let i = 0; i < count; i++) {
            cardShapes.push(<div className="cardshape"></div>);
        }
        return (
            <div className="icon lay">
                <div className="cards-container">
                    {...cardShapes}
                </div>
            </div>
        );
    },
    speak: () => (
        <div className="icon speak">
            <img src="/assets/noun_speak_cc.svg" />
        </div>
    ),
    tokens: () => (
        <div className="icon tokens">⛁</div>
    ),
}

const IconRenderer: React.SFC<{icon: Icon}> = ({ icon }) => {
    const Renderer = iconRenderers[icon.type];
    return <Renderer icon={icon} />;
}

const ActionCard: React.SFC<{card: Card}> = ({ card }) => {
    const iconListsElements = card.iconLists.map((iconList) => {
        const listElements = iconList.map((icon) =>
            <IconRenderer icon={icon} />,
        );
        return (
            <div className="card-icon-list">
                {...listElements}
            </div>
        )
    });
    function renderDecorativeUnderline() {
        return (
            <div className="card-name-underline">
                <div className="underline underline-left"></div>
                <div className="underline-dot"></div>
                <div className="underline underline-right"></div>
            </div>
        );
    }
    const classNames = classnames("card", `card-${card.name.toLowerCase()}`, { "trait": card.isTrait });
    return (
        <div className={classNames}>
            <div className="card-wrapper">
                <div className="card-name">
                    {card.name}
                    { card.isTrait ? renderDecorativeUnderline() : null }
                    {/* <div className="card-name-positioner">
                        <div className="card-name-vertical">{action.name.substr(1)}</div>
                    </div> */}
                </div>
                <div className="card-description">
                    <div className="card-icon-lists">
                        {...iconListsElements}
                    </div>
                    <div className="card-rules">{card.description}</div>
                </div>
                {/* <div className="card-name corner corner-reverse">{action.name}</div> */}
            </div>
        </div>
    );
};

export default class Cards extends React.Component<{}, {}> {
    render() {
        // const cardCards = ACTIONS.map((action) => <ActionCard action={action} />);
        const cardCards = TRAITS.map((action) => <ActionCard card={action} />);
        const pages: JSX.Element[][] = [];
        for (let i = 0; i < cardCards.length; i++) {
            const card = cardCards[i];
            const pageIndex = Math.floor(i / 9);
            pages[pageIndex] = pages[pageIndex] || [];
            pages[pageIndex].push(card);
        }
        const pageEls = pages.map((pageChildren) => <div className="page">{...pageChildren}</div>);
        // const cardCards = ACTIONS_EXTRACTED.map((action) => <ActionCard action={action} />);
        return (
            <>
                {...pageEls}
                <div className="attribution">
                <h1>Attribution</h1>
                Icons by fontawesome.
                Command icon by Ruslan Dezign from the Noun Project.
                Crush pointing by Magicon from the Noun Project.
                speak by Chanut is Industries from the Noun Project.
                coin by Iain Hector from the Noun Project.
                </div>
            </>
        );
    }
}
