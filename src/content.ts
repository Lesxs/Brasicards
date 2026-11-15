import type { Combo } from "./engine";

export type Rarity = "incomum" | "rara" | "épica" | "lendária";
export type SpecialCard = { id: string; name: string; rarity: Rarity; description: string; effect: string };
export type Relic = { id: string; name: string; rarity: Rarity; description: string; effect: string };

export const SPECIAL_CARDS: SpecialCard[] = [
  { id:"caramelo-supremo", name:"Caramelo Supremo", rarity:"incomum", description:"+8 pontos em combinações de 3 ou mais cartas.", effect:"wide-combo" },
  { id:"fusca-azul", name:"Fusca Azul", rarity:"rara", description:"+18 pontos em Escadinha e Sequência de Ouro.", effect:"sequence" },
  { id:"limao-azedo", name:"Limão Azedo", rarity:"épica", description:"+10% na pontuação final de cada combinação.", effect:"multiplier" },
  { id:"o-receba", name:"O Receba", rarity:"rara", description:"+15 pontos quando sua pontuação já alcançou a meta.", effect:"comeback" },
  { id:"pombo-correio", name:"Pombo Correio", rarity:"incomum", description:"+1 descarte em cada rodada.", effect:"discard" },
  { id:"pe-quente", name:"Pé Quente", rarity:"incomum", description:"+2 de Fator Sorte por combinação.", effect:"luck" },
  { id:"mae-dinah", name:"Mãe Dináh do Caos", rarity:"épica", description:"+12 pontos em toda combinação.", effect:"oracle" },
  { id:"controle-remoto", name:"Controle Remoto", rarity:"rara", description:"+12 pontos em cada giro da máquina.", effect:"remote" },
  { id:"tigrinho-do-bem", name:"Tigrinho do Bem", rarity:"lendária", description:"+20% nos pontos da máquina.", effect:"slot" },
  { id:"chinelo-voador", name:"Chinelo Voador", rarity:"rara", description:"+1 descarte em cada rodada.", effect:"discard" },
  { id:"feira-do-rolo", name:"Feira do Rolo", rarity:"épica", description:"+5 fichas ao concluir uma rodada normal.", effect:"chips" },
  { id:"pix-do-alem", name:"Pix do Além", rarity:"lendária", description:"+12 fichas ao superar a meta em pelo menos 20%.", effect:"overgoal" }
];

export const STARTER_SPECIAL_IDS = ["caramelo-supremo","fusca-azul","limao-azedo","o-receba","pombo-correio","pe-quente"];
export const RELICS: Relic[] = [
  {id:"trofeu-isopor",name:"Troféu de Isopor",rarity:"incomum",description:"+8 pontos quando uma combinação cruza a meta.",effect:"goal"},
  {id:"corrente-patrao",name:"Corrente do Patrão",rarity:"rara",description:"+12% em combinações de quatro ou cinco cartas.",effect:"big-combo"},
  {id:"moeda-destino",name:"Moeda do Destino",rarity:"épica",description:"20% de chance de ganhar +25 pontos por combinação.",effect:"chance"},
  {id:"apito-juiz",name:"Apito do Juiz",rarity:"incomum",description:"+12 pontos em Escadinha e Sequência de Ouro.",effect:"sequence"},
  {id:"fita-carnaval",name:"Fita do Carnaval",rarity:"rara",description:"+14 pontos quando a combinação usa três ou mais naipes.",effect:"suits"},
  {id:"carta-curinga",name:"Carta Curinga",rarity:"épica",description:"+6 pontos em toda combinação.",effect:"flat"},
  {id:"alavanca-enferrujada",name:"Alavanca Enferrujada",rarity:"incomum",description:"+10% nos pontos da máquina.",effect:"slot"},
  {id:"ferradura-neon",name:"Ferradura Neon",rarity:"rara",description:"+2 de Fator Sorte por combinação.",effect:"luck"},
  {id:"ficha-viciada",name:"Ficha Viciada",rarity:"lendária",description:"+20% nos pontos da máquina.",effect:"slot"},
  {id:"sacola-da-feira",name:"Sacola da Feira",rarity:"incomum",description:"+4 fichas ao concluir uma rodada normal.",effect:"chips"},
  {id:"chinelo-da-sorte",name:"Chinelo da Sorte",rarity:"rara",description:"+1 descarte em cada rodada.",effect:"discard"},
  {id:"cofrinho-emergencia",name:"Cofrinho de Emergência",rarity:"épica",description:"+10 fichas ao alcançar a meta.",effect:"goal-chips"}
];

