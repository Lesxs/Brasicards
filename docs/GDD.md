# BRASICARDS — Game Design Document

Status: planning baseline for prototype 0.1. Balance values remain provisional.

## Vision
A Brazilian meme-inspired roguelite card game focused on expressive combos, escalating score feedback, meaningful run decisions, and a playful fictional casino atmosphere. No real-money betting, payments, or cash-out.

## Core loop
1. Draw and manage a hand of seven cards.
2. Select two to five cards.
3. Choose one detected valid combination.
4. Resolve points, suit effects, bonuses, and multipliers.
5. Refill the hand to seven.
6. Spend up to three discards and use up to four plays per round.
7. Meet the score target, collect resources, visit shops/events, and face bosses.

## Basic deck
- 40 cards: four suits, values 1–10.
- Suits: Brasa, Ginga, Maré, Sertão.
- Initial hand: seven cards.
- Selected cards not consumed by the chosen combination remain in hand.
- When the draw pile is empty, shuffle the discard pile into a new draw pile.

## Suits
Small automatic bonuses, tuned during playtesting:
- Brasa: +2 points per played card.
- Ginga: +3 points per card in Escadinha or Sequência de Ouro.
- Maré: +2 points per card when the combination uses at least three suits.
- Sertão: +2 points per card in combinations of three or more cards.

## Combinations
Initial catalogue:
- Parceria: pair, fixed bonus 10, multiplier x1.
- Trinca de Respeito: three of a kind, bonus 25, x2.
- Bonde Fechado: four of a kind, bonus 50, x3.
- Escadinha: 3–5 consecutive values, bonus 20 plus 8 per card above three, x2.
- Revoada: 3–5 cards of one suit, bonus 20 plus 8 per card above three, x2.
- Virada de Mesa: full house (three + pair), bonus 65, x3.
- Quadra Suprema: four of a kind plus one extra card, bonus 75, x4.
- Sequência de Ouro: five consecutive cards of one suit, bonus 100, x5.
- Sequences do not wrap from 10 to 1.
- When multiple combinations are available, the player chooses one. Only cards in that combination are consumed.

## Round rules
- Four plays per round.
- Three discards per round.
- Each discard may contain any number of cards up to seven.
- Discards do not consume plays.
- Refill the hand to seven after plays and discards whenever cards are available.
- Reaching the score target does not immediately end the round; the player may continue using remaining plays.

## Resources
- Points: meet round and boss targets.
- Chips: shop currency; starting balance provisionally 20.
- Luck Factor: accumulates through combinations, cards, relics, and events; spent on the slot machine.
- These resources are not freely interchangeable.
- Round completion reward: fixed chips plus a capped excess-score bonus (to be balanced).
- Luck Factor carries across rounds in a campaign.

## Slot machine
- Three reels and Brazilian-themed symbols.
- One powerful spin or three smaller spins.
- Rewards are points only.
- Luck Factor is generated through play and effects.
- Controlled randomness; no real-money mechanics.

## Special cards
- 12-card initial catalogue; mixed availability (some available from the start, others unlocked permanently).
- No duplicate copies of the same special card during a run.
- Fixed rarity: Uncommon, Rare, Epic, Legendary.
- Only selected cards evolve, through specific events and rewards.
- Evolution modifies the existing card; it does not create a duplicate or change its rarity.
- Proposed evolvers: Caramelo Supremo, Fusca Azul, Limão Azedo, Pé Quente.

## Relics
- 12 initial relic concepts across score, combinations, slot machine, and economy/discard.
- Maximum five relics held at once.
- No duplicate relics and no stacking duplicate copies.
- Different relic effects may interact when explicitly designed and balanced.
- Relics can be bought, earned, and sold.

## Shop
- Four offers per visit: special card, relic, upgrade, and variable offer.
- Mandatory visit after each three normal rounds, before each boss.
- Paid stock refresh.
- Can sell special cards and relics.
- No real-money purchases.

## Campaign
Three stages, each with three normal rounds, a shop, and a boss:
1. A cidade acordou — boss: O Fiscal.
2. O caos começou — boss: O Azarado.
3. A última aposta — boss: Máquina Quebrada.
Total: nine normal rounds and three boss encounters.
After each boss, choose one of three rewards.

## Events
Special encounters between rounds. They offer two or three clear choices with explicit costs and consequences. Events may award cards, relics, chips, or eligible card evolutions.

## Permanent progression
Unlocks add variety, not permanent attribute bonuses. Unlocks, achievements, and records persist after a run ends.

## Presentation and accessibility
- Desktop-first, responsive mobile layout.
- Dark casino atmosphere, green felt, gold, red, and neon accents.
- Original illustrations; no emoji used as substitute artwork.
- Score popups, multiplier emphasis, combo callouts, chip animations, and slot-machine effects.
- Common combos are quick and restrained; rare and exceptional combos receive stronger presentation.
- Reduced-motion preference respected; separate music and SFX controls planned.

## Technical direction
- React + TypeScript + Vite.
- Game engine separated from UI.
- CSS/SVG animations and Web Audio API.
- LocalStorage save for the initial version.
- No in-game AI.

## Prototype 0.1 scope
- Main table and hand.
- 40-card deck.
- Card selection and combination detection.
- Four plays and three discards.
- Score and suit bonus calculations.
- Animated score feedback.
- Round target and result flow.
- Basic local save.

## Open balance work
All exact target curves, combo point values, shop prices, reward rates, relic/card effects, and slot symbol probabilities are provisional until automated tests and repeated playtests.
