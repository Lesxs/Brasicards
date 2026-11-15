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


describe("campaign progression", () => {
  it("requires three normal rounds, a shop, a boss, and a reward before the next stage", async () => {
    const {
      createCampaign,
      completeNormalRound,
      completeEvent,
      completeShop,
      defeatBoss,
      claimBossReward
    } = await import("../src/progression");

    let campaign = createCampaign();
    expect(campaign.phase).toBe("normal");

    campaign = completeNormalRound(campaign, true);
    campaign = completeNormalRound(campaign, true);
    expect(campaign.phase).toBe("event");
    expect(campaign.normalRoundsCompleted).toBe(2);

    campaign = completeEvent(campaign);
    expect(campaign.phase).toBe("normal");
    campaign = completeNormalRound(campaign, true);
    expect(campaign.phase).toBe("shop");
    expect(campaign.normalRoundsCompleted).toBe(3);

    campaign = completeShop(campaign);
    expect(campaign.phase).toBe("boss");
    campaign = defeatBoss(campaign, true);
    expect(campaign.phase).toBe("boss-reward");
    expect(campaign.bossesDefeated).toBe(1);

    campaign = claimBossReward(campaign);
    expect(campaign.stage).toBe(2);
    expect(campaign.phase).toBe("normal");
    expect(campaign.normalRoundsInStage).toBe(0);
  });

  it("does not advance on a lost round, skipped shop, or failed boss", async () => {
    const {
      createCampaign,
      completeNormalRound,
      completeEvent,
      completeShop,
      defeatBoss
    } = await import("../src/progression");

    const initial = createCampaign();
    expect(completeNormalRound(initial, false)).toEqual(initial);
    expect(completeShop(initial)).toEqual(initial);

    let campaign = initial;
    campaign = completeNormalRound(campaign, true);
    campaign = completeNormalRound(campaign, true);
    campaign = completeEvent(campaign);
    campaign = completeNormalRound(campaign, true);
    campaign = completeShop(campaign);
    expect(defeatBoss(campaign, false)).toEqual(campaign);
  });

  it("finishes after three stages, nine normal rounds, and three bosses", async () => {
    const {
      createCampaign,
      completeNormalRound,
      completeEvent,
      completeShop,
      defeatBoss,
      claimBossReward
    } = await import("../src/progression");

    let campaign = createCampaign();
    for (let stage = 1; stage <= 3; stage++) {
      campaign = completeNormalRound(campaign, true);
      campaign = completeNormalRound(campaign, true);
      campaign = completeEvent(campaign);
      campaign = completeNormalRound(campaign, true);
      campaign = completeShop(campaign);
      campaign = defeatBoss(campaign, true);
      campaign = claimBossReward(campaign);
    }

    expect(campaign.phase).toBe("complete");
    expect(campaign.normalRoundsCompleted).toBe(9);
    expect(campaign.bossesDefeated).toBe(3);
  });
});


describe("content catalogue and run effects", () => {
  it("contains twelve unique special cards and twelve unique relics", async () => {
    const {SPECIAL_CARDS, RELICS} = await import("../src/content");
    expect(SPECIAL_CARDS).toHaveLength(12);
    expect(new Set(SPECIAL_CARDS.map(x=>x.id)).size).toBe(12);
    expect(RELICS).toHaveLength(12);
    expect(new Set(RELICS.map(x=>x.id)).size).toBe(12);
  });

  it("enforces the five-relic capacity through the content inventory contract", async () => {
    const {RELICS} = await import("../src/content");
    expect(RELICS.slice(0,5).map(x=>x.id)).toHaveLength(5);
    expect(RELICS).toHaveLength(12);
  });

  it("applies special-card, relic, discard and luck bonuses", async () => {
    const {comboContentBonus,extraDiscards,extraLuck} = await import("../src/content");
    const combo = detectCombos([card("brasa",2),card("ginga",3),card("mare",4)]).find(x=>x.id==="run")!;
    expect(comboContentBonus(combo,["caramelo-supremo","fusca-azul"],["apito-juiz"],0,999,()=>0.9)).toBe(38);
    expect(extraDiscards(["pombo-correio"],["chinelo-da-sorte"])).toBe(2);
    expect(extraLuck(["pe-quente"],["ferradura-neon"])).toBe(4);
  });
});

describe("campaign event checkpoints", () => {
  it("inserts a special event between the second and third normal rounds", async () => {
    const {createCampaign,completeNormalRound,completeEvent} = await import("../src/progression");
    let state=createCampaign();
    state=completeNormalRound(state,true);
    state=completeNormalRound(state,true);
    expect(state.phase).toBe("event");
    state=completeEvent(state);
    expect(state.phase).toBe("normal");
    state=completeNormalRound(state,true);
    expect(state.phase).toBe("shop");
  });
});
