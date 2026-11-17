import { useEffect, useMemo, useState } from "react";
import { type Card, type Combo, type Suit, SUIT_MARKS, SUIT_NAMES, createDeck, detectCombos, drawCards, shuffle } from "./engine";
import { type CampaignState, createCampaign, completeNormalRound, completeEvent, completeShop, defeatBoss, claimBossReward, STAGE_NAMES, BOSS_NAMES } from "./progression";
import { STARTER_SPECIAL_IDS, RELICS, SPECIAL_CARDS, eventForStage, comboContentBonus, comboMultiplier, extraLuck, slotMultiplier, roundChipBonus, extraDiscards as getExtraDiscards, getSpecial, getRelic } from "./content";
import { playCardSound, playComboSound, playRewardSound, playDiscardSound, playMilestoneSound } from "./audio";

type Run = { deck: Card[]; discard: Card[]; hand: Card[]; selected: string[]; score: number; goal: number; plays: number; discards: number; chips: number; luck: number; round: number; message: string; finished: boolean; campaign: CampaignState; scoreBonus: number; extraPlays: number; extraDiscards: number; shopPurchases: string[]; specialCards: string[]; relics: string[]; unlockedSpecials: string[]; };
const freshRun = (campaign: CampaignState = createCampaign(), round = 1, chips = 20, luck = 0, scoreBonus = 0, goal?: number, extraPlays = 0, extraDiscards = 0, specialCards: string[] = [], relics: string[] = [], unlockedSpecials: string[] = [...STARTER_SPECIAL_IDS]): Run => {
  const dealt = drawCards(shuffle(createDeck()), [], []);
  const target = goal ?? Math.round(220 * Math.pow(1.34, round - 1));
  return { ...dealt, selected: [], score: 0, goal: target, plays: 4 + extraPlays, discards: 3 + extraDiscards + getExtraDiscards(specialCards,relics), chips, luck, round, message: "Monte sua primeira combinação.", finished: false, campaign, scoreBonus, extraPlays, extraDiscards, shopPurchases: [], specialCards, relics, unlockedSpecials };
};
const tutorialSteps = [
  { title: "Bem-vindo à Mesa do Caos", body: "Seu objetivo é alcançar a meta de pontos antes de acabar suas jogadas. Você não precisa decorar tudo: o jogo vai mostrar as combinações disponíveis conforme selecionar as cartas.", tip: "A mão tem até 7 cartas. Você começa com 4 jogadas e 3 descartes." },
  { title: "Escolha suas cartas", body: "Clique nas cartas para selecioná-las. Você pode escolher de 2 a 7 cartas; nem todas precisam formar uma combinação. Se mudar de ideia, clique novamente para desmarcar.", tip: "Comece procurando valores iguais, números em sequência ou cartas do mesmo naipe." },
  { title: "Use uma combinação", body: "Quando houver uma combinação válida, ela aparecerá logo abaixo da sua mão. Compare os pontos e escolha a opção que preferir. Ao jogar, as cartas usadas são repostas automaticamente.", tip: "Cada combinação consome 1 jogada. O descarte consome 1 descarte e troca as cartas escolhidas." },
  { title: "Alcance a meta e evolua", body: "A barra no alto mostra quanto falta para alcançar a meta. Combinações maiores e especiais podem render mais pontos. O Fator Sorte alimenta a Máquina da Sorte; fichas são usadas na loja entre etapas.", tip: "Observe suas cartas e compare as opções antes de jogar. Não precisa gastar todos os recursos de uma vez." }
] as const;
const suitClass = (s: Suit) => "suit-" + s;
const fmt = (n: number) => Math.floor(n).toLocaleString("pt-BR");
const validCampaign = (value: unknown): value is CampaignState => {
  if(!value || typeof value!=="object")return false;
  const c=value as CampaignState;
  return [1,2,3].includes(c.stage) && ["normal","event","shop","boss","boss-reward","complete"].includes(c.phase) && [0,1,2,3].includes(c.normalRoundsInStage) && Number.isInteger(c.normalRoundsCompleted) && Number.isInteger(c.bossesDefeated);
};
const validCard = (value: unknown): value is Card => {
  if (!value || typeof value !== "object") return false;
  const card = value as Card;
  return typeof card.id === "string" && ["brasa", "ginga", "mare", "sertao"].includes(card.suit) && Number.isInteger(card.value) && card.value >= 1 && card.value <= 10;
};
const loadRun = (): Run | null => {
  try {
    const raw = localStorage.getItem("brasicards-run-v2") ?? localStorage.getItem("brasicards-run");
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Run>;
    if (value.campaign && !validCampaign(value.campaign)) return null;
    if (!Array.isArray(value.deck) || !value.deck.every(validCard) ||
        !Array.isArray(value.discard) || !value.discard.every(validCard) ||
        !Array.isArray(value.hand) || !value.hand.every(validCard) ||
        !Array.isArray(value.selected) || typeof value.score !== "number" ||
        typeof value.goal !== "number" || typeof value.plays !== "number" ||
        typeof value.discards !== "number" || typeof value.chips !== "number" ||
        typeof value.luck !== "number" || typeof value.round !== "number" ||
        typeof value.message !== "string" || ![value.deck,value.discard,value.hand].flat().every(validCard)) return null;
    const allCards=[...value.deck,...value.discard,...value.hand];
    if(allCards.length!==40 || new Set(allCards.map(c=>c.id)).size!==40 || new Set(value.selected).size!==value.selected.length || value.selected.some(id=>!value.hand!.some(c=>c.id===id)) || !Number.isFinite(value.scoreBonus ?? 0))return null;
    return { ...value, finished: Boolean(value.finished), campaign: value.campaign ?? createCampaign(), scoreBonus: Number(value.scoreBonus ?? 0), extraPlays: Number(value.extraPlays ?? 0), extraDiscards: Number(value.extraDiscards ?? 0), shopPurchases: Array.isArray(value.shopPurchases) ? value.shopPurchases : [], specialCards: Array.isArray(value.specialCards) ? value.specialCards : [], relics: Array.isArray(value.relics) ? value.relics.slice(0,5) : [], unlockedSpecials: Array.isArray(value.unlockedSpecials) ? value.unlockedSpecials : [...STARTER_SPECIAL_IDS] } as Run;
  } catch { return null; }
};

