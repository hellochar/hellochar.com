export type IconInterrupt = { type: "interrupt" }
export type IconTargetted = { type: "targetted" }
export type IconGainPoints = { type: "gainPoints", points?: string }; // 1 = points
export type IconLosePoints = { type: "losePoints", points?: string }; // 1 = points
export type IconKeep = { type: "keep" };
export type IconUninterruptable = { type: "uninterruptable" };
// TODO rename to anyone/everyone
export type IconGroup = { type: "group" };
export type IconGuess = { type: "guess" };
export type IconThumbs = { type: "thumbs" };
// TODO rename to multiCard
export type IconMultiCard = { type: "multiCard", count: number };
export type IconCard = { type: "card", text?: string };
export type IconCheck = { type: "check" };
export type IconReturn = { type: "return" };
export type IconCommand = { type: "command" };
export type IconPointOther = { type: "pointOther" };
export type IconSpeak = { type: "speak" };
export type IconDisallow = { type: "disallow", disallowed?: Icon };
export type IconHeart = { type: "heart" };
export type IconTokens = { type: "tokens" };
export type IconAllowed = { type: "allowed" };
export type IconEye = { type: "eye" };
export type IconArrowDown = { type: "arrowDown" };
export type IconArrowUp = { type: "arrowUp" };
export type IconCoinToss = { type: "coinToss" };

export type Icon =
(IconInterrupt |
IconTargetted |
IconGainPoints |
IconLosePoints |
IconKeep |
IconUninterruptable |
IconGroup |
IconGuess |
IconThumbs |
IconCard |
IconCheck |
IconReturn |
IconCommand |
IconDisallow |
IconPointOther |
IconSpeak |
IconHeart |
IconTokens |
IconAllowed |
IconEye |
IconArrowDown |
IconArrowUp |
IconCoinToss |
IconMultiCard) & { [index: string]: any }
;

export type IconType = Icon["type"];

export type IconList = Icon[];

export type Card = {
    isTrait?: boolean;
    name: string;
    description: string;
    iconLists: IconList[];
};
