import { useEffect, useMemo, useState } from "react";
import { type Card, type Combo, type Suit, SUIT_MARKS, SUIT_NAMES, createDeck, detectCombos, drawCards, shuffle } from "./engine";
import { type CampaignState, createCampaign, completeNormalRound, completeShop, defeatBoss, claimBossReward, STAGE_NAMES, BOSS_NAMES } from "./progression";

type Run = { deck: Card[]; discard: Card[]; hand: Card[]; selected: string[]; score: number; goal: number; plays: number; discards: number; chips: number; luck: number; round: number; message: string; finished: boolean; campaign: CampaignState; scoreBonus: number; extraPlays: number; extraDiscards: number; shopPurchases: string[]; };
const freshRun = (campaign: CampaignState = createCampaign(), round = 1, chips = 20, luck = 0, scoreBonus = 0, goal?: number, extraPlays = 0, extraDiscards = 0): Run => {
  const dealt = drawCards(shuffle(createDeck()), [], []);
  const target = goal ?? Math.round(220 * Math.pow(1.34, round - 1));
  return { ...dealt, selected: [], score: 0, goal: target, plays: 4 + extraPlays, discards: 3 + extraDiscards, chips, luck, round, message: "Monte sua primeira combinação.", finished: false, campaign, scoreBonus, extraPlays, extraDiscards, shopPurchases: [] };
};
const suitClass = (s: Suit) => "suit-" + s;
const fmt = (n: number) => Math.floor(n).toLocaleString("pt-BR");
const validCard = (value: unknown): value is Card => {
  if (!value || typeof value !== "object") return false;
  const card = value as Card;
  return typeof card.id === "string" && ["brasa", "ginga", "mare", "sertao"].includes(card.suit) && Number.isInteger(card.value) && card.value >= 1 && card.value <= 10;
};
const loadRun = (): Run | null => {
  try {
    const raw = localStorage.getItem("brasicards-run");
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Run>;
    if (!Array.isArray(value.deck) || !value.deck.every(validCard) ||
        !Array.isArray(value.discard) || !value.discard.every(validCard) ||
        !Array.isArray(value.hand) || !value.hand.every(validCard) ||
        !Array.isArray(value.selected) || typeof value.score !== "number" ||
        typeof value.goal !== "number" || typeof value.plays !== "number" ||
        typeof value.discards !== "number" || typeof value.chips !== "number" ||
        typeof value.luck !== "number" || typeof value.round !== "number" ||
        typeof value.message !== "string") return null;
    return { ...value, finished: Boolean(value.finished), campaign: value.campaign ?? createCampaign(), scoreBonus: Number(value.scoreBonus ?? 0), extraPlays: Number(value.extraPlays ?? 0), extraDiscards: Number(value.extraDiscards ?? 0), shopPurchases: Array.isArray(value.shopPurchases) ? value.shopPurchases : [] } as Run;
  } catch { return null; }
};

