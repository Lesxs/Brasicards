import { useEffect, useMemo, useState } from "react";
import { type Card, type Combo, type Suit, SUIT_MARKS, SUIT_NAMES, createDeck, detectCombos, drawCards, shuffle } from "./engine";

type Run = { deck: Card[]; discard: Card[]; hand: Card[]; selected: string[]; score: number; goal: number; plays: number; discards: number; chips: number; luck: number; round: number; message: string; finished: boolean; };
const freshRun = (): Run => {
  const dealt = drawCards(shuffle(createDeck()), [], []);
  return { ...dealt, selected: [], score: 0, goal: 220, plays: 4, discards: 3, chips: 20, luck: 0, round: 1, message: "Monte sua primeira combinação.", finished: false };
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
    return { ...value, finished: Boolean(value.finished) } as Run;
  } catch { return null; }
};

export default function App() {
  const [run, setRun] = useState<Run>(() => loadRun() ?? freshRun());
  const [activeCombo, setActiveCombo] = useState<Combo | null>(null);
  const [lastGain, setLastGain] = useState(0);
  const [flash, setFlash] = useState(false);
  const [showCombos, setShowCombos] = useState(false);

  useEffect(() => { localStorage.setItem("brasicards-run", JSON.stringify(run)); }, [run]);
  const selectedCards = useMemo(() => run.hand.filter(c => run.selected.includes(c.id)), [run.hand, run.selected]);
  const combos = useMemo(() => selectedCards.length >= 2 ? detectCombos(selectedCards) : [], [selectedCards]);
  const won = run.score >= run.goal;
  const ended = run.finished || run.plays <= 0;

  const toggleCard = (id: string) => {
    if (ended) return;
    setRun(r => ({ ...r, selected: r.selected.includes(id) ? r.selected.filter(x => x !== id) : r.selected.length < 5 ? [...r.selected, id] : r.selected }));
  };
  const playCombo = (combo: Combo) => {
    if (ended || run.plays <= 0) return;
    const used = new Set(combo.cards.map(c => c.id));
    const rest = run.hand.filter(c => !used.has(c.id));
    const replenished = drawCards(run.deck, [...run.discard, ...combo.cards], rest);
    const gain = Math.round(combo.total);
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
    const next = run.round + 1;
    const bonus = 8 + Math.floor(run.score / 100);
    const fresh = freshRun();
    setRun({ ...fresh, round: next, goal: Math.round(220 * Math.pow(1.34, next - 1)), chips: run.chips + bonus, luck: run.luck, message: "Nova rodada. +" + bonus + " fichas pela vitória." });
    setActiveCombo(null); setLastGain(0);
  };
  const finishRound = () => { if (won) setRun(r => ({ ...r, finished: true, message: "Rodada encerrada com a meta alcançada." })); };
  const restart = () => { setRun(freshRun()); setActiveCombo(null); setLastGain(0); };
  const spin = () => {
    if (run.luck < 30 || ended) return;
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
      <div><span className="eyebrow">ETAPA 01 · A CIDADE ACORDOU</span><h1>Mesa do Caos <span>/{String(run.round).padStart(2,"0")}</span></h1></div>
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
      <div className="round-note"><span className="live-dot"/> SUA VEZ <small>Selecione de 2 a 5 cartas</small></div>
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
        <div className="action-hint">Selecione cartas para revelar combinações possíveis.</div>
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
      <div className="slot-copy"><span className="eyebrow">SISTEMA ESPECIAL</span><h2>Máquina da Sorte <span>✧</span></h2><p>Transforme Fator Sorte em pontos. Sem apostas, só caos.</p></div>
      <div className="slot-reels"><span>🍋</span><span>7</span><span>✦</span></div>
      <div className="slot-actions"><button onClick={spin} disabled={run.luck<30||ended}>1 giro potente <small>30 ✧</small></button><button onClick={spinTriple} disabled={run.luck<30||ended}>3 giros menores <small>30 ✧</small></button></div>
    </section>

    {ended && <section className="result-overlay"><div className="result-card"><span className="eyebrow">{won?"META ALCANÇADA":"FIM DA RODADA"}</span><h2>{won?"VOCÊ AMASSOU!":"A CASA NÃO CAIU… AINDA."}</h2><p>{won?"Meta cumprida. Você pode avançar para a próxima rodada.":"Suas quatro jogadas acabaram antes da meta."}</p><strong>{fmt(run.score)} <small>/ {fmt(run.goal)} pontos</small></strong><button className="primary-action" onClick={won?nextRound:restart}>{won?"Próxima rodada →":"Tentar novamente ↻"}</button></div></section>}
    <footer><span>BRASICARDS · PROTÓTIPO 0.1</span><span>FEITO PARA COMBOS ABSURDOS</span></footer>
  </main>;
}