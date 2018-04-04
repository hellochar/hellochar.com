export type IconInterrupt = { type: "interrupt" }
export type IconTargetted = { type: "targetted" }
export type IconGainPoints = { type: "gainPoints", points: string }; // 1 = points
export type IconLosePoints = { type: "losePoints", points: string }; // 1 = points
export type IconKeep = { type: "keep" };
export type IconUninterruptable = { type: "uninterruptable" };
// TODO rename to anyone/everyone
export type IconGroup = { type: "group" };
export type IconGuess = { type: "guess" };
export type IconThumbs = { type: "thumbs" };
// TODO rename to multiCard
export type IconMultiCard = { type: "multiCard", count: boolean };
export type IconCard = { type: "card", text?: string };
export type IconCheck = { type: "check" };
export type IconReturn = { type: "return" };
export type IconImply = { type: "imply" };
export type IconCommand = { type: "command" };

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
IconImply |
IconCommand |
IconMultiCard) & { [index: string]: any }
;

export type IconType = Icon["type"];

export type IconList = Icon[];

export type Action = {
    name: string;
    description: string;
    iconLists: IconList[];
};