export type EventChoice = { id:string; label:string; description:string; effect:"chips"|"luck"|"upgrade"|"heal" };
export type GameEvent = { id:string; title:string; description:string; choices:EventChoice[] };
const choices = (prefix:string):EventChoice[] => [
  {id:prefix+"-cash",label:"Fazer negócio",description:"Receba 12 fichas.",effect:"chips"},
  {id:prefix+"-luck",label:"Seguir a intuição",description:"Receba 20 de Fator Sorte.",effect:"luck"},
  {id:prefix+"-upgrade",label:"Aprimorar o baralho",description:"+6 pontos em cada combinação futura.",effect:"upgrade"}
];
export const EVENTS: GameEvent[] = [
  {id:"feira-do-caos",title:"Feira do Caos",description:"Entre barracas, ofertas suspeitas e oportunidades improváveis, sempre dá para sair com alguma vantagem.",choices:choices("feira")},
  {id:"blitz",title:"Blitz na Esquina",description:"A fiscalização parou o fluxo. Uma conversa pode render, mas escolha com cuidado.",choices:choices("blitz")},
  {id:"oficina-fusca",title:"Oficina do Fusca",description:"O mecânico promete deixar sua próxima combinação tinindo.",choices:choices("oficina")},
  {id:"festa-fora-controle",title:"Festa Fora de Controle",description:"A música está alta e a sorte parece estar solta.",choices:choices("festa")},
  {id:"buraco-na-rua",title:"Buraco na Rua",description:"Desviar custa tempo; aproveitar o desvio pode render alguma coisa.",choices:choices("buraco")},
  {id:"achado-nao-roubado",title:"Achado Não É Roubado",description:"Uma caixa esquecida apareceu no caminho.",choices:choices("achado")},
  {id:"o-receba-evento",title:"O Receba",description:"Uma oportunidade de negócio surgiu do nada.",choices:choices("receba")},
  {id:"tigrinho-evento",title:"Tigrinho do Bem",description:"Hoje a sorte está oferecendo um acordo sem dinheiro real envolvido.",choices:choices("tigrinho")},
  {id:"churrasco-domingo",title:"Churrasco de Domingo",description:"Uma pausa estratégica pode fortalecer a próxima rodada.",choices:choices("churrasco")},
  {id:"pix-errado",title:"Pix Errado",description:"Um valor caiu na conta fictícia da mesa. Ninguém sabe de onde veio.",choices:choices("pix")}
];
export const eventForStage = (stage:number):GameEvent => EVENTS[(stage * 3 - 3) % EVENTS.length];

export function comboContentBonus(combo:Combo, specialIds:string[], relicIds:string[], currentScore:number, goal:number, rng:()=>number=Math.random):number {
  let bonus=0;
  if (specialIds.includes("caramelo-supremo") && combo.cards.length>=3) bonus+=8;
  if (specialIds.includes("fusca-azul") && (combo.id==="run"||combo.id==="royal")) bonus+=18;
  if (specialIds.includes("o-receba") && currentScore>=goal) bonus+=15;
  if (specialIds.includes("mae-dinah")) bonus+=12;
  if (relicIds.includes("apito-juiz") && (combo.id==="run"||combo.id==="royal")) bonus+=12;
  if (relicIds.includes("fita-carnaval") && new Set(combo.cards.map(c=>c.suit)).size>=3) bonus+=14;
  if (relicIds.includes("carta-curinga")) bonus+=6;
  if (relicIds.includes("moeda-destino") && rng()<0.2) bonus+=25;
  if (relicIds.includes("corrente-patrao") && combo.cards.length>=4) bonus+=Math.round(combo.total*0.12);
  if (relicIds.includes("trofeu-isopor") && currentScore<goal && currentScore+combo.total>=goal) bonus+=8;
  return bonus;
}
export function comboMultiplier(specialIds:string[], combo:Combo):number {
  return specialIds.includes("limao-azedo") ? 1.1 : 1;
}
export function extraDiscards(specialIds:string[], relicIds:string[]):number {
  return Number(specialIds.includes("pombo-correio"))+Number(specialIds.includes("chinelo-voador"))+Number(relicIds.includes("chinelo-da-sorte"));
}
export function extraLuck(specialIds:string[], relicIds:string[]):number {
  return Number(specialIds.includes("pe-quente"))*2+Number(relicIds.includes("ferradura-neon"))*2;
}
export function slotMultiplier(specialIds:string[], relicIds:string[]):number {
  return (specialIds.includes("tigrinho-do-bem")?1.2:1)*(relicIds.includes("alavanca-enferrujada")?1.1:1)*(relicIds.includes("ficha-viciada")?1.2:1);
}
export function roundChipBonus(specialIds:string[], relicIds:string[], score:number, goal:number):number {
  let bonus=0;
  if(specialIds.includes("feira-do-rolo")) bonus+=5;
  if(relicIds.includes("sacola-da-feira")) bonus+=4;
  if(specialIds.includes("pix-do-alem") && score>=goal*1.2) bonus+=12;
  if(relicIds.includes("cofrinho-emergencia") && score>=goal) bonus+=10;
  return bonus;
}
export function getSpecial(id:string):SpecialCard|undefined{return SPECIAL_CARDS.find(x=>x.id===id)}
export function getRelic(id:string):Relic|undefined{return RELICS.find(x=>x.id===id)}
