import { Card } from "./interfaces";

// tslint:disable
const CARDS: Card[] =
[
  {
    "name": "Agree",
    "description": "Interrupt. The interrupted card resolves.",
    "iconLists": [
      [
        { type: "check" },
        {
          "type": "interrupt"
        },
      ],
    ]
  },
  {
    "name": "Argue",
    "description": "You and target player alternate laying any number of cards face down (you start with Argue as the first card) until either player stops. Cards have no effect. The player who laid down fewer cards loses 2 points. The player who laid down more cards gains 2 points.",
    "iconLists": [
      [
        {
          "type": "multiCard",
          count: 3,
        },
        {
          "type": "targetted"
        },
        {
          "type": "multiCard",
          count: 3,
        }
      ],
      [
        {
          "points": "2",
          "type": "gainPoints"
        },
        {
          "points": "2",
          "type": "losePoints"
        }
      ],
    ]
  },
  {
    "name": "Belief",
    "description": "Gain 1 point. Anyone else may play Belief at this time.",
    "iconLists": [
      [
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "group"
        },
        {
            type: "card",
            text: "Belief"
        }
      ]
    ]
  },
  {
    "name": "Brag",
    "description": "Gain 3 points. Keep this card in front of you with 3 tokens. Whenever another player overtakes you in points, lose 1 token and 1 point. Discard at 0 tokens.",
    "iconLists": [
      [
        {
          "points": "3",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "keep"
        },
        {
            "type": "group"
        },
        {
            "type": "losePoints",
            points: "1"
        }
      ],
    ]
  },
  {
    "name": "Complain",
    "description": "Gain 1 point. If someone Agrees, gain 2 more points.",
    "iconLists": [
      [
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
        {
          type: "card",
          text: "Agree"
        },
        {
          type: "gainPoints",
          points: "2"
        }
      ]
    ]
  },
  {
    "name": "Compliment",
    "description": "Gain 1 point. Target player gains 1 point. If target player allows, you may put this card back in your hand.",
    "iconLists": [
      [
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
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "return"
        }
      ]
    ]
  },
  {
    "name": "Demand",
    "description": "Lose 1 point. Target a player with fewer points than you. Guess a card. If they have that card, the target must play it according to your instruction. Afterwards, it is still your turn.",
    "iconLists": [
      [
        {
          "points": "1",
          "type": "losePoints"
        }
      ],
      [
        {
          "type": "targetted"
        },
        {
          "type": "guess"
        },
        { type: "command" }
      ]
    ]
  },
  {
    "name": "Disagree",
    "description": "Interrupt. Interrupted player loses 1 point.",
    "iconLists": [
      [
        {
          "type": "interrupt"
        },
        {
          "points": "1",
          "type": "losePoints"
        }
      ]
    ]
  },
  {
    "name": "Discredit",
    "description": "Interrupt. Keep this card in front of interrupted player. Interrupted player's cards may be interrupted by any card, at which point you discard Discredit.",
    "iconLists": [
      [
        {
          "type": "interrupt"
        }
      ],
      [
        {
          "type": "keep"
        },
        {
          type: "guess"
        },
        {
          type: "interrupt"
        }
      ]
    ]
  },
  {
    "name": "Fact",
    "description": "Gain 2 points. You may play this to interrupt or remove a Discredit.",
    "iconLists": [
      [
        {
          "points": "2",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "interrupt"
        },
        {
          type: "card",
          text: "Discredit",
        }
      ]
    ]
  },
  {
    "name": "Feeling",
    "description": "Gain 1 point. Keep this card in front of you. When you target another player or another player targets you, and that player has a Feeling, you both gain 1 point and discard Feeling.",
    "iconLists": [
      [
        {
          "points": "1",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "keep"
        },
        {
          "points": "1",
          "type": "gainPoints"
        }
      ]
    ]
  },
  {
    "name": "Imply",
    "description": "Play this card with another card. Lay a third card face down. If the first card resolves, reveal and play the face-down card. It cannot be interrupted.",
    "iconLists": [
      [
        {
          "type": "multiCard",
          count: 3
        },
        {
          "type": "check",
        },
        {
          "type": "uninterruptable"
        }
      ]
    ]
  },
  {
    "name": "Insult",
    "description": "Target player loses 2 points.",
    "iconLists": [
      [
        {
          "type": "targetted"
        },
        {
          "points": "2",
          "type": "losePoints"
        }
      ]
    ]
  },
  {
    "name": "Lie",
    "description": "Lay another card face down, state what the card name is (you may lie), and play with the stated card's rules. At any time, anyone may guess what they think the card actually is. Reveal the card - if it is your stated card, gain 1 point and the card cannot be interrupted. If it's not, lose 1 point and it becomes the interrupter's turn.",
    "iconLists": [
      [
        {
          "type": "multiCard",
          count: 2,
        },
        {
          "type": "group"
        },
        {
          "type": "interrupt"
        },
      ],
      [
        {
          "points": "1",
          "type": "gainPoints"
        },
        {
          "type": "uninterruptable"
        },
        {
          "points": "1",
          "type": "losePoints"
        }
      ]
    ]
  },
  {
    "name": "Joke",
    "description": "Gain 2 points. Everyone else gains 1 point.",
    "iconLists": [
      [
        {
          "points": "2",
          "type": "gainPoints"
        }
      ],
      [
        {
          "type": "group"
        },
        {
          "points": "1",
          "type": "gainPoints"
        }
      ]
    ]
  },
  {
    "name": "Opinion",
    "description": "On the count of three, all players thumbs up/thumbs down. Players who thumb-ed in the majority gain 1 point (ties are 0 points).",
    "iconLists": [
      [
        {
          "type": "group"
        },
        {
          "type": "thumbs"
        },
        {
          "points": "1",
          "type": "gainPoints"
        }
      ]
    ]
  },
  {
    "name": "Question",
    "description": "Ask target player for a card name. If target has that card in their hand, gain 1 point and they must play it immediately. Afterwards, it is still your turn.",
    "iconLists": [
      [
        {
          "type": "targetted"
        },
        {
          "type": "guess"
        },
        {
          "type": "gainPoints",
          points: "1"
        },
      ],
    ]
  },
  {
    "name": "Scorn",
    "description": "Lose 1 point. Target player loses 3 points.",
    "iconLists": [
      [
        {
          "points": "1",
          "type": "losePoints"
        }
      ],
      [
        {
          "type": "targetted"
        },
        {
          "points": "3",
          "type": "losePoints"
        }
      ]
    ]
  },
  {
    "name": "Shout",
    "description": "Interrupt. Lose 1 point. Your next statement cannot be interrupted except by another Shout.",
    "iconLists": [
      [
        {
          "type": "interrupt"
        }
      ],
      [
        {
          "points": "1",
          "type": "losePoints"
        }
      ],
      [
        {
          "type": "uninterruptable"
        }
      ]
    ]
  },
  {
    "name": "Story",
    "description": "Gain 3 points. End your turn.",
    "iconLists": [
      [
        {
          "points": "3",
          "type": "gainPoints"
        }
      ],
      []
    ]
  }
]
;

export default CARDS;

