export type CampaignPhase = "normal" | "shop" | "boss" | "boss-reward" | "complete";

export type CampaignState = {
  stage: 1 | 2 | 3;
  phase: CampaignPhase;
  normalRoundsInStage: 0 | 1 | 2 | 3;
  normalRoundsCompleted: number;
  bossesDefeated: number;
};

export const STAGE_NAMES = [
  "A cidade acordou",
  "O caos começou",
  "A última aposta"
] as const;

export const BOSS_NAMES = [
  "O Fiscal",
  "O Azarado",
  "Máquina Quebrada"
] as const;

export function createCampaign(): CampaignState {
  return {
    stage: 1,
    phase: "normal",
    normalRoundsInStage: 0,
    normalRoundsCompleted: 0,
    bossesDefeated: 0
  };
}

/** Registers a won normal round. A loss leaves campaign progression unchanged. */
export function completeNormalRound(state: CampaignState, won: boolean): CampaignState {
  if (state.phase !== "normal" || !won) return state;

  const normalRoundsInStage = (state.normalRoundsInStage + 1) as 1 | 2 | 3;
  return {
    ...state,
    normalRoundsInStage,
    normalRoundsCompleted: state.normalRoundsCompleted + 1,
    phase: normalRoundsInStage === 3 ? "shop" : "normal"
  };
}

/** The mandatory shop is the only route from the third normal round to its boss. */
export function completeShop(state: CampaignState): CampaignState {
  if (state.phase !== "shop" || state.normalRoundsInStage !== 3) return state;
  return { ...state, phase: "boss" };
}

export function defeatBoss(state: CampaignState, won: boolean): CampaignState {
  if (state.phase !== "boss" || !won) return state;
  return { ...state, phase: "boss-reward", bossesDefeated: state.bossesDefeated + 1 };
}

/** The player claims exactly one of the three boss rewards before continuing. */
export function claimBossReward(state: CampaignState): CampaignState {
  if (state.phase !== "boss-reward") return state;
  if (state.stage === 3) return { ...state, phase: "complete" };

  return {
    ...state,
    stage: (state.stage + 1) as 2 | 3,
    phase: "normal",
    normalRoundsInStage: 0
  };
}
