import { characters, items } from "./data.js";

/**
 * Raven’s Cozy Keepsakes — release-ready core logic for GitHub Pages
 * Modes:
 *  - identical: match same-id pairs (character-character or item-item)
 *  - story: match character to their assigned item
 */

const BACK_DEFAULT = "assets/backs/raven-seal.png";
const BACK_AGED = "assets/backs/raven-seal-aged.png";

const LEVELS = [
  { id: 1, name: "Level 1 • Cozy Start (2×4)", cols: 4, rows: 2, mode: "identical", pool: ["raven", "willow", "salem", "bo"], back: BACK_DEFAULT },
  { id: 2, name: "Level 2 • Friends & Finds (3×4)", cols: 4, rows: 3, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse"], back: BACK_DEFAULT },
  { id: 3, name: "Level 3 • Memory Meadow (4×4)", cols: 4, rows: 4, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse", "sock", "leaf"], back: BACK_DEFAULT },
  { id: 4, name: "Level 4 • Story Pairs (4×4)", cols: 4, rows: 4, mode: "story", back: BACK_AGED },
  { id: 5, name: "Level 5 • Cozy Chaos (4×5)", cols: 5, rows: 4, mode: "story+decoys", back: BACK_AGED },
];

const gridEl = document.getElementById("grid");
const levelSelectEl = document.getElementById("levelSelect");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const movesEl = document.getElementById("moves");
const matchesEl = document.getElementById("matches");
const totalPairsEl = document.getElementById("totalPairs");
const timeEl = document.getElementById("time");
const messageEl = document.getElementById("message");

let currentLevel = LEVELS[0];
let deck = [];
let flipped = [];
let locked = false;

let moves = 0;
let matches = 0;
let totalPairs = 0;

let timer = null;
let startTimeMs = 0;

const charById = new Map(characters.map(c => [c.id, c]));
const itemById = new Map(items.map(i => [i.id, i]));

function getImageForCard(card) {
  if (card.type === "character") return charById.get(card.id)?.image || "";
  if (card.type === "item") return itemById.get(card.id)?.image || "";
  return "";
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildDeck(level) {
  const cardCount = level.cols * level.rows;
  if (cardCount % 2 !== 0) throw new Error("Grid must have an even number of cards.");

  if (level.mode === "identical") {
    const pairCount = cardCount / 2;
    const pool = level.pool.slice();
    if (pool.length < pairCount) throw new Error("Not enough unique cards in pool for this level.");

    shuffle(pool);
    const picks = pool.slice(0, pairCount);

    const cards = [];
    for (const id of picks) {
      if (charById.has(id)) {
        cards.push({ type: "character", id, matchKey: `same:${id}` });
        cards.push({ type: "character", id, matchKey: `same:${id}` });
      } else if (itemById.has(id)) {
        cards.push({ type: "item", id, matchKey: `same:${id}` });
        cards.push({ type: "item", id, matchKey: `same:${id}` });
      } else {
        throw new Error(`Unknown card id in pool: ${id}`);
      }
    }
    return shuffle(cards).map((c, idx) => ({ ...c, idx, isMatched: false }));
  }

  if (level.mode === "story") {
    const basePairs = characters.flatMap(c => ([
      { type: "character", id: c.id, matchKey: `story:${c.id}` },
      { type: "item", id: c.matchItem, matchKey: `story:${c.id}` },
    ]));

    const cards = [];
    while (cards.length < cardCount) cards.push(...basePairs);
    cards.length = cardCount;
    return shuffle(cards).map((c, idx) => ({ ...c, idx, isMatched: false }));
  }

  if (level.mode === "story+decoys") {
    const pairCount = cardCount / 2;

    const storyPairs = characters.map(c => ({
      cards: [
        { type: "character", id: c.id, matchKey: `story:${c.id}` },
        { type: "item", id: c.matchItem, matchKey: `story:${c.id}` },
      ]
    }));

    const decoyIds = items.map(i => i.id);
    const pairs = [...storyPairs];

    while (pairs.length < pairCount) {
      const id = decoyIds[Math.floor(Math.random() * decoyIds.length)];
      const uniqueKey = `same:${id}:${pairs.length}`;
      pairs.push({
        cards: [
          { type: "item", id, matchKey: uniqueKey },
          { type: "item", id, matchKey: uniqueKey },
        ]
      });
    }

    const flat = pairs.slice(0, pairCount).flatMap(p => p.cards);
    return shuffle(flat).map((c, idx) => ({ ...c, idx, isMatched: false }));
  }

  throw new Error(`Unknown mode: ${level.mode}`);
}

function setMessage(text) { messageEl.textContent = text; }

function renderLevelOptions() {
  levelSelectEl.innerHTML = "";
  for (const lvl of LEVELS) {
    const opt = document.createElement("option");
    opt.value = String(lvl.id);
    opt.textContent = lvl.name;
    levelSelectEl.appendChild(opt);
  }
  levelSelectEl.value = String(currentLevel.id);
}

function renderGrid() {
  gridEl.innerHTML = "";
  gridEl.dataset.cols = String(currentLevel.cols);

  deck.forEach((card, i) => {
    const cardEl = document.createElement("button");
    cardEl.type = "button";
    cardEl.className = "card";
    cardEl.setAttribute("aria-label", "Card");
    cardEl.dataset.index = String(i);

    const inner = document.createElement("div");
    inner.className = "card__inner";

    const back = document.createElement("div");
    back.className = "face face--back";
    const sealImg = document.createElement("img");
    sealImg.className = "face__seal";
    sealImg.alt = "Card back";
    sealImg.src = currentLevel.back || BACK_DEFAULT;
    back.appendChild(sealImg);

    const front = document.createElement("div");
    front.className = "face face--front";
    const img = document.createElement("img");
    img.className = "face__img";
    img.alt = "";
    img.src = getImageForCard(card);
    front.appendChild(img);

    inner.appendChild(back);
    inner.appendChild(front);
    cardEl.appendChild(inner);

    cardEl.addEventListener("click", () => onCardClick(i));
    gridEl.appendChild(cardEl);
  });
}

function resetStats() {
  moves = 0;
  matches = 0;
  totalPairs = (currentLevel.cols * currentLevel.rows) / 2;

  movesEl.textContent = String(moves);
  matchesEl.textContent = String(matches);
  totalPairsEl.textContent = String(totalPairs);

  timeEl.textContent = "0:00";
}

function stopTimer() {
  if (timer) window.clearInterval(timer);
  timer = null;
}

function startTimer() {
  stopTimer();
  startTimeMs = Date.now();
  timer = window.setInterval(() => {
    timeEl.textContent = formatTime(Date.now() - startTimeMs);
  }, 250);
}

function startGame() {
  stopTimer();
  locked = false;
  flipped = [];

  deck = buildDeck(currentLevel);
  resetStats();
  renderGrid();

  startTimer();
  setMessage("Find matching pairs!");
  startBtn.disabled = true;
  resetBtn.disabled = false;
  levelSelectEl.disabled = true;
}

function resetGame() {
  stopTimer();
  locked = false;
  flipped = [];
  deck = [];
  gridEl.innerHTML = "";
  resetStats();

  startBtn.disabled = false;
  resetBtn.disabled = true;
  levelSelectEl.disabled = false;
  setMessage("Choose a level and press Start.");
}

function flipCard(index) {
  const el = gridEl.querySelector(`.card[data-index="${index}"]`);
  el?.classList.add("is-flipped");
}

function unflipCard(index) {
  const el = gridEl.querySelector(`.card[data-index="${index}"]`);
  el?.classList.remove("is-flipped");
}

function markMatched(a, b) {
  const aEl = gridEl.querySelector(`.card[data-index="${a}"]`);
  const bEl = gridEl.querySelector(`.card[data-index="${b}"]`);
  aEl?.classList.add("is-matched");
  bEl?.classList.add("is-matched");
  deck[a].isMatched = true;
  deck[b].isMatched = true;
}

function isMatch(a, b) {
  return deck[a].matchKey === deck[b].matchKey;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function onCardClick(index) {
  if (!startBtn.disabled) return;       // not started
  if (locked) return;
  if (deck[index]?.isMatched) return;
  if (flipped.includes(index)) return;

  flipCard(index);
  flipped.push(index);

  if (flipped.length < 2) return;

  locked = true;
  moves += 1;
  movesEl.textContent = String(moves);

  const [a, b] = flipped;
  const ok = isMatch(a, b);

  if (ok) {
    markMatched(a, b);
    matches += 1;
    matchesEl.textContent = String(matches);
    flipped = [];
    locked = false;

    if (matches === totalPairs) {
      stopTimer();
      setMessage(`Level complete! Time: ${timeEl.textContent} • Moves: ${moves}`);
      levelSelectEl.disabled = false;
      startBtn.disabled = false;
      resetBtn.disabled = false;
    }
    return;
  }

  await sleep(650);
  unflipCard(a);
  unflipCard(b);
  flipped = [];
  locked = false;
}

levelSelectEl.addEventListener("change", () => {
  const id = Number(levelSelectEl.value);
  const lvl = LEVELS.find(l => l.id === id);
  if (lvl) currentLevel = lvl;
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

(function init(){
  renderLevelOptions();
  resetGame();
})();
