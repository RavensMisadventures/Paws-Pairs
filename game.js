// js/game.js
import { characters, items } from "./data.js";

/**
 * Raven’s Cozy Keepsakes — core matching logic
 * Modes:
 *  - identical: match same-id pairs (character-character or item-item)
 *  - story: match character to their assigned item
 */

const ASSET_BACK_DEFAULT = "assets/backs/raven-seal.png";
const ASSET_BACK_AGED = "assets/backs/raven-seal-aged.png";

const LEVELS = [
  // Beginner: identical character pairs (2x4)
  { id: 1, name: "Level 1 • Cozy Start (2×4)", cols: 4, rows: 2, mode: "identical", pool: ["raven", "willow", "salem", "bo"], back: ASSET_BACK_DEFAULT },

  // Identical mix (3x4)
  { id: 2, name: "Level 2 • Friends & Finds (3×4)", cols: 4, rows: 3, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse"], back: ASSET_BACK_DEFAULT },

  // Bigger identical mix (4x4)
  { id: 3, name: "Level 3 • Memory Meadow (4×4)", cols: 4, rows: 4, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse", "sock", "leaf"], back: ASSET_BACK_DEFAULT },

  // Story match: character <-> item (4x4)
  { id: 4, name: "Level 4 • Story Pairs (4×4)", cols: 4, rows: 4, mode: "story", back: ASSET_BACK_AGED },

  // Story match + decoy identicals (4x5)
  { id: 5, name: "Level 5 • Cozy Chaos (4×5)", cols: 5, rows: 4, mode: "story+decoys", back: ASSET_BACK_AGED },
];

// --------- DOM ----------
const gridEl = document.getElementById("grid");
const levelSelectEl = document.getElementById("levelSelect");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const movesEl = document.getElementById("moves");
const matchesEl = document.getElementById("matches");
const totalPairsEl = document.getElementById("totalPairs");
const timeEl = document.getElementById("time");
const messageEl = document.getElementById("message");

// --------- State ----------
let currentLevel = LEVELS[0];
let deck = [];
let flipped = []; // indices in deck
let locked = false;

let moves = 0;
let matches = 0;
let totalPairs = 0;

let timer = null;
let startTimeMs = 0;

// --------- Data helpers ----------
const charById = new Map(characters.map(c => [c.id, c]));
const itemById = new Map(items.map(i => [i.id, i]));

function getImageForCard(card) {
  if (card.type === "character") return charById.get(card.id)?.image;
  if (card.type === "item") return itemById.get(card.id)?.image;
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

// --------- Deck builders ----------
function buildDeck(level) {
  const cardCount = level.cols * level.rows;
  if (cardCount % 2 !== 0) throw new Error("Grid must have an even number of cards.");

  if (level.mode === "identical") {
    // Pick N unique IDs from pool, then duplicate to create pairs.
    const pairCount = cardCount / 2;
    const pool = level.pool.slice();
    if (pool.length < pairCount) {
      throw new Error("Not enough unique cards in pool for this level.");
    }
    shuffle(pool);
    const picks = pool.slice(0, pairCount);

    // Determine whether each pick is a character or item
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
    // Pure story pairs: each character + their matched item
    // We’ll include all 4 character-item pairs; fill grid by repeating pairs if needed.
    const basePairs = characters.map(c => ([
      { type: "character", id: c.id, matchKey: `story:${c.id}` },
      { type: "item", id: c.matchItem, matchKey: `story:${c.id}` },
    ])).flat();

    const needed = cardCount;
    const cards = [];
    while (cards.length < needed) {
      cards.push(...basePairs);
    }
    cards.length = needed;
    return shuffle(cards).map((c, idx) => ({ ...c, idx, isMatched: false }));
  }

  if (level.mode === "story+decoys") {
    // Mix story pairs + some identical item decoys
    const cardPairsNeeded = cardCount / 2;

    const storyPairs = characters.map(c => ({
      type: "pair",
      key: `story:${c.id}`,
      cards: [
        { type: "character", id: c.id, matchKey: `story:${c.id}` },
        { type: "item", id: c.matchItem, matchKey: `story:${c.id}` },
      ],
    }));

    // Decoy identical items (non-assigned or just extras)
    // Pick from all items, but avoid duplicates that would collide with story items if you prefer.
    const decoyItemIds = items.map(i => i.id).filter(Boolean);

    // Build pairs list
    const pairs = [];
    pairs.push(...storyPairs);

    // Fill remaining pairs with identical item pairs
    while (pairs.length < cardPairsNeeded) {
      const id = decoyItemIds[Math.floor(Math.random() * decoyItemIds.length)];
      pairs.push({
        type: "pair",
        key: `same:${id}:${pairs.length}`,
        cards: [
          { type: "item", id, matchKey: `same:${id}:${pairs.length}` },
          { type: "item", id, matchKey: `same:${id}:${pairs.length}` },
        ],
      });
    }

    // Trim to exact pair count then flatten
    const flat = pairs.slice(0, cardPairsNeeded).flatMap(p => p.cards);
    return shuffle(flat).map((c, idx) => ({ ...c, idx, isMatched: false }));
  }

  throw new Error(`Unknown mode: ${level.mode}`);
}

// --------- Rendering ----------
function setMessage(text) {
  messageEl.textContent = text;
}

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

  for (let i = 0; i < deck.length; i++) {
    const card = deck[i];

    const cardEl = document.createElement("button");
    cardEl.type = "button";
    cardEl.className = "card";
    cardEl.setAttribute("aria-label", "Card");
    cardEl.dataset.index = String(i);

    const inner = document.createElement("div");
    inner.className = "card__inner";

    // Back face
    const back = document.createElement("div");
    back.className = "face face--back";
    const sealImg = document.createElement("img");
    sealImg.className = "face__seal";
    sealImg.alt = "Card back";
    sealImg.src = currentLevel.back || ASSET_BACK_DEFAULT;
    back.appendChild(sealImg);

    // Front face
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
  }
}

// --------- Game flow ----------
function resetStats() {
  moves = 0;
  matches = 0;
  totalPairs = Math.floor((currentLevel.cols * currentLevel.rows) / 2);

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
  const cardBtn = gridEl.querySelector(`.card[data-index="${index}"]`);
  if (!cardBtn) return;
  cardBtn.classList.add("is-flipped");
}

function unflipCard(index) {
  const cardBtn = gridEl.querySelector(`.card[data-index="${index}"]`);
  if (!cardBtn) return;
  cardBtn.classList.remove("is-flipped");
}

function markMatched(indexA, indexB) {
  const aBtn = gridEl.querySelector(`.card[data-index="${indexA}"]`);
  const bBtn = gridEl.querySelector(`.card[data-index="${indexB}"]`);
  aBtn?.classList.add("is-matched");
  bBtn?.classList.add("is-matched");

  deck[indexA].isMatched = true;
  deck[indexB].isMatched = true;
}

function isMatch(indexA, indexB) {
  const a = deck[indexA];
  const b = deck[indexB];
  return a.matchKey === b.matchKey;
}

async function onCardClick(index) {
  if (startBtn.disabled === false) return; // not started
  if (locked) return;
  if (deck[index].isMatched) return;
  if (flipped.includes(index)) return;

  // Flip selection
  flipCard(index);
  flipped.push(index);

  if (flipped.length < 2) return;

  // Evaluate
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

  // Not a match: pause briefly t
