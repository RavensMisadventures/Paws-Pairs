// js/game.js
import { characters, items } from "./data.js";

/**
 * Raven’s Cozy Keepsakes — kid-friendly release logic
 * - Starts at 4 cards (2 pairs), then 6, 8, 10, 12...
 * - Early levels: identical matches only (gentle & predictable)
 * - Later: optional story matching (character ↔ correct item)
 */

const BACK_DEFAULT = "assets/backs/raven-seal.png";
const BACK_AGED = "assets/backs/raven-seal-aged.png";

// Neurodivergent-friendly progression
const LEVELS = [
  { id: 1, name: "Level 1 • 4 Cards (2×2)",  cols: 2, rows: 2, mode: "identical", pool: ["raven", "cookie"], back: BACK_DEFAULT, showTimer: false },
  { id: 2, name: "Level 2 • 6 Cards (3×2)",  cols: 3, rows: 2, mode: "identical", pool: ["raven", "willow", "cookie"], back: BACK_DEFAULT, showTimer: false },
  { id: 3, name: "Level 3 • 8 Cards (4×2)",  cols: 4, rows: 2, mode: "identical", pool: ["raven", "willow", "cookie", "mouse"], back: BACK_DEFAULT, showTimer: false },
  { id: 4, name: "Level 4 • 10 Cards (5×2)", cols: 5, rows: 2, mode: "identical", pool: ["raven", "willow", "salem", "cookie", "mouse"], back: BACK_DEFAULT, showTimer: false },
  { id: 5, name: "Level 5 • 12 Cards (4×3)", cols: 4, rows: 3, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse"], back: BACK_DEFAULT, showTimer: false },

  // Level 6: matching pairs (bigger board)
  { id: 6, name: "Level 6 • 16 Cards (4×4)", cols: 4, rows: 4, mode: "identical", pool: ["raven","willow","salem","bo","cookie","mouse","sock","leaf"], back: BACK_DEFAULT, showTimer: false },
];


// --------- DOM ----------
const gridEl = document.getElementById("grid");
const levelSelectEl = document.getElementById("levelSelect");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const triesEl = document.getElementById("moves");
const matchesEl = document.getElementById("matches");
const totalPairsEl = document.getElementById("totalPairs");
const timeEl = document.getElementById("time");
const messageEl = document.getElementById("message");

// Start screen (storybook)
const startScreen = document.getElementById("startScreen");
const storybookStartBtn = document.getElementById("storybookStartBtn");
const startLevelSelect = document.getElementById("startLevelSelect");

// Win overlay
const winOverlay = document.getElementById("winOverlay");
const winTitle = document.getElementById("winTitle");
const winStats = document.getElementById("winStats");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const closeWinBtn = document.getElementById("closeWinBtn");

// --------- State ----------
let currentLevel = LEVELS[0];
let deck = [];
let flipped = [];
let locked = false;

let tries = 0;
let matches = 0;
let totalPairs = 0;

let timer = null;
let startTimeMs = 0;

// --------- Data helpers ----------
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

function setMessage(text) {
  messageEl.textContent = text;
}

function setTimerVisible(visible) {
  const timeBox = timeEl?.closest(".hud__item");
  if (!timeBox) return;
  timeBox.style.display = visible ? "" : "none";
}

function getEncouragement() {
  const messages = [
    "You did a great job 🌟",
    "Nice matching!",
    "Raven is proud of you 💛",
    "That was wonderful!",
    "You kept trying — great work!",
    "Look at you go!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// --------- Deck builders ----------
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
    // Character ↔ correct item
    const basePairs = characters.flatMap(c => ([
      { type: "character", id: c.id, matchKey: `story:${c.id}` },
      { type: "item", id: c.matchItem, matchKey: `story:${c.id}` },
    ]));

    const cards = [];
    while (cards.length < cardCount) cards.push(...basePairs);
    cards.length = cardCount;

    return shuffle(cards).map((c, idx) => ({ ...c, idx, isMatched: false }));
  }

  throw new Error(`Unknown mode: ${level.mode}`);
}

// --------- Rendering ----------
function renderLevelOptions() {
  // Fill BOTH dropdowns: top bar + storybook start screen
  levelSelectEl.innerHTML = "";
  startLevelSelect.innerHTML = "";

  for (const lvl of LEVELS) {
    const optTop = document.createElement("option");
    optTop.value = String(lvl.id);
    optTop.textContent = lvl.name;
    levelSelectEl.appendChild(optTop);

    const optStart = document.createElement("option");
    optStart.value = String(lvl.id);
    optStart.textContent = lvl.name;
    startLevelSelect.appendChild(optStart);
  }

  levelSelectEl.value = String(currentLevel.id);
  startLevelSelect.value = String(currentLevel.id);
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

// --------- Stats / timer ----------
function resetStats() {
  tries = 0;
  matches = 0;
  totalPairs = (currentLevel.cols * currentLevel.rows) / 2;

  triesEl.textContent = String(tries);
  matchesEl.textContent = String(matches);
  totalPairsEl.textContent = String(totalPairs);

  timeEl.textContent = "0:00";
  setTimerVisible(!!currentLevel.showTimer);
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

// --------- Overlays ----------
function openWinOverlay(titleText, bodyText) {
  winTitle.textContent = titleText;
  winStats.textContent = bodyText;
  winOverlay.classList.add("is-open");
}

function closeWinOverlay() {
  winOverlay.classList.remove("is-open");
}

function closeStartScreen() {
  startScreen.classList.remove("is-open");
}

// --------- Game flow ----------
function startGame() {
  stopTimer();
  locked = false;
  flipped = [];

  deck = buildDeck(currentLevel);
  resetStats();
  renderGrid();

  if (currentLevel.showTimer) startTimer();

  setMessage("Find matching pairs.");
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function onCardClick(index) {
  if (!startBtn.disabled) return; // not started
  if (locked) return;
  if (deck[index]?.isMatched) return;
  if (flipped.includes(index)) return;

  flipCard(index);
  flipped.push(index);

  if (flipped.length < 2) return;

  locked = true;
  tries += 1;
  triesEl.textContent = String(tries);

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
      const encouragement = getEncouragement();
      setMessage(encouragement);
      openWinOverlay(encouragement, "Want to play again, or try the next one?");
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

// --------- Events ----------
levelSelectEl.addEventListener("change", () => {
  const id = Number(levelSelectEl.value);
  const lvl = LEVELS.find(l => l.id === id);
  if (lvl) currentLevel = lvl;
});

startLevelSelect.addEventListener("change", () => {
  const id = Number(startLevelSelect.value);
  const lvl = LEVELS.find(l => l.id === id);
  if (lvl) {
    currentLevel = lvl;
    levelSelectEl.value = String(lvl.id);
  }
});

storybookStartBtn.addEventListener("click", () => {
  closeStartScreen();
  startGame();
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

closeWinBtn?.addEventListener("click", closeWinOverlay);

playAgainBtn?.addEventListener("click", () => {
  closeWinOverlay();
  startGame();
});

nextLevelBtn?.addEventListener("click", () => {
  closeWinOverlay();
  const idx = LEVELS.findIndex(l => l.id === currentLevel.id);
  const next = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
  currentLevel = next;
  levelSelectEl.value = String(next.id);
  startLevelSelect.value = String(next.id);
  startGame();
});

// --------- Init ----------
(function init(){
  renderLevelOptions();
  resetGame();

  // Default to Level 1 (4 cards)
  currentLevel = LEVELS[0];
  levelSelectEl.value = String(currentLevel.id);
  startLevelSelect.value = String(currentLevel.id);

  setTimerVisible(false);
})();
