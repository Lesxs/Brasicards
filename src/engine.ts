export type Suit = "brasa" | "ginga" | "mare" | "sertao";
export type Card = { id: string; suit: Suit; value: number };
export type Combo = {
  id: string; name: string; cards: Card[]; base: number; bonus: number;
  multiplier: number; suitBonus: number; total: number; description: string;
};

export const SUITS: Suit[] = ["brasa", "ginga", "mare", "sertao"];
export const SUIT_NAMES: Record<Suit, string> = {
  brasa: "Brasa", ginga: "Ginga", mare: "Maré", sertao: "Sertão"
};
export const SUIT_MARKS: Record<Suit, string> = {
  brasa: "✦", ginga: "↗", mare: "≈", sertao: "⌁"
};

export function createDeck(): Card[] {
  return SUITS.flatMap(suit => Array.from({ length: 10 }, (_, i) => ({
    id: suit + "-" + (i + 1), suit, value: i + 1
  })));
}
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const combinations = (arr: Card[], n: number): Card[][] => {
  const out: Card[][] = [];
  const walk = (start: number, picked: Card[]) => {
    if (picked.length === n) { out.push(picked); return; }
    for (let i = start; i <= arr.length - (n - picked.length); i++) walk(i + 1, [...picked, arr[i]]);
  };
  walk(0, []);
  return out;
};
const consecutive = (values: number[]) => values.every((v, i) => i === 0 || v === values[i - 1] + 1);
const scoreCombo = (id: string, name: string, cards: Card[], fixed: number, extra: number, mult: number, description: string): Combo => {
  const base = cards.reduce((s, c) => s + c.value, 0);
  const suitBonus = cards.reduce((s, c) => {
    if (c.suit === "brasa") return s + 2;
    if (c.suit === "ginga" && (id === "run" || id === "royal")) return s + 3;
    if (c.suit === "mare" && new Set(cards.map(x => x.suit)).size >= 3) return s + 2;
    if (c.suit === "sertao" && cards.length >= 3) return s + 2;
    return s;
  }, 0);
  const bonus = fixed + extra;
  return { id, name, cards, base, bonus, multiplier: mult, suitBonus, total: (base + bonus + suitBonus) * mult, description };
};

export function detectCombos(cards: Card[]): Combo[] {
  const found: Combo[] = [];
  const add = (c: Combo) => { if (!found.some(x => x.id === c.id && x.cards.map(k => k.id).join() === c.cards.map(k => k.id).join())) found.push(c); };
  for (let n = 2; n <= Math.min(5, cards.length); n++) for (const set of combinations(cards, n)) {
    const vals = set.map(c => c.value).sort((a,b) => a-b);
    const sameValue = new Set(vals).size === 1;
    const sameSuit = new Set(set.map(c => c.suit)).size === 1;
    if (n === 2 && sameValue) add(scoreCombo("pair","Parceria",set,10,0,1,"Dois valores iguais"));
    if (n === 3 && sameValue) add(scoreCombo("triple","Trinca de Respeito",set,25,0,2,"Três valores iguais"));
    if (n === 4 && sameValue) add(scoreCombo("four","Bonde Fechado",set,50,0,3,"Quatro valores iguais"));
    if (n >= 3 && consecutive(vals)) add(scoreCombo("run","Escadinha",set,20,(n-3)*8,2,"Valores consecutivos"));
    if (n >= 3 && sameSuit) add(scoreCombo("flush","Revoada",set,20,(n-3)*8,2,"Todas do mesmo naipe"));
    if (n === 5 && sameSuit && consecutive(vals)) add(scoreCombo("royal","Sequência de Ouro",set,100,0,5,"Cinco valores consecutivos do mesmo naipe"));
    if (n === 5) {
      const counts = new Map<number, number>();
      vals.forEach(v => counts.set(v,(counts.get(v)||0)+1));
      const freq = [...counts.values()].sort((a,b)=>b-a);
      if (freq[0] === 3 && freq[1] === 2) add(scoreCombo("full","Virada de Mesa",set,65,0,3,"Uma trinca e um par"));
      if (freq[0] === 4) add(scoreCombo("quadra","Quadra Suprema",set,75,0,4,"Quatro iguais e uma carta extra"));
    }
  }
  return found.sort((a,b)=>b.total-a.total);
}
export function drawCards(deck: Card[], discard: Card[], hand: Card[], target = 7) {
  const d = [...deck], bin = [...discard], h = [...hand];
  while (h.length < target) {
    if (!d.length) {
      if (!bin.length) break;
      d.push(...shuffle(bin.splice(0)));
    }
    const card = d.pop();
    if (card) h.push(card);
  }
  return { deck: d, discard: bin, hand: h };
}