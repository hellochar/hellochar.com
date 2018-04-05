import { Card } from "./interfaces";

// tslint:disable
const TRAITS: Card[] =
[
  {
    "isTrait": true,
    "name": "Crush",
    "description": "Pick a target player. Gain 1 point when that player targets you with a card. Lose 1 point when that player Compliments a different player.",
    "iconLists": [
      [
        {
          "type": "targetted"
        },
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
        { type: "card", text: "Compliment" },
        { type: "pointOther" },
        {
          "points": "1",
          "type": "losePoints"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Intellectual",
    "description": "You may play and then discard this card as a Fact. You get no points from Feeling.",
    "iconLists": [
      [
        {
          "type": "card",
          "text": "Fact"
        }
      ],
      [
        {
          "type": "card",
          "text": "Feeling"
        },
        {
          "type": "disallow",
          disallowed: {
              "type": "gainPoints",
              "points": "1"
          }
        }
      ],
    ]
  },
  {
    "isTrait": true,
    "name": "Empath",
    "description": "Pick a target player. Gain 1 point when target gains any points. Lose 1 point when target loses any points.",
    "iconLists": [
      [
        {
          "type": "targetted"
        },
        {
          "type": "gainPoints"
        },
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "targetted"
        },
        {
          "type": "losePoints"
        },
        {
          "points": "1",
          "type": "losePoints"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Curious",
    "description": "Gain 1 point whenever another player plays a Belief, Opinion, or Feeling. You must play Questions first whenever they're in your hand.",
    "iconLists": [
      [
        {
          "type": "card",
          text: "Belief",
        },
        {
          "type": "card",
          text: "Opinion",
        },
        {
          "type": "card",
          text: "Feeling",
        },
        {
          "points": "1",
          "type": "gainPoints"
        },
      ],
      [
          {
              type: "card",
              text: "Question"
          },
          { type: "speak" }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Charismatic",
    "description": "The first card you play during your turn cannot be interrupted. You may not play Facts.",
    "iconLists": [
      [
        {
          "type": "uninterruptable"
        },
      ],
      [
        {
          "type": "disallow",
        },
        {
            type: "card",
            text: "Fact"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Virtuous",
    "description": "Add a counter to Virtuous when you play a card that gives another player a point. When you would lose points, you may instead lose counters on Virtuous. At the start of your turn, you lose 1 point, and the player with the fewest points gains 1 point.",
    "iconLists": [
      [
        {
          "type": "heart"
        },
        {
          "type": "tokens"
        },
        {
            "type": "disallow",
            disallowed: {
                "points": "1",
                "type": "losePoints"
            },
        }
    ],
    [
        {
            "points": "1",
            "type": "losePoints"
        },
        {
          "points": "1",
          "type": "gainPoints"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Rude",
    "description": "You may play any card as an interrupt, but lose 1 point when doing so.",
    "iconLists": [
      [
        {
          "type": "guess"
        },
        {
          "type": "interrupt"
        },
        {
            "type": "losePoints",
            points: "1"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Polite",
    "description": "When you play an interrupt, the interruptee must allow it. If they do, you both gain 1 point.",
    "iconLists": [
      [
        {
          "type": "interrupt"
        },
        {
          "type": "allowed"
        },
        {
          "points": "1",
          "type": "gainPoints"
        },
        {
          "points": "1",
          "type": "gainPoints"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Liar",
    "description": "You may play any card as a Lie without needing the Lie card. Any player may use normal cards to interrupt any card you play.",
    "iconLists": [
      [
        {
          "type": "guess"
        },
        {
          "type": "card",
          "text": "Lie"
        },
      ],
      [
        {
          "type": "group"
        },
        {
          "type": "guess"
        },
        {
          "type": "interrupt"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Candid",
    "description": "Play with your hand revealed to all players. You never lose points.",
    "iconLists": [
      [
        {
          "type": "group"
        },
        {
          "type": "eye"
        },
      ],
      [
          {
              "type": "disallow",
              disallowed: {
                  "type": "losePoints",
                  "points": "1"
              }
          },
          {
              "type": "disallow",
              disallowed: {
                  "type": "losePoints",
                  "points": "2"
              }
          },
          {
              "type": "disallow",
              disallowed: {
                  "type": "losePoints",
                  "points": "3"
              }
          },
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Stoic",
    "description": "If you would gain or lose points due to a card or trait of another player, gain or lose 1 less point.",
    "iconLists": [
      [
          {
              type: "gainPoints",
          },
          {
              type: "arrowDown",
          }
      ],
      [
          {
              type: "losePoints",
          },
          {
              type: "arrowUp",
          }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Sensitive",
    "description": "If you would gain or lose points due to a card or trait of another player, gain or lose 1 more point.",
    "iconLists": [
      [
          {
              type: "gainPoints",
          },
          {
              type: "arrowUp",
          }
      ],
      [
          {
              type: "losePoints",
          },
          {
              type: "arrowDown",
          }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Anxious",
    "description": "Flip a coin whenever you play a card. If tails, that card is interrupted by yourself. Flip a coin when a card makes you lose points. If heads, you interrupt that card.",
    "iconLists": [
      [
        {
          "type": "guess"
        },
        {
          "type": "coinToss"
        },
        {
          "type": "interrupt"
        },
      ],
      [
        {
          "type": "losePoints"
        },
        {
          "type": "coinToss"
        },
        {
          "type": "interrupt"
        },
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Closeminded",
    "description": "Pick a target player. You do not gain or lose points from cards or traits of that player.",
    "iconLists": [
        [
            {
                type: "targetted",
            },
            {
                type: "disallow",
                disallowed: {
                    type: "gainPoints"
                }
            },
            {
                type: "disallow",
                disallowed: {
                    type: "losePoints"
                }
            },
        ]
    ]
  },
  {
    "isTrait": true,
    "name": "Angry",
    "description": "When you are interrupted, add a counter to this card. On the third interruption, the Insult effect is triggered targeted towards the interrupter, and the counter is reset.",
    "iconLists": [
        [
            {
                type: "interrupt"
            },
            {
                type: "tokens"
            },
            {
                type: "card",
                text: "Insult"
            }
        ]
    ]
  },
  {
    "isTrait": true,
    "name": "Narcissistic",
    "description": "Discard all other traits. You may target yourself and only yourself with cards.",
    "iconLists": [
      [
          {
            type: "targetted"
          },
          {
            type: "disallow",
          },
          {
            type: "group"
          },
      ]
    ]
  }
]
;

export default TRAITS;
