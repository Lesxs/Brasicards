import { describe, expect, it } from "vitest";
import { createDeck, detectCombos, drawCards, type Card } from "../src/engine";

const card = (suit: Card["suit"], value: number): Card => ({
  id: suit + "-" + value,
  suit,
  value
});

describe("BRASICARDS deck", () => {
  it("creates forty unique cards across four suits and values one to ten", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(40);
    expect(new Set(deck.map(c => c.id)).size).toBe(40);
    expect(new Set(deck.map(c => c.suit)).size).toBe(4);
    expect(Math.min(...deck.map(c => c.value))).toBe(1);
    expect(Math.max(...deck.map(c => c.value))).toBe(10);
  });

  it("refills a hand to seven cards", () => {
    const deck = createDeck().slice(0, 10);
    const dealt = drawCards(deck, [], []);
    expect(dealt.hand).toHaveLength(7);
    expect(dealt.deck).toHaveLength(3);
  });

  it("reshuffles the discard pile when the draw pile is empty", () => {
    const recycled = [card("brasa", 1), card("ginga", 2), card("mare", 3)];
    const dealt = drawCards([], recycled, [card("sertao", 4)], 4);
    expect(dealt.hand).toHaveLength(4);
    expect(dealt.discard).toHaveLength(0);
  });
});

describe("combination recognition", () => {
  it("recognizes a pair and calculates its score", () => {
    const combos = detectCombos([card("brasa", 5), card("ginga", 5)]);
    const pair = combos.find(c => c.id === "pair");
    expect(pair).toBeDefined();
    expect(pair?.base).toBe(10);
    expect(pair?.bonus).toBe(10);
    expect(pair?.multiplier).toBe(1);
    expect(pair?.total).toBe(22);
  });

  it("recognizes a five-card straight flush", () => {
    const combos = detectCombos([2, 3, 4, 5, 6].map(v => card("ginga", v)));
    const royal = combos.find(c => c.id === "royal");
    expect(royal).toBeDefined();
    expect(royal?.multiplier).toBe(5);
    expect(royal?.suitBonus).toBe(15);
    expect(royal?.total).toBe(675);
  });

  it("recognizes a full house", () => {
    const combos = detectCombos([
      card("brasa", 4), card("ginga", 4), card("mare", 4),
      card("sertao", 8), card("ginga", 8)
    ]);
    expect(combos.some(c => c.id === "full")).toBe(true);
  });

  it("offers both four of a kind and quadra when a fifth card is selected", () => {
    const combos = detectCombos([
      card("brasa", 7), card("ginga", 7), card("mare", 7),
      card("sertao", 7), card("brasa", 3)
    ]);
    expect(combos.some(c => c.id === "four" && c.cards.length === 4)).toBe(true);
    expect(combos.some(c => c.id === "quadra" && c.cards.length === 5)).toBe(true);
  });

  it("does not treat ten-one-two as a wrapping straight", () => {
    const combos = detectCombos([
      card("brasa", 10), card("ginga", 1), card("mare", 2)
    ]);
    expect(combos.some(c => c.id === "run")).toBe(false);
  });
});
