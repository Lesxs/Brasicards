# BRASICARDS

Roguelite brasileiro de cartas, com combos, relíquias, eventos, chefes e pontuações crescentes.

## Status

**Protótipo de campanha 0.2.0.** O ciclo principal de uma campanha está conectado e os sistemas de conteúdo estão ativos. Ainda não é uma versão comercial final.

## O que já funciona

- Baralho de 40 cartas, quatro naipes e valores de 1 a 10.
- Mão de sete cartas, quatro jogadas e três descartes por rodada.
- O jogador escolhe entre combinações detectadas; cartas não usadas na combinação permanecem na mão.
- Pontuação com bônus de naipe, multiplicadores e feedback animado.
- Campanha de três etapas: nove rodadas normais, três encontros, três lojas e três chefes.
- Doze cartas especiais, doze relíquias e dez eventos catalogados.
- Inventário de relíquias limitado a cinco, sem cópias.
- Loja com compra e venda de itens.
- Desbloqueios de cartas especiais persistidos no navegador.
- Efeitos específicos dos três chefes.
- Máquina fictícia que consome Fator Sorte e concede pontos; não há apostas ou dinheiro real.
- Efeitos sonoros gerados localmente com Web Audio, com controle de ativação.
- Interface responsiva para desktop e dispositivos móveis.
- Salvamento local com validação e recuperação de dados inválidos.

## Campanha

Cada etapa tem duas rodadas normais, um evento, uma terceira rodada normal, uma loja e um chefe:
1. A cidade acordou — O Fiscal limita combinações a quatro cartas.
2. O caos começou — O Azarado reduz em 20% a pontuação de combinações.
3. A última aposta — Máquina Quebrada bloqueia os giros.

Depois de cada chefe, escolha uma entre três recompensas. Após o último chefe, a campanha termina.

## Tecnologia

- React 18 + TypeScript + Vite
- CSS responsivo e animações
- Web Audio API
- LocalStorage
- Vitest

## Desenvolvimento

```bash
npm install
npm run dev
```

## Testes e build

```bash
npm test
npm run build
```

O GitHub Actions executa os testes e o build em cada push e pull request para `main`.

## Próximas etapas

Arte original das cartas e cenários, playtesting de balanceamento, eventos com consequências mais variadas, histórico de partidas, acessibilidade adicional e publicação estável. Valores de pontuação, preços e metas ainda são provisórios.