export default function App() {
  const [run, setRun] = useState<Run>(() => loadRun() ?? freshRun());
  const [activeCombo, setActiveCombo] = useState<Combo | null>(null);
  const [lastGain, setLastGain] = useState(0);
  const [flash, setFlash] = useState(false);
  const [showCombos, setShowCombos] = useState(false);

  useEffect(() => { try { localStorage.setItem("brasicards-run", JSON.stringify(run)); } catch { /* storage may be unavailable */ } }, [run]);
  const selectedCards = useMemo(() => run.hand.filter(c => run.selected.includes(c.id)), [run.hand, run.selected]);
  const combos = useMemo(() => selectedCards.length >= 2 ? detectCombos(selectedCards) : [], [selectedCards]);
  const won = run.score >= run.goal;
  const ended = run.finished || run.plays <= 0;

  const toggleCard = (id: string) => {
    if (ended) return;
    setRun(r => ({ ...r, selected: r.selected.includes(id) ? r.selected.filter(x => x !== id) : r.selected.length < (r.campaign.phase === "boss" && r.campaign.stage === 1 ? 4 : 7) ? [...r.selected, id] : r.selected }));
  };
  const playCombo = (combo: Combo) => {
    if (ended || run.plays <= 0) return;
    const used = new Set(combo.cards.map(c => c.id));
    const rest = run.hand.filter(c => !used.has(c.id));
    const replenished = drawCards(run.deck, [...run.discard, ...combo.cards], rest);
    const bossPenalty = run.campaign.phase === "boss" && run.campaign.stage === 2 ? 0.8 : 1;
    const gain = Math.round(combo.total * bossPenalty + run.scoreBonus);
    setLastGain(gain);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 750);
    setActiveCombo(combo);
    setRun(r => ({ ...r, ...replenished, selected: [], score: r.score + gain, plays: r.plays - 1, luck: r.luck + Math.max(4, combo.cards.length * 3), chips: r.chips + (r.score + gain >= r.goal && r.score < r.goal ? 5 : 0), message: combo.name + " +" + fmt(gain) + " pontos!" }));
  };
  const discardSelected = () => {
    if (ended || !selectedCards.length || run.discards <= 0) return;
    const removed = new Set(selectedCards.map(c => c.id));
    const replenished = drawCards(run.deck, [...run.discard, ...selectedCards], run.hand.filter(c => !removed.has(c.id)));
    setRun(r => ({ ...r, ...replenished, selected: [], discards: r.discards - 1, message: selectedCards.length + " carta(s) descartada(s)." }));
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
    const bonus = 8 + Math.min(20, Math.floor(Math.max(0, run.score - run.goal) / 100));
    if (campaign.phase === "shop") {
      setRun(r => ({ ...r, campaign, finished: true, chips: r.chips + bonus, message: "Terceira rodada concluída. A loja está aberta." }));
    } else {
      const fresh = freshRun(campaign, run.round + 1, run.chips + bonus, run.luck, run.scoreBonus, undefined, run.extraPlays, run.extraDiscards);
      setRun({ ...fresh, message: "Rodada concluída. +" + bonus + " fichas." });
    }
    setActiveCombo(null); setLastGain(0);
  };
  const finishRound = () => { if (won) setRun(r => ({ ...r, finished: true, message: "Meta alcançada. Rodada encerrada." })); };
  const restart = () => { setRun(freshRun()); setActiveCombo(null); setLastGain(0); };
  const buyShopOffer = (id: string) => {
    const offers: Record<string, { cost: number; apply: (r: Run) => Partial<Run>; label: string }> = {
      points: { cost: 10, label: "Bônus de combo +5", apply: r => ({ scoreBonus: r.scoreBonus + 5 }) },
      discard: { cost: 8, label: "+1 descarte", apply: r => ({ extraDiscards: r.extraDiscards + 1 }) },
      luck: { cost: 6, label: "+20 Fator Sorte", apply: r => ({ luck: r.luck + 20 }) },
      plays: { cost: 12, label: "+1 jogada", apply: r => ({ extraPlays: r.extraPlays + 1 }) }
    };
    const offer = offers[id];
    if (!offer || run.shopPurchases.includes(id) || run.chips < offer.cost) return;
    setRun(r => ({ ...r, ...offer.apply(r), chips: r.chips - offer.cost, shopPurchases: [...r.shopPurchases, id], message: "Comprado: " + offer.label }));
  };
  const leaveShop = () => {
    const campaign = completeShop(run.campaign);
    const bossGoal = Math.round(480 * Math.pow(1.45, campaign.stage - 1));
    setRun(freshRun(campaign, run.round + 1, run.chips, run.luck, run.scoreBonus, bossGoal, run.extraPlays, run.extraDiscards));
    setActiveCombo(null); setLastGain(0);
  };
  const claimReward = (id: string) => {
    const rewards: Record<string, (r: Run) => Partial<Run>> = {
      chips: r => ({ chips: r.chips + 25 }),
      luck: r => ({ luck: r.luck + 35 }),
      upgrade: r => ({ scoreBonus: r.scoreBonus + 8 })
    };
    if (!rewards[id]) return;
    const campaign = claimBossReward(run.campaign);
    if (campaign.phase === "complete") {
      setRun(r => ({ ...r, campaign, message: "Campanha concluída!", finished: true }));
      return;
    }
    const partial = rewards[id](run);
    setRun({ ...freshRun(campaign, run.round + 1, run.chips, run.luck, run.scoreBonus, undefined, run.extraPlays, run.extraDiscards), ...partial, message: "Recompensa recebida. A próxima etapa começa agora." });
    setActiveCombo(null); setLastGain(0);
  };
  const spin = () => {
    if (run.luck < 30 || ended || (run.campaign.phase === "boss" && run.campaign.stage === 3)) return;
    const reward = 35 + Math.floor(Math.random() * 46);
    setRun(r => ({ ...r, luck: r.luck - 30, score: r.score + reward, message: "A máquina pagou " + reward + " pontos!" }));
    setLastGain(reward); setFlash(true); window.setTimeout(() => setFlash(false), 750);
  };
  const spinTriple = () => {
    if (run.luck < 30 || ended) return;
    const rewards = Array.from({length:3},()=>12+Math.floor(Math.random()*20));
    const reward = rewards.reduce((a,b)=>a+b,0);
    setRun(r => ({ ...r, luck: r.luck - 30, score: r.score + reward, message: "Três giros: " + rewards.join(" • ") + " = " + reward + " pontos!" }));
    setLastGain(reward); setFlash(true); window.setTimeout(() => setFlash(false), 750);
  };

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>e.preventDefault()}><span className="brand-mark">B</span><span>BRASI<span className="brand-gold">CARDS</span><small>O CASSINO DO CAOS</small></span></a>
      <div className="top-resources"><div><small>FICHAS</small><strong>◈ {fmt(run.chips)}</strong></div><div><small>FATOR SORTE</small><strong className="luck-text">✧ {fmt(run.luck)}</strong></div></div>
      <button className="quiet-button" onClick={restart}>Nova partida ↻</button>
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
      <div className="counter"><span>JOGADAS</span><strong>{run.plays}<small>/ 4</small></strong><div className="pips">{Array.from({length:4},(_,i)=><i className={i<run.plays?"on":""} key={i}/>)}</div></div>
      <div className="counter"><span>DESCARTES</span><strong>{run.discards}<small>/ 3</small></strong><div className="pips">{Array.from({length:3},(_,i)=><i className={i<run.discards?"on discard-pip":""} key={i}/>)}</div></div>
      <div className="round-note"><span className="live-dot"/> SUA VEZ <small>Combos: 2–5 cartas · descarte: até 7</small></div>
      {won && run.plays > 0 && !run.finished && <button className="finish-button" onClick={finishRound}>Encerrar rodada ✓</button>}
      <button className="text-button" onClick={()=>setShowCombos(v=>!v)}>{showCombos?"Ocultar regras":"Ver combinações"} ⌄</button>
    </section>

    {showCombos && <section className="combo-guide"><strong>Combinações reconhecidas</strong><div>Parceria · Trinca de Respeito · Bonde Fechado · Escadinha · Revoada · Virada de Mesa · Quadra Suprema · Sequência de Ouro</div></section>}

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
        <div className="action-hint">{run.campaign.phase === "boss" && run.campaign.stage === 1 ? "O Fiscal: máximo de 4 cartas por seleção." : "Selecione cartas para revelar combinações possíveis."}</div>
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

    {ended && run.campaign.phase !== "shop" && run.campaign.phase !== "boss-reward" && run.campaign.phase !== "complete" && <section className="result-overlay"><div className="result-card"><span className="eyebrow">{won?"META ALCANÇADA":"FIM DA RODADA"}</span><h2>{won?"VOCÊ AMASSOU!":"A CASA NÃO CAIU… AINDA."}</h2><p>{won?"Meta cumprida. Você pode avançar para a próxima rodada.":"Suas quatro jogadas acabaram antes da meta."}</p><strong>{fmt(run.score)} <small>/ {fmt(run.goal)} pontos</small></strong><button className="primary-action" onClick={won?nextRound:restart}>{won?(run.campaign.phase === "boss"?"Ver recompensas →":"Continuar →"):"Tentar novamente ↻"}</button></div></section>}
    {run.campaign.phase === "shop" && <section className="result-overlay"><div className="result-card shop-card"><span className="eyebrow">INTERVALO ENTRE ETAPAS</span><h2>LOJA DO CAOS</h2><p>Escolha melhorias para a próxima etapa. Cada oferta pode ser comprada uma vez.</p><div className="shop-offers">{[{id:"points",name:"Mesa aquecida",desc:"+5 pontos em cada combinação",cost:10},{id:"discard",name:"Descarte extra",desc:"+1 descarte na próxima rodada",cost:8},{id:"luck",name:"Amuleto pé quente",desc:"+20 Fator Sorte",cost:6},{id:"plays",name:"Tempo adicional",desc:"+1 jogada na próxima rodada",cost:12}].map(o=><button key={o.id} className="shop-offer" disabled={run.shopPurchases.includes(o.id)||run.chips<o.cost} onClick={()=>buyShopOffer(o.id)}><b>{o.name}</b><small>{o.desc}</small><strong>{run.shopPurchases.includes(o.id)?"COMPRADO":o.cost+" fichas"}</strong></button>)}</div><p>Saldo: <strong>{fmt(run.chips)} fichas</strong></p><button className="primary-action" onClick={leaveShop}>Enfrentar {BOSS_NAMES[run.campaign.stage-1]} →</button></div></section>}
    {run.campaign.phase === "boss-reward" && <section className="result-overlay"><div className="result-card shop-card"><span className="eyebrow">CHEFE DERROTADO</span><h2>ESCOLHA SUA RECOMPENSA</h2><p>Selecione apenas uma das três recompensas.</p><div className="shop-offers"><button className="shop-offer" onClick={()=>claimReward("chips")}><b>Bolso reforçado</b><small>Receba 25 fichas.</small><strong>25 FICHAS</strong></button><button className="shop-offer" onClick={()=>claimReward("luck")}><b>Maré de sorte</b><small>Receba 35 de Fator Sorte.</small><strong>35 ✧</strong></button><button className="shop-offer" onClick={()=>claimReward("upgrade")}><b>Combo turbinado</b><small>+8 pontos em cada combinação futura.</small><strong>UPGRADE</strong></button></div></div></section>}
    {run.campaign.phase === "complete" && <section className="result-overlay"><div className="result-card"><span className="eyebrow">FIM DA CAMPANHA</span><h2>VOCÊ DOMINOU O CAOS!</h2><p>Nove rodadas e três chefes superados.</p><button className="primary-action" onClick={restart}>Nova campanha ↻</button></div></section>}
    <footer><span>BRASICARDS · PROTÓTIPO 0.1</span><span>FEITO PARA COMBOS ABSURDOS</span></footer>
  </main>;
}