export type CampaignPhase = "normal" | "event" | "shop" | "boss" | "boss-reward" | "complete";
export type CampaignState = { stage:1|2|3; phase:CampaignPhase; normalRoundsInStage:0|1|2|3; normalRoundsCompleted:number; bossesDefeated:number };
export const STAGE_NAMES=["A cidade acordou","O caos começou","A última aposta"] as const;
export const BOSS_NAMES=["O Fiscal","O Azarado","Máquina Quebrada"] as const;
export function createCampaign():CampaignState{return{stage:1,phase:"normal",normalRoundsInStage:0,normalRoundsCompleted:0,bossesDefeated:0}}
export function completeNormalRound(state:CampaignState,won:boolean):CampaignState{
 if(state.phase!=="normal"||!won)return state;
 const count=(state.normalRoundsInStage+1) as 1|2|3;
 return{...state,normalRoundsInStage:count,normalRoundsCompleted:state.normalRoundsCompleted+1,phase:count===3?"shop":count===2?"event":"normal"};
}
export function completeEvent(state:CampaignState):CampaignState{
 return state.phase==="event"?{...state,phase:"normal"}:state;
}
export function completeShop(state:CampaignState):CampaignState{
 return state.phase==="shop"&&state.normalRoundsInStage===3?{...state,phase:"boss"}:state;
}
export function defeatBoss(state:CampaignState,won:boolean):CampaignState{
 return state.phase==="boss"&&won?{...state,phase:"boss-reward",bossesDefeated:state.bossesDefeated+1}:state;
}
export function claimBossReward(state:CampaignState):CampaignState{
 if(state.phase!=="boss-reward")return state;
 if(state.stage===3)return{...state,phase:"complete"};
 return{...state,stage:(state.stage+1) as 2|3,phase:"normal",normalRoundsInStage:0};
}