export default function App() {
  const [profileUnlocks,setProfileUnlocks] = useState<string[]>(()=>{try{const x=JSON.parse(localStorage.getItem("brasicards-unlocks")||"[]");return Array.isArray(x)?[...new Set([...STARTER_SPECIAL_IDS,...x.filter((id:string)=>SPECIAL_CARDS.some(c=>c.id===id))])]:[...STARTER_SPECIAL_IDS]}catch{return [...STARTER_SPECIAL_IDS]}});
  const [run, setRun] = useState<Run>(() => { const saved=loadRun(); if(saved){saved.unlockedSpecials=[...new Set([...profileUnlocks,...saved.unlockedSpecials])];return saved;} return freshRun(undefined,1,20,0,0,undefined,0,0,[],[],profileUnlocks); });
  const [activeCombo, setActiveCombo] = useState<Combo | null>(null);
  const [lastGain, setLastGain] = useState(0);
  const [flash, setFlash] = useState(false);
  const [showCombos, setShowCombos] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number | null>(()=>{try{return localStorage.getItem("brasicards-tutorial-v1")==="done"?null:0}catch{return 0}});
  const [soundEnabled,setSoundEnabled]=useState(()=>{try{return localStorage.getItem("brasicards-sound")!=="off"}catch{return true}});

  useEffect(() => { try { localStorage.setItem("brasicards-run-v2", JSON.stringify(run)); localStorage.setItem("brasicards-unlocks",JSON.stringify(profileUnlocks)); localStorage.setItem("brasicards-sound",soundEnabled?"on":"off"); } catch { /* storage may be unavailable */ } }, [run,profileUnlocks,soundEnabled]);
  const selectedCards = useMemo(() => run.hand.filter(c => run.selected.includes(c.id)), [run.hand, run.selected]);
  const combos = useMemo(() => selectedCards.length >= 2 ? detectCombos(selectedCards).filter(c => !(run.campaign.phase === "boss" && run.campaign.stage === 1 && c.cards.length > 4)) : [], [selectedCards, run.campaign.phase, run.campaign.stage]);
  const won = run.score >= run.goal;
  const ended = run.finished || run.plays <= 0;
  const closeTutorial = () => { setTutorialStep(null); try { localStorage.setItem("brasicards-tutorial-v1","done"); } catch { /* storage may be unavailable */ } };
  const advanceTutorial = () => { if (tutorialStep === null) return; if (tutorialStep >= tutorialSteps.length - 1) closeTutorial(); else setTutorialStep(tutorialStep + 1); };

  const toggleCard = (id: string) => {
    if (ended) return;
    if(soundEnabled)playCardSound();
    setRun(r => ({ ...r, selected: r.selected.includes(id) ? r.selected.filter(x => x !== id) : r.selected.length < 7 ? [...r.selected, id] : r.selected }));
  };
  const playCombo = (combo: Combo) => {
    if (ended || run.plays <= 0) return;
    if(soundEnabled)playComboSound(combo.cards.length);
    const previewGain = Math.round((combo.total + comboContentBonus(combo,run.specialCards,run.relics,run.score,run.goal) + run.scoreBonus) * comboMultiplier(run.specialCards,combo) * (run.campaign.phase === "boss" && run.campaign.stage === 2 ? 0.8 : 1));
    if(soundEnabled && run.score < run.goal && run.score + previewGain >= run.goal) playMilestoneSound();
    const used = new Set(combo.cards.map(c => c.id));
    const rest = run.hand.filter(c => !used.has(c.id));
    const replenished = drawCards(run.deck, [...run.discard, ...combo.cards], rest);
    const bossPenalty = run.campaign.phase === "boss" && run.campaign.stage === 2 ? 0.8 : 1;
    const contentBonus = comboContentBonus(combo,run.specialCards,run.relics,run.score,run.goal);
    const gain = Math.round((combo.total + contentBonus + run.scoreBonus) * comboMultiplier(run.specialCards,combo) * bossPenalty);
    setLastGain(gain);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 750);
    setActiveCombo(combo);
    setRun(r => ({ ...r, ...replenished, selected: [], score: r.score + gain, plays: r.plays - 1, luck: r.luck + Math.max(4, combo.cards.length * 3) + extraLuck(r.specialCards,r.relics), chips: r.chips + (r.score + gain >= r.goal && r.score < r.goal ? 5 : 0), message: combo.name + " +" + fmt(gain) + " pontos!" }));
  };
  const discardSelected = () => {
    if (ended || !selectedCards.length || run.discards <= 0) return;
    const removed = new Set(selectedCards.map(c => c.id));
    const replenished = drawCards(run.deck, [...run.discard, ...selectedCards], run.hand.filter(c => !removed.has(c.id)));
    if(soundEnabled)playDiscardSound();
    setRun(r => ({ ...r, ...replenished, selected: [], discards: r.discards - 1, message: selectedCards.length + " carta(s) descartada(s). Confira as novas cartas." }));
    setActiveCombo(null);
  };
  const nextRound = () => {
    if (!won) return;
    if (run.campaign.phase === "boss") {
      const campaign = defeatBoss(run.campaign, true);
      setRun(r => ({ ...r, campaign, finished: true, message: "Chefe derrotado! Escolha uma recompensa." }));
      return;
    }
    const campaign = completeNormalRound(run.campaign, true);
    const bonus = 8 + Math.min(20, Math.floor(Math.max(0, run.score - run.goal) / 100)) + roundChipBonus(run.specialCards,run.relics,run.score,run.goal);
    if (campaign.phase === "shop") {
      setRun(r => ({ ...r, campaign, finished: true, chips: r.chips + bonus, message: "Terceira rodada concluída. A loja está aberta." }));
    } else if (campaign.phase === "event") {
      const fresh=freshRun(campaign,run.round+1,run.chips+bonus,run.luck,run.scoreBonus,undefined,run.extraPlays,run.extraDiscards,run.specialCards,run.relics,run.unlockedSpecials);
      setRun({...fresh,finished:true,message:"Um encontro especial apareceu no caminho."});
    } else {
      const fresh = freshRun(campaign, run.round + 1, run.chips + bonus, run.luck, run.scoreBonus, undefined, run.extraPlays, run.extraDiscards,run.specialCards,run.relics,run.unlockedSpecials);
      setRun({ ...fresh, message: "Rodada concluída. +" + bonus + " fichas." });
    }
    setActiveCombo(null); setLastGain(0);
  };
  const finishRound = () => { if (won) setRun(r => ({ ...r, finished: true, message: "Meta alcançada. Rodada encerrada." })); };
  const restart = () => { setRun(freshRun(undefined,1,20,0,0,undefined,0,0,[],[],profileUnlocks)); setActiveCombo(null); setLastGain(0); };
  const buyShopOffer = (id: string) => {
    const special = run.unlockedSpecials.map(getSpecial).find(x=>x && !run.specialCards.includes(x.id));
    const relic = RELICS.find(x=>!run.relics.includes(x.id));
    const specialCost = special ? (special.rarity==="lendária"?20:special.rarity==="épica"?16:special.rarity==="rara"?14:12) : 0;
    const offers: Record<string,{cost:number;label:string;apply:(r:Run)=>Partial<Run>}> = {
      points:{cost:10,label:"Bônus de combo +5",apply:r=>({scoreBonus:r.scoreBonus+5})},
      discard:{cost:8,label:"+1 descarte",apply:r=>({extraDiscards:r.extraDiscards+1})},
      luck:{cost:6,label:"+20 Fator Sorte",apply:r=>({luck:r.luck+20})},
      plays:{cost:12,label:"+1 jogada",apply:r=>({extraPlays:r.extraPlays+1})}
    };
    if(id==="special" && special && run.chips>=specialCost && !run.shopPurchases.includes(id)){
      const cost=specialCost;
      setRun(r=>({...r,specialCards:[...r.specialCards,special.id],chips:r.chips-cost,shopPurchases:[...r.shopPurchases,id],message:"Carta especial adquirida: "+special.name}));
      return;
    }
    if(id==="relic" && relic && run.relics.length<5 && run.chips>=14 && !run.shopPurchases.includes(id)){
      setRun(r=>({...r,relics:[...r.relics,relic.id],chips:r.chips-14,shopPurchases:[...r.shopPurchases,id],message:"Relíquia adquirida: "+relic.name}));
      return;
    }
    const offer=offers[id];
    if(!offer||run.shopPurchases.includes(id)||run.chips<offer.cost)return;
    setRun(r=>({...r,...offer.apply(r),chips:r.chips-offer.cost,shopPurchases:[...r.shopPurchases,id],message:"Comprado: "+offer.label}));
  };
  const leaveShop = () => {
    const campaign = completeShop(run.campaign);
    const bossGoal = Math.round(480 * Math.pow(1.45, campaign.stage - 1));
    setRun(freshRun(campaign,run.round+1,run.chips,run.luck,run.scoreBonus,bossGoal,run.extraPlays,run.extraDiscards,run.specialCards,run.relics,run.unlockedSpecials));
    setActiveCombo(null); setLastGain(0);
  };
  const claimReward = (id: string) => {
    const rewards:Record<string,(r:Run)=>Partial<Run>>={chips:r=>({chips:r.chips+25}),luck:r=>({luck:r.luck+35}),upgrade:r=>({scoreBonus:r.scoreBonus+8})};
    if(!rewards[id])return;
    const campaign=claimBossReward(run.campaign);
    const unlocks=run.campaign.stage===1?["mae-dinah"]:run.campaign.stage===2?["controle-remoto","tigrinho-do-bem"]:["chinelo-voador","feira-do-rolo","pix-do-alem"];
    const unlockedSpecials=[...new Set([...profileUnlocks,...run.unlockedSpecials,...unlocks])];
    setProfileUnlocks(unlockedSpecials);
    if(campaign.phase==="complete"){setRun(r=>({...r,campaign,unlockedSpecials,message:"Campanha concluída! Novas cartas foram descobertas.",finished:true}));return;}
    const partial=rewards[id](run);
    setRun({...freshRun(campaign,run.round+1,run.chips,run.luck,run.scoreBonus,undefined,run.extraPlays,run.extraDiscards,run.specialCards,run.relics,unlockedSpecials),...partial,message:"Recompensa recebida. Novas cartas foram desbloqueadas."});
    setActiveCombo(null);setLastGain(0);
  };
  const sellInventory = (kind:"special"|"relic",id:string) => {
    if(kind==="special"){
      const item=getSpecial(id);if(!item)return;
      const value=item.rarity==="lendária"?10:item.rarity==="épica"?8:item.rarity==="rara"?6:4;
      setRun(r=>({...r,specialCards:r.specialCards.filter(x=>x!==id),chips:r.chips+value,message:item.name+" vendido por "+value+" fichas."}));
    }else{
      const item=getRelic(id);if(!item)return;
      setRun(r=>({...r,relics:r.relics.filter(x=>x!==id),chips:r.chips+7,message:item.name+" vendida por 7 fichas."}));
    }
  };
  const resolveEvent = (choiceId:string) => {
    const event=eventForStage(run.campaign.stage);
    const choice=event.choices.find(x=>x.id===choiceId);
    if(!choice)return;
    const campaign=completeEvent(run.campaign);
    let chips=run.chips,luck=run.luck,scoreBonus=run.scoreBonus;
    if(choice.effect==="chips")chips+=12;
    if(choice.effect==="luck")luck+=20;
    if(choice.effect==="upgrade")scoreBonus+=6;
    const fresh=freshRun(campaign,run.round,chips,luck,scoreBonus,undefined,run.extraPlays,run.extraDiscards,run.specialCards,run.relics,run.unlockedSpecials);
    setRun({...fresh,message:"Evento concluído: "+event.title});
    setActiveCombo(null);setLastGain(0);
  };
  const spin = () => {
    if (run.luck < 30 || ended || (run.campaign.phase === "boss" && run.campaign.stage === 3)) return;
    if(soundEnabled)playRewardSound();
    const reward = Math.round((35 + Math.floor(Math.random() * 46))*slotMultiplier(run.specialCards,run.relics)) + (run.specialCards.includes("controle-remoto")?12:0);
    setRun(r => ({ ...r, luck: r.luck - 30, score: r.score + reward, message: "A máquina pagou " + reward + " pontos!" }));
    setLastGain(reward); setFlash(true); window.setTimeout(() => setFlash(false), 750);
  };
  const spinTriple = () => {
    if (run.luck < 30 || ended || (run.campaign.phase === "boss" && run.campaign.stage === 3)) return;
    if(soundEnabled)playRewardSound();
    const rewards = Array.from({length:3},()=>Math.round((12+Math.floor(Math.random()*20))*slotMultiplier(run.specialCards,run.relics))+(run.specialCards.includes("controle-remoto")?12:0));
    const reward = rewards.reduce((a,b)=>a+b,0);
    setRun(r => ({ ...r, luck: r.luck - 30, score: r.score + reward, message: "Três giros: " + rewards.join(" • ") + " = " + reward + " pontos!" }));
    setLastGain(reward); setFlash(true); window.setTimeout(() => setFlash(false), 750);
  };

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>e.preventDefault()}><span className="brand-mark">B</span><span>BRASI<span className="brand-gold">CARDS</span><small>O CASSINO DO CAOS</small></span></a>
      <div className="top-resources"><div><small>FICHAS</small><strong>◈ {fmt(run.chips)}</strong></div><div><small>FATOR SORTE</small><strong className="luck-text">✧ {fmt(run.luck)}</strong></div></div>
      <div className="header-actions"><button className="quiet-button" onClick={()=>setTutorialStep(0)}>Como jogar</button><button className="quiet-button" onClick={()=>setSoundEnabled(v=>!v)}>{soundEnabled?"Som ligado":"Som desligado"}</button><button className="quiet-button" onClick={restart}>Nova partida ↻</button></div>
    </header>

    <section className="run-strip">
      <div><span className="eyebrow">ETAPA {run.campaign.stage} · {STAGE_NAMES[run.campaign.stage - 1].toUpperCase()} · {run.campaign.phase === "boss" ? "CHEFE: " + BOSS_NAMES[run.campaign.stage - 1].toUpperCase() : run.campaign.phase.toUpperCase()}</span><h1>{run.campaign.phase === "boss" ? BOSS_NAMES[run.campaign.stage - 1] : "Mesa do Caos"} <span>/{String(run.round).padStart(2,"0")}</span></h1></div>
      <div className="goal-block"><small>META DA RODADA</small><strong>{fmt(run.score)} <i>/ {fmt(run.goal)}</i></strong><div className="progress"><span style={{width:Math.min(100,run.score/run.goal*100)+"%"}}/></div></div>
    </section>

    <section className={"score-arena "+(flash?"score-flash":"")}>
      <div className="arena-glow"/>
      <div className="score-label">PONTUAÇÃO TOTAL</div>
      <div className="score-number" key={run.score}>{fmt(run.score)}</div>
      <div className="score-callout">{run.message}</div>
      {lastGain > 0 && <div className="floating-gain" key={lastGain+"-"+run.score}>+{fmt(lastGain)}</div>}
      {activeCombo && <div className="combo-stamp"><span>COMBO ATIVADO</span><strong>{activeCombo.name}</strong><b>×{activeCombo.multiplier}</b></div>}
    </section>

    <section className="round-controls">
      <div className="counter"><span>JOGADAS</span><strong>{run.plays}<small>/ 4</small></strong><div className="pips">{Array.from({length:Math.max(4,run.plays)},(_,i)=><i className={i<run.plays?"on":""} key={i}/>)}</div></div>
      <div className="counter"><span>DESCARTES</span><strong>{run.discards}<small>/ 3</small></strong><div className="pips">{Array.from({length:Math.max(3,run.discards)},(_,i)=><i className={i<run.discards?"on discard-pip":""} key={i}/>)}</div></div>
      <div className="round-note"><span className="live-dot"/> SUA VEZ <small>Combos: 2–5 cartas · descarte: até 7</small></div>
      {won && run.plays > 0 && !run.finished && <button className="finish-button" onClick={finishRound}>Encerrar rodada ✓</button>}
      <button className="text-button" onClick={()=>setShowCombos(v=>!v)}>{showCombos?"Ocultar regras":"Ver combinações"} ⌄</button>
    </section>

    {showCombos && <section className="combo-guide"><strong>Guia rápido de combinações</strong><div className="combo-guide-grid"><span><b>Parceria</b> — 2 cartas com o mesmo valor.</span><span><b>Trinca de Respeito</b> — 3 cartas com o mesmo valor.</span><span><b>Bonde Fechado</b> — 4 cartas com o mesmo valor.</span><span><b>Escadinha</b> — 3 a 5 valores consecutivos.</span><span><b>Revoada</b> — 3 a 5 cartas do mesmo naipe.</span><span><b>Virada de Mesa</b> — uma trinca e um par (5 cartas).</span><span><b>Quadra Suprema</b> — quatro cartas iguais e uma extra.</span><span><b>Sequência de Ouro</b> — 5 valores consecutivos do mesmo naipe.</span></div><small>As combinações disponíveis aparecem automaticamente quando você seleciona cartas válidas. Você escolhe qual delas jogar.</small></section>}

    <section className="hand-section">
      <div className="section-heading"><div><span className="eyebrow">SEU BARALHO</span><h2>Cartas na mão <small>{run.hand.length} / 7</small></h2></div><span className="selection-count">{run.selected.length} SELECIONADAS</span></div>
      <div className="hand">
        {run.hand.map(card=><button key={card.id} className={"playing-card "+suitClass(card.suit)+(run.selected.includes(card.id)?" chosen":"")} onClick={()=>toggleCard(card.id)} disabled={ended}>
          <span className="card-corner">{card.value}<b>{SUIT_MARKS[card.suit]}</b></span>
          <span className="card-center"><b>{SUIT_MARKS[card.suit]}</b><small>{SUIT_NAMES[card.suit]}</small></span>
          <span className="card-bottom">{card.value} · {SUIT_NAMES[card.suit]}</span>
        </button>)}
      </div>
      <div className="hand-actions">
        <button className="secondary-action" onClick={discardSelected} disabled={!selectedCards.length||run.discards<=0||ended}>Descartar selecionadas <span>−1 descarte</span></button>
        <div className="action-hint">{run.campaign.phase === "boss" && run.campaign.stage === 1 ? "O Fiscal: máximo de 4 cartas por seleção." : selectedCards.length ? "Confira as combinações abaixo ou desmarque cartas para tentar outra seleção." : "Clique em 2 ou mais cartas para encontrar combinações. Você escolhe qual jogar."}</div>
      </div>
    </section>

    {selectedCards.length>=2 && <section className="combo-picker">
      <div className="picker-title"><span className="live-dot"/> COMBINAÇÕES DISPONÍVEIS <small>{combos.length} encontradas</small></div>
      {combos.length===0 ? <p className="empty-combos">Nenhuma combinação válida nessa seleção. Experimente outras cartas.</p> :
        combos.map((combo,i)=><button key={combo.id+"-"+i} className="combo-option" onClick={()=>playCombo(combo)} disabled={ended||run.plays<=0}>
          <span className="combo-option-main"><b>{combo.name}</b><small>{combo.cards.length} cartas · {combo.description}</small></span>
          <span className="combo-math"><small>({fmt(combo.base)} + {fmt(combo.bonus)} + {fmt(combo.suitBonus)}) × {combo.multiplier}</small><strong>+{fmt(combo.total)}</strong></span><span className="option-arrow">↗</span>
        </button>)}
    </section>}

    <section className="slot-panel">
      <div className="slot-copy"><span className="eyebrow">SISTEMA ESPECIAL</span><h2>Máquina da Sorte <span>✧</span></h2><p>{run.campaign.phase === "boss" && run.campaign.stage === 3 ? "Máquina Quebrada: giros bloqueados durante este chefe." : "Transforme Fator Sorte em pontos. Sem apostas, só caos."}</p></div>
      <div className="slot-reels"><span className="lemon-symbol">LIM</span><span>7</span><span>✦</span></div>
      <div className="slot-actions"><button onClick={spin} disabled={run.luck<30||ended||(run.campaign.phase==="boss"&&run.campaign.stage===3)}>1 giro potente <small>30 ✧</small></button><button onClick={spinTriple} disabled={run.luck<30||ended||(run.campaign.phase==="boss"&&run.campaign.stage===3)}>3 giros menores <small>30 ✧</small></button></div>
    </section>

    {ended && run.campaign.phase !== "shop" && run.campaign.phase !== "event" && run.campaign.phase !== "boss-reward" && run.campaign.phase !== "complete" && <section className="result-overlay"><div className="result-card"><span className="eyebrow">{won?"META ALCANÇADA":"FIM DA RODADA"}</span><h2>{won?"VOCÊ AMASSOU!":"A CASA NÃO CAIU… AINDA."}</h2><p>{won?"Meta cumprida. Você pode avançar para a próxima rodada.":"Suas quatro jogadas acabaram antes da meta."}</p><strong>{fmt(run.score)} <small>/ {fmt(run.goal)} pontos</small></strong><button className="primary-action" onClick={won?nextRound:restart}>{won?(run.campaign.phase === "boss"?"Ver recompensas →":"Continuar →"):"Tentar novamente ↻"}</button></div></section>}
    {run.campaign.phase === "event" && <section className="result-overlay"><div className="result-card shop-card"><span className="eyebrow">ENCONTRO ESPECIAL · ETAPA {run.campaign.stage}</span><h2>{eventForStage(run.campaign.stage).title.toUpperCase()}</h2><p>{eventForStage(run.campaign.stage).description}</p><div className="shop-offers">{eventForStage(run.campaign.stage).choices.map(choice=><button key={choice.id} className="shop-offer" onClick={()=>resolveEvent(choice.id)}><b>{choice.label}</b><small>{choice.description}</small><strong>ESCOLHER</strong></button>)}</div></div></section>}
    {run.campaign.phase === "shop" && <section className="result-overlay"><div className="result-card shop-card"><span className="eyebrow">INTERVALO ENTRE ETAPAS</span><h2>LOJA DO CAOS</h2><p>Quatro espaços: carta especial, relíquia, melhoria e serviço. Cada espaço pode ser comprado uma vez.</p><div className="shop-offers">{[{id:"special",name:"Carta especial",desc:(run.unlockedSpecials.map(getSpecial).find(x=>x&&!run.specialCards.includes(x.id))?.name??"Coleção completa"),cost:(()=>{const x=run.unlockedSpecials.map(getSpecial).find(x=>x&&!run.specialCards.includes(x.id));return x?.rarity==="lendária"?20:x?.rarity==="épica"?16:x?.rarity==="rara"?14:12})()},{id:"relic",name:"Relíquia",desc:run.relics.length>=5?"Inventário cheio (5/5)":(RELICS.find(x=>!run.relics.includes(x.id))?.name??"Todas coletadas"),cost:14},{id:"points",name:"Mesa aquecida",desc:"+5 pontos em cada combinação",cost:10},{id:"discard",name:"Descarte extra",desc:"+1 descarte na próxima rodada",cost:8}].map(o=><button key={o.id} className="shop-offer" disabled={run.shopPurchases.includes(o.id)||run.chips<o.cost||(o.id==="special"&&!run.unlockedSpecials.some(id=>!run.specialCards.includes(id)))||(o.id==="relic"&&run.relics.length>=5)} onClick={()=>buyShopOffer(o.id)}><b>{o.name}</b><small>{o.desc}</small><strong>{run.shopPurchases.includes(o.id)?"COMPRADO":o.cost+" fichas"}</strong></button>)}</div><p>Saldo: <strong>{fmt(run.chips)} fichas</strong></p><button className="primary-action" onClick={leaveShop}>Enfrentar {BOSS_NAMES[run.campaign.stage-1]} →</button></div></section>}
    {run.campaign.phase === "boss-reward" && <section className="result-overlay"><div className="result-card shop-card"><span className="eyebrow">CHEFE DERROTADO</span><h2>ESCOLHA SUA RECOMPENSA</h2><p>Selecione apenas uma das três recompensas.</p><div className="shop-offers"><button className="shop-offer" onClick={()=>claimReward("chips")}><b>Bolso reforçado</b><small>Receba 25 fichas.</small><strong>25 FICHAS</strong></button><button className="shop-offer" onClick={()=>claimReward("luck")}><b>Maré de sorte</b><small>Receba 35 de Fator Sorte.</small><strong>35 ✧</strong></button><button className="shop-offer" onClick={()=>claimReward("upgrade")}><b>Combo turbinado</b><small>+8 pontos em cada combinação futura.</small><strong>UPGRADE</strong></button></div></div></section>}
    {run.campaign.phase === "complete" && <section className="result-overlay"><div className="result-card"><span className="eyebrow">FIM DA CAMPANHA</span><h2>VOCÊ DOMINOU O CAOS!</h2><p>Nove rodadas e três chefes superados.</p><button className="primary-action" onClick={restart}>Nova campanha ↻</button></div></section>}
    <section className="inventory-strip"><div><b>CARTAS ESPECIAIS ({run.specialCards.length})</b><span>{run.specialCards.length?run.specialCards.map(id=><button key={id} className="inventory-item" title={getSpecial(id)?.description} onClick={()=>sellInventory("special",id)}>{getSpecial(id)?.name} · vender</button>):"Nenhuma adquirida"}</span></div><div><b>RELÍQUIAS ({run.relics.length}/5)</b><span>{run.relics.length?run.relics.map(id=><button key={id} className="inventory-item" title={getRelic(id)?.description} onClick={()=>sellInventory("relic",id)}>{getRelic(id)?.name} · vender</button>):"Nenhuma adquirida"}</span></div></section>
    {tutorialStep !== null && <section className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title"><div className="tutorial-card"><div className="tutorial-topline"><span className="eyebrow">GUIA DE PRIMEIRA PARTIDA</span><button className="tutorial-skip" onClick={closeTutorial}>Pular tutorial ×</button></div><div className="tutorial-progress">{tutorialSteps.map((_,i)=><i key={i} className={i<=tutorialStep?"active":""}/>)}</div><span className="tutorial-step">PASSO {tutorialStep+1} DE {tutorialSteps.length}</span><h2 id="tutorial-title">{tutorialSteps[tutorialStep].title}</h2><p>{tutorialSteps[tutorialStep].body}</p><div className="tutorial-tip"><b>DICA</b>{tutorialSteps[tutorialStep].tip}</div><div className="tutorial-actions"><button className="quiet-button" onClick={closeTutorial}>Pular</button><button className="primary-action" onClick={advanceTutorial}>{tutorialStep===tutorialSteps.length-1?"Começar a jogar":"Continuar →"}</button></div></div></section>}
    <footer><span>BRASICARDS · PROTÓTIPO 0.1</span><span>FEITO PARA COMBOS ABSURDOS</span></footer>
  </main>;
}