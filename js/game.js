// js/game.js
import { characters, items, storyPairs } from "../data.js";

/**
 * Paws & Pairs — calm memory match for young kids
 * - Identical matching for most levels
 * - Optional Story mode level included
 * - Win screen shows different character each level (includes raven-dance.gif)
 * - Game scene decor changes per level (characters + items)
 */

const BACK_DEFAULT = "assets/backs/raven-seal.png";
const BACK_AGED = "assets/backs/raven-seal-aged.png"; // optional if you have it

const byId = (id) => document.getElementById(id);

const startScreen = byId("startScreen");
const startLevelSelect = byId("startLevelSelect");
const storybookStartBtn = byId("storybookStartBtn");

const levelSelect = byId("levelSelect");
const startBtn = byId("startBtn");
const resetBtn = byId("resetBtn");

const grid = byId("grid");
const message = byId("message");

const movesEl = byId("moves");
const matchesEl = byId("matches");
const totalPairsEl = byId("totalPairs");
const timeEl = byId("time");

const winOverlay = byId("winOverlay");
const winTitle = byId("winTitle");
const winStats = byId("winStats");
const winCharacter = byId("winCharacter");
const encourage = byId("encourage");
const playAgainBtn = byId("playAgainBtn");
const nextLevelBtn = byId("nextLevelBtn");
const closeWinBtn = byId("closeWinBtn");

// Decor elements around board
const decLeftChar = byId("decLeftChar");
const decRightChar = byId("decRightChar");
const decItem1 = byId("decItem1");
const decItem2 = byId("decItem2");
const decItem3 = byId("decItem3");

const lookup = new Map();
for (const c of characters) lookup.set(c.id, c);
for (const i of items) lookup.set(i.id, i);

function asset(id){
  const obj = lookup.get(id);
  if (!obj) return null;
  return obj.src;
}

function label(id){
  const obj = lookup.get(id);
  return obj ? obj.name : id;
}

/**
 * Levels:
 * - Level 1 starts with 4 cards (2 pairs)
 * - Level 2: 6 cards (3 pairs)
 * - Level 3: 8 cards (4 pairs)
 * - Level 4: 12 cards (6 pairs)
 * - Level 5: 16 cards (8 pairs)
 * - Level 6: 20 cards (10 pairs)  <-- matching pairs
 */
