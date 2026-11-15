# BRASICARDS

Brazilian meme-inspired roguelite card game focused on combo-building, escalating score feedback, and strategic runs.

## Status

Early development — playable core prototype in progress.

## Tech stack

- React + TypeScript + Vite
- CSS animations and SVG-friendly UI
- LocalStorage for local run persistence
- Web Audio API planned for sound effects

## Development

```bash
npm install
npm run dev

# Run automated tests
npm test
```

## Current prototype scope

- 40-card deck across four suits
- Seven-card hand and up to seven-card discards
- Four plays and three discards per round
- Continue playing after reaching the target, or end the round manually
- Combination detection and player choice
- Score calculation with suit bonuses and multipliers
- Animated score feedback and round progression

All balance values are provisional and will be tuned through playtesting.
