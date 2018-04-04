import { Card, Icon, IconList, IconType } from "./interfaces";

export const iconExtractors: { [K in IconType]: RegExp; } = {
    interrupt: /\binterrupt\b/i,
    targetted: /target(?: a)? player/i,
    gainPoints: /gains? (\d) points?/i,
    losePoints: /loses? (\d) points?/i,
    keep: /\bkeep\b/i,
    uninterruptable: /cannot be interrupted/i,
    group: /(?:anyone)|(?:everyone)|(?:all players)/i,
    multiCard: /\blay(?:ing)?\b[\w\s]+card/i,
    guess: /card name/i,
    thumbs: /thumbs up\/thumbs down/i,
    card: /\bplay\b/i,
    check: /resolves?/i,
    return: /foodummynevertest/,
    command: /your instruction/i,
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

const ALL_TRAITS_STRING =
`
Crush - Pick a target player. Gain 1 point when that player targets you with a card. Lose 1 point when that player targets another player with a card.
Intellectual - You may play and then discard this card as a Fact. You get no points from Feeling.
Empath - Pick a target player. Gain 1 point when target gains any points. Lose 1 point when target loses any points.
Curious - Gain 1 point whenever another player plays a Belief, Fact, Opinion, or Feeling. You must play Questions first whenever they're in your hand.
Charismatic - The first action of your turn cannot be interrupted.
Virtuous - Add a counter to Virtuous when you play an action that gives another player a point. When you would lose points, you may instead lose counters on Virtuous. At the start of your turn, you lose 1 point, and the player with the fewest points gains 1 point.
Rude - You may play any card as an interrupt, but take a 1 point penalty when doing so.
Polite - When you play an interrupt, the interruptee chooses to allow the card to be played. If they do, you both gain 1 point.
Liar - You may play any card as a Lie without needing the Lie card. Any player may use normal cards to interrupt you.
Candid - Play with your hand revealed to all players. You never lose points.
Stoic - If you would lose or gain a point due to a card or trait of another player, lose or gain 1 less point.
Dependent - If you would lose or gain a point due to a card or trait of another player, lose or gain 1 more point.
Anxious - Flip a coin when you play an action. If tails, that card is unresolved and discarded immediately.
Closeminded - You may not lose or gain points from actions or traits of the player sitting opposite you (both players if there's an odd number of players).
Angry - when you are interrupted, add a counter to this card. On the third interruption, the Disrespect effect is triggered targeted towards the interrupter, and the counter is reset.
Narcissistic - Discard all other traits. You may target yourself and only yourself with actions.
`;

const TRAITS_STRINGS = ALL_TRAITS_STRING.split("\n").filter((s) => s.trim().length > 0);

export const TRAITS_EXTRACTED = TRAITS_STRINGS.map((traitString) => {
    const regex = /^(\w+) - (.*)$/;
    const [_, name, description] = regex.exec(traitString);
    const iconLists = extractIconListsFromDescription(description);
    const action: Card = { isTrait: true, name, description, iconLists };
    return action;
});

console.log(TRAITS_EXTRACTED);

// const ALL_ACTIONS_STRING =
// `
// Agree - Interrupt. The interrupted card resolves.
// Argue - You and target player alternate laying any number of cards face down (you start with Argue as the first card) until either player stops. Cards have no effect. The player who laid down fewer cards loses 2 points. The player who laid down more cards gains 2 points.
// Belief - Gain 1 point. Anyone else may play Belief at this time.
// Brag - Gain 3 points. Keep this card in front of you with 3 tokens. Whenever another player overtakes you in points, lose 1 token and 1 point. Discard at 0 tokens.
// Complain - Gain 1 point. If someone Agrees, gain 2 more points.
// Compliment - Gain 1 point. Target player gains 1 point. If target player allows, you may put this card back in your hand.
// Demand - Lose 1 point. Target a player with fewer points than you. Choose a card name. The target, if they have that card name, must play it according to your instruction. At the end of the card, it is still your turn.
// Disagree - Interrupt. Interrupted player loses 1 point.
// Discredit - Interrupt. Keep this card in front of interrupted player. Interrupted player's actions may be interrupted by any card, at which point you discard Discredit.
// Fact - Gain 2 points. You may play this to interrupt and cancel a Discredit.
// Feeling - Gain 1 point. Keep this card in front of you. When you target another player or another player targets you, and that player has a Feeling, you both gain 1 point and discard Feeling.
// Imply - Play this card with another card. Lay a third card face down. If the first card resolves, reveal the the face-down card and resolve it. It cannot be interrupted.
// Insult - Target player loses 2 points.
// Lie - Lay another card face down, state what the card name is (you may lie), and play with the stated card's rules. At any time, anyone may interrupt Lie by stating what they think the face down card actually is. Reveal the card - if it is the card you stated, gain 1 point and the card cannot be interrupted. If it's not, lose 1 point and it becomes the interrupter's turn.
// Joke - Gain 2 points. Everyone else gains 1 point.
// Opinion - On the count of three, all players thumbs up/thumbs down. Players who thumb-ed in the majority gain 1 point (ties are 0 points).
// Question - Ask target player for a card name. If target has that card in their hand, they must play it immediately. Afterwards, it is still your turn.
// Scorn - Lose 1 point. Target player loses 3 points.
// Shout - Interrupt. Lose 1 point. Your next statement cannot be interrupted except by another Shout.
// Story - Gain 3 points. End your turn.
// `;

// const ACTION_STRINGS = ALL_ACTIONS_STRING.split("\n").filter((s) => s.trim().length > 0);

// export const ACTIONS_EXTRACTED = ACTION_STRINGS.map((actionString) => {
//     const regex = /^(\w+) - (.*)$/;
//     const [_, name, description] = regex.exec(actionString);
//     const iconLists = extractIconListsFromDescription(description);
//     const action: Action = { name, description, iconLists };
//     return action;
// });

// console.log(ACTIONS_EXTRACTED);
