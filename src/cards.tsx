import * as React from "react";

const ALL_ACTIONS_STRING =
`
Agree - Interrupt. The interrupted card resolves.
Argue - You and target player alternate laying any number of cards face down (you start with Argue as the first card) until either player stops. Cards have no effect. The player who laid down fewer cards loses 2 points. The player who laid down more cards gains 2 points.
Belief - Gain 1 point. Anyone else may play Belief at this time.
Brag - Gain 3 points. Keep this card in front of you with 3 tokens. Whenever another player overtakes you in points, lose 1 token and 1 point. Discard at 0 tokens.
Complain - Gain 1 point. If someone Agrees, gain 2 more points.
Compliment - Gain 1 point. Target player gains 1 point. If target player allows, you may put this card back in your hand.
Demand - Lose 1 point. Target a player with fewer points than you. Choose a card name. The target, if they have that card name, must play it according to your instruction. At the end of the card, it is still your turn.
Disagree - Interrupt. Interrupted player loses 1 point.
Discredit - Interrupt. Keep this card in front of interrupted player. Interrupted player's actions may be interrupted by any card, at which point you discard Discredit.
Fact - Gain 2 points. You may play this to interrupt and cancel a Discredit.
Feeling - Gain 1 point. Keep this card in front of you. When you target another player or another player targets you, and that player has a Feeling, you both gain 1 point and discard Feeling.
Imply - Play this card with another card. Lay a third card face down. If the first card resolves, reveal the the face-down card and resolve it. It cannot be interrupted.
Insult - Target player loses 2 points.
Lie - Lay another card face down, state what the card name is (you may lie), and play with the stated card's rules. At any time, anyone may interrupt Lie by stating what they think the face down card actually is. Reveal the card - if it is the card you stated, gain 1 point and the card cannot be interrupted. If it's not, lose 1 point and it becomes the interrupter's turn.
Joke - Gain 2 points. Everyone else gains 1 point.
Opinion - On the count of three, all players thumbs up/thumbs down. Players who thumb-ed in the majority gain 1 point (ties are 0 points).
Question - Ask target player for a card name. If target has that card in their hand, they must play it immediately. Afterwards, it is still your turn.
Scorn - Lose 1 point. Target player loses 3 points.
Shout - Interrupt. Lose 1 point. Your next statement cannot be interrupted except by another Shout.
Story - Gain 3 points. End your turn.
`;

const ACTION_STRINGS = ALL_ACTIONS_STRING.split("\n").filter((s) => s.trim().length > 0);

type Modifier = "interrupt" | "targetted" | "gainPoints" | "losePoints" | "keep" | "uninterruptable" | "group" | "lay";

type Action = {
    name: string;
    description: string;
    modifiers: Modifier[];
};

const modifierExtractors: { [K in Modifier]: RegExp; } = {
    interrupt: /interrupt\./i,
    targetted: /target( a)? player/i,
    gainPoints: /gain(s)? (\d) point(s)?/i,
    losePoints: /lose(s)? (\d) point(s)?/i,
    keep: /keep/i,
    uninterruptable: /cannot be interrupted/i,
    group: /(anyone)|(everyone)|(all players)/i,
    lay: /\blay(ing)?\b[\w\s]+card/i,
};

const modifierRenders: { [K in Modifier]?: React.SFC<{ description: string }> } = {
    interrupt: () => (
        <div className="modifier interrupt"><i className="fa fa-hand-paper-o"></i></div>
    ),
    gainPoints: ({description}) => {
        const [_, __, points] = modifierExtractors.gainPoints.exec(description);
        return <div className="modifier gainPoints">+{points}</div>;
    },
    losePoints: ({description}) => {
        const [_, __, points] = modifierExtractors.losePoints.exec(description);
        return <div className="modifier losePoints">-{points}</div>;
    },
    group: () => (
        <div className="modifier group"><i className="fa fa-users" /></div>
    ),
    targetted: () => (
        <div className="modifier targetted"><i className="fa fa-user" /></div>
    ),
    uninterruptable: () => (
        <div className="modifier uninterruptable"><i className="fa fa-shield" /></div>
    ),
    lay: () => (
        <div className="modifier lay">
            <div className="lay1" />
            <div className="lay2" />
            <div className="lay3" />
        </div>
    )
}

const ACTIONS = ACTION_STRINGS.map((actionString) => {
    const regex = /^(\w+) - (.*)$/;
    const [_, name, description] = regex.exec(actionString);

    const modifiers: Modifier[] = [];
    for (const modifierNameUncast in modifierExtractors) {
        const modifierName = modifierNameUncast as Modifier;
        const regexp = modifierExtractors[modifierName];
        if (regexp.test(description)) {
            modifiers.push(modifierName);
        }
    }

    const action: Action = { name, description, modifiers };
    return action;
});

const ActionCard: React.SFC<{action: Action}> = ({ action }) => {
    const modifierEls = action.modifiers.map((modifier) => {
        const ModifierRender = modifierRenders[modifier];
        if (ModifierRender != null) {
            return <ModifierRender description={action.description} />;
        } else {
            return <div className={`modifier ${modifier}`}>{modifier}</div>;
        }
    });
    return (
        <div className={`card card-${action.name.toLowerCase()}`}>
            <div className="card-wrapper">
                <div className="action-name">
                    {action.name}
                    {...modifierEls}
                </div>
                <div className="action-description">{action.description}</div>
                {/* <div className="action-name corner corner-reverse">{action.name}</div> */}
            </div>
        </div>
    );
};

export default class Cards extends React.Component<{}, {}> {
    render() {
        const actionCards = ACTIONS.map((action) => <ActionCard action={action} />);
        return (
            <div className="actions">
                {actionCards}
            </div>
        );
    }
}
