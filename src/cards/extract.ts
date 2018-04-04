import { Action, Icon, IconList, IconType } from "./interfaces";

export const iconExtractors: { [K in IconType]: RegExp; } = {
    interrupt: /\binterrupt\b/i,
    targetted: /target(?: a)? player/i,
    gainPoints: /gains? (\d) points?/i,
    losePoints: /loses? (\d) points?/i,
    keep: /\bkeep\b/i,
    uninterruptable: /cannot be interrupted/i,
    group: /(?:anyone)|(?:everyone)|(?:all players)/i,
    lay: /\blay(?:ing)?\b[\w\s]+card/i,
    cardName: /card name/i,
    thumbs: /thumbs up\/thumbs down/i,
};

function extractIconListFromSentence(sentence: string) {
    const iconList: IconList = [];
    for (const iconTypeUncast in iconExtractors) {
        const iconType = iconTypeUncast as IconType;
        const regExp = iconExtractors[iconType];
        // TODO order iconList by where extractors appear in the sentence (sort by regex.exec().index)
        const execResult = regExp.exec(sentence);
        if (execResult != null) {
            // hackhack
            const icon: any = {
                type: iconType,
                index: execResult.index,
            };
            for (let i = 1; i < execResult.length; i++) {
                icon[i] = execResult[i];
            }
            iconList.push(icon);
        }
    }
    iconList.sort((a, b) => (a as any).index - (b as any).index);
    iconList.forEach((i) => delete (i as any).index);
    return iconList;
}

function extractIconListsFromDescription(description: string) {
    const sentences = description.split(".").filter((s) => s.trim().length > 0);
    return sentences.map((sentence) => extractIconListFromSentence(sentence));
}

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

export const ACTIONS_EXTRACTED = ACTION_STRINGS.map((actionString) => {
    const regex = /^(\w+) - (.*)$/;
    const [_, name, description] = regex.exec(actionString);
    const iconLists = extractIconListsFromDescription(description);
    const action: Action = { name, description, iconLists };
    return action;
});

console.log(ACTIONS_EXTRACTED);
