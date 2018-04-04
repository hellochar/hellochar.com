import { Card } from "./interfaces";

// tslint:disable
const TRAITS: Card[] =
[
  {
    "isTrait": true,
    "name": "Crush",
    "description": "Pick a target player. Gain 1 point when that player targets you with a card. Lose 1 point when that player targets another player with a card.",
    "iconLists": [
      [
        {
          "type": "targetted"
        }
      ],
      [
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
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
          "type": "card"
        }
      ],
      []
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
        }
      ],
      [
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
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
    "description": "Gain 1 point whenever another player plays a Belief, Fact, Opinion, or Feeling. You must play Questions first whenever they're in your hand.",
    "iconLists": [
      [
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "card"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Charismatic",
    "description": "The first card you play during your turn cannot be interrupted.",
    "iconLists": [
      [
        {
          "type": "uninterruptable"
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
          "type": "card"
        }
      ],
      [],
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
    "description": "You may play any card as an interrupt, but take a 1 point penalty when doing so.",
    "iconLists": [
      [
        {
          "type": "card"
        },
        {
          "type": "interrupt"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Polite",
    "description": "When you play an interrupt, the interruptee chooses to allow the card to be played. If they do, you both gain 1 point.",
    "iconLists": [
      [
        {
          "type": "card"
        },
        {
          "type": "interrupt"
        }
      ],
      [
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
          "type": "card"
        }
      ],
      [
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
          "type": "card"
        },
        {
          "type": "group"
        }
      ],
      []
    ]
  },
  {
    "isTrait": true,
    "name": "Stoic",
    "description": "If you would lose or gain a point due to a card or trait of another player, lose or gain 1 less point.",
    "iconLists": [
      []
    ]
  },
  {
    "isTrait": true,
    "name": "Sensitive",
    "description": "If you would lose or gain a point due to a card or trait of another player, lose or gain 1 more point.",
    "iconLists": [
      []
    ]
  },
  {
    "isTrait": true,
    "name": "Anxious",
    "description": "Flip a coin when you play an card. If tails, that card is unresolved and discarded immediately.",
    "iconLists": [
      [
        {
          "type": "card"
        }
      ],
      [
        {
          "type": "check"
        }
      ]
    ]
  },
  {
    "isTrait": true,
    "name": "Closeminded",
    "description": "You may not lose or gain points from cards or traits of the player sitting opposite you (both players if there's an odd number of players).",
    "iconLists": [
      []
    ]
  },
  {
    "isTrait": true,
    "name": "Angry",
    "description": "when you are interrupted, add a counter to this card. On the third interruption, the Disrespect effect is triggered targeted towards the interrupter, and the counter is reset.",
    "iconLists": [
      [],
      []
    ]
  },
  {
    "isTrait": true,
    "name": "Narcissistic",
    "description": "Discard all other traits. You may target yourself and only yourself with cards.",
    "iconLists": [
      [],
      []
    ]
  }
]
;

export default TRAITS;