const LEVELS = [
  { id: 1, name: "Level 1 • 4 Cards (2×2)", cols: 2, rows: 2, mode: "identical", pool: ["raven", "willow"], back: BACK_DEFAULT },
  { id: 2, name: "Level 2 • 6 Cards (3×2)", cols: 3, rows: 2, mode: "identical", pool: ["raven", "willow", "cookie"], back: BACK_DEFAULT },
  { id: 3, name: "Level 3 • 8 Cards (4×2)", cols: 4, rows: 2, mode: "identical", pool: ["raven", "willow", "cookie", "leaf"], back: BACK_DEFAULT },
  { id: 4, name: "Level 4 • 12 Cards (4×3)", cols: 4, rows: 3, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse"], back: BACK_DEFAULT },
  { id: 5, name: "Level 5 • 16 Cards (4×4)", cols: 4, rows: 4, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse", "sock", "feather"], back: BACK_DEFAULT },
  { id: 6, name: "Level 6 • 20 Cards (5×4)", cols: 5, rows: 4, mode: "identical", pool: ["raven", "willow", "salem", "bo", "cookie", "mouse", "sock", "feather", "leaf", "rock"], back: BACK_DEFAULT },

  // Optional story mode (leave for later if you want)
  // { id: 7, name: "Bonus • Story Pairs (4×4)", cols: 4, rows: 4, mode: "story", back: BACK_AGED },
];

const WIN_CHARACTER_BY_LEVEL = {
  1: "willow",
  2: "bo",
  3: "salem",
  4: "raven-dance",
  5: "raven",
  6: "raven-dance",
};

const ENCOURAGEMENTS = [
  "Nice try!",
  "You’re doing great!",
  "Great remembering!",
  "High five!",
  "So close — try again!",
  "You found a pair!",
];

let currentLevelId = 1;

let deck = [];
let first = null;
let second = null;
let lock = false;

let moves = 0;
let matches = 0;
let totalPairs = 0;

let timer = null;
let startTime = 0;

/* ---------- setup UI ---------- */

function populateLevelSelects(){
  const opts = LEVELS.map(l => `<option value="${l.id}">${l.name}</option>`).join("");
  levelSelect.innerHTML = opts;
  startLevelSelect.innerHTML = opts;

  levelSelect.value = String(currentLevelId);
  startLevelSelect.value = String(currentLevelId);
}

function setMessage(text){
  message.textContent = text;
}

function formatTime(ms){
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function stopTimer(){
  if (timer) clearInterval(timer);
  timer = null;
}

function startTimer(){
  stopTimer();
  startTime = Date.now();
  timer = setInterval(() => {
    timeEl.textContent = formatTime(Date.now() - startTime);
  }, 250);
}

function resetStats(){
  moves = 0;
  matches = 0;
  movesEl.textContent = "0";
  matchesEl.textContent = "0";
  totalPairsEl.textContent = "0";
  timeEl.textContent = "0:00";
}

function pickEncouragement(){
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

/* ---------- deck building ---------- */

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(level){
  const slots = level.cols * level.rows;

  if (level.mode === "story"){
    const pairs = [];
    const storyCharIds = Object.keys(storyPairs);

    for (const cid of storyCharIds){
      const iid = storyPairs[cid];
      if (asset(cid) && asset(iid)){
        pairs.push({ a: cid, b: iid, matchKey: `story:${cid}` });
      }
    }

    const cards = [];
    for (const p of pairs){
      cards.push(makeCard(p.a, p.matchKey), makeCard(p.b, p.matchKey));
    }

    const remaining = slots - cards.length;
    if (remaining > 0){
      const extraPool = [...new Set([...(level.pool || []), ...items.map(i=>i.id)])]
        .filter(id => asset(id));
      shuffle(extraPool);

      while (cards.length < slots && extraPool.length){
        const id = extraPool.pop();
        cards.push(makeCard(id, `id:${id}`), makeCard(id, `id:${id}`));
      }
    }

    return shuffle(cards).slice(0, slots);
  }

  const pairsNeeded = Math.floor(slots / 2);
  const pool = (level.pool || []).filter(id => asset(id));

  const chosen = [];
  const poolCopy = shuffle([...pool]);

  while (chosen.length < pairsNeeded && poolCopy.length){
    chosen.push(poolCopy.pop());
  }

  while (chosen.length < pairsNeeded && pool.length){
    chosen.push(pool[chosen.length % pool.length]);
  }

  const cards = [];
  for (const id of chosen){
    cards.push(makeCard(id, `id:${id}`));
    cards.push(makeCard(id, `id:${id}`));
  }

  return shuffle(cards).slice(0, slots);
}

function makeCard(faceId, matchKey){
  return {
    uid: crypto.randomUUID(),
    faceId,
    matchKey,
    flipped: false,
    matched: false,
  };
}

/* ---------- rendering ---------- */

function render(level){
  grid.innerHTML = "";
  grid.dataset.cols = String(level.cols);

  totalPairs = Math.floor((level.cols * level.rows) / 2);
  totalPairsEl.textContent = String(totalPairs);

  for (const card of deck){
    const btn = document.createElement("button");
    btn.className = "card";
    btn.type = "button";
    btn.setAttribute("aria-label", `Card`);
    btn.dataset.uid = card.uid;

    const inner = document.createElement("div");
    inner.className = "card__inner";

    const back = document.createElement("div");
    back.className = "face face--back";

    const seal = document.createElement("img");
    seal.className = "face__seal";
    seal.alt = "";
    seal.src = level.back || BACK_DEFAULT;
    back.appendChild(seal);

    const front = document.createElement("div");
    front.className = "face face--front";

    const img = document.createElement("img");
    img.className = "face__img";
    img.alt = label(card.faceId);
    img.src = asset(card.faceId) || "";
    front.appendChild(img);

    inner.appendChild(back);
    inner.appendChild(front);
    btn.appendChild(inner);

    btn.addEventListener("click", () => onCardClick(card.uid));
    grid.appendChild(btn);
  }

  syncVisualState();
}

function syncVisualState(){
  for (const card of deck){
    const el = grid.querySelector(`[data-uid="${card.uid}"]`);
    if (!el) continue;

    el.classList.toggle("is-flipped", card.flipped || card.matched);
    el.classList.toggle("is-matched", card.matched);
  }

  movesEl.textContent = String(moves);
  matchesEl.textContent = String(matches);
}

/* ---------- decor scene updates (per-level) ---------- */

function chooseDecorCharacters(level){
  const odd = level.id % 2 === 1;
  const left = odd ? "willow" : "raven";
  const right = odd ? "raven" : "willow";
  return { left, right };
}

function chooseDecorItems(level){
  const pool = (level.pool || []).filter(id => asset(id));
  const poolItems = pool.filter(id => lookup.get(id)?.type === "item");

  const fallback = [
    "cookie","leaf","mouse","sock","feather","rock","cat-bed","security-blanket"
  ].filter(id => asset(id));

  const candidates = poolItems.length ? poolItems : fallback;
  const picked = shuffle([...candidates]).slice(0, 3);

  const a = picked[0] || "cookie";
  const b = picked[1] || "leaf";
  const c = picked[2] || "mouse";
  return [a,b,c];
}

function updateDecor(level){
  const { left, right } = chooseDecorCharacters(level);
  decLeftChar.src = asset(left) || "assets/characters/willow.png";
  decRightChar.src = asset(right) || "assets/characters/raven.png";

  const [a,b,c] = chooseDecorItems(level);
  decItem1.src = asset(a) || asset("cookie");
  decItem2.src = asset(b) || asset("leaf");
  decItem3.src = asset(c) || asset("mouse");
}

/* ---------- game flow ---------- */

function setLevel(id){
  currentLevelId = id;
  levelSelect.value = String(id);
  startLevelSelect.value = String(id);
}

function getLevel(){
  return LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
}

function startGame(){
  const level = getLevel();

  resetBtn.disabled = false;
  closeWin();

  resetStats();
  stopTimer();
  startTimer();

  first = null;
  second = null;
  lock = false;

  deck = buildDeck(level);
  render(level);
  updateDecor(level);

  setMessage("Find the pairs!");
}

function resetGame(){
  stopTimer();
  resetStats();
  grid.innerHTML = "";
  first = null;
  second = null;
  lock = false;
  deck = [];
  setMessage("Choose a level and press Start.");
  resetBtn.disabled = true;
}

function onCardClick(uid){
  if (lock) return;

  const card = deck.find(c => c.uid === uid);
  if (!card || card.matched) return;
  if (card.flipped) return;

  card.flipped = true;
  syncVisualState();

  if (!first){
    first = card;
    encourage.textContent = "";
    return;
  }

  if (!second){
    second = card;
    moves += 1;
    movesEl.textContent = String(moves);

    lock = true;
    window.setTimeout(checkMatch, 520);
  }
}

function checkMatch(){
  if (!first || !second){
    lock = false;
    return;
  }

  const isMatch = first.matchKey === second.matchKey;

  if (isMatch){
    first.matched = true;
    second.matched = true;
    matches += 1;

    matchesEl.textContent = String(matches);

    encourage.textContent = "You found a pair!";
    encourage.classList.remove("wiggle");
    void encourage.offsetWidth;
    encourage.classList.add("wiggle");

    first = null;
    second = null;
    lock = false;

    syncVisualState();

    if (matches >= totalPairs){
      onWin();
    }
    return;
  }

  encourage.textContent = pickEncouragement();
  encourage.classList.remove("wiggle");
  void encourage.offsetWidth;
  encourage.classList.add("wiggle");

  window.setTimeout(() => {
    first.flipped = false;
    second.flipped = false;
    first = null;
    second = null;
    lock = false;
    syncVisualState();
  }, 520);
}

function onWin(){
  stopTimer();

  const ms = Date.now() - startTime;
  const level = getLevel();

  winTitle.textContent = `Level ${level.id} complete!`;
  winStats.textContent = `Tries: ${moves} • Time: ${formatTime(ms)}`;

  const winId = WIN_CHARACTER_BY_LEVEL[level.id] || "raven";
  winCharacter.src = asset(winId) || asset("raven") || "assets/characters/raven.png";

  winCharacter.classList.remove("wiggle");
  void winCharacter.offsetWidth;
  winCharacter.classList.add("wiggle");

  encourage.textContent = "Great job!";
  openWin();

  const nextExists = LEVELS.some(l => l.id === level.id + 1);
  nextLevelBtn.style.display = nextExists ? "inline-block" : "none";
}

function openWin(){
  winOverlay.classList.add("is-open");
}

function closeWin(){
  winOverlay.classList.remove("is-open");
}

/* ---------- wire up controls ---------- */

populateLevelSelects();

levelSelect.addEventListener("change", () => {
  setLevel(Number(levelSelect.value));
});

startLevelSelect.addEventListener("change", () => {
  setLevel(Number(startLevelSelect.value));
});

storybookStartBtn.addEventListener("click", () => {
  startScreen.classList.remove("is-open");
  startGame();
});

startBtn.addEventListener("click", () => {
  startGame();
});

resetBtn.addEventListener("click", () => {
  resetGame();
});

playAgainBtn.addEventListener("click", () => {
  closeWin();
  startGame();
});

nextLevelBtn.addEventListener("click", () => {
  const nextId = currentLevelId + 1;
  if (LEVELS.some(l => l.id === nextId)){
    setLevel(nextId);
    closeWin();
    startGame();
  } else {
    closeWin();
  }
});

closeWinBtn.addEventListener("click", () => {
  closeWin();
});

// Start at level 1
setLevel(1);
resetGame();
