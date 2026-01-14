import { characters, items } from "./data.js";

/**
 * Paws & Pairs (GitHub Pages /js version)
 * Adds:
 *  - Mute toggle (persists with localStorage)
 *  - Gentle WebAudio sound effects (no files needed)
 *  - Happy wiggle animations
 *  - Difficulty auto-adjust based on success
 */

const LEVELS = [
  { id: 1, pairs: 2, cols: 2 },   // 4 cards
  { id: 2, pairs: 3, cols: 3 },   // 6 cards
  { id: 3, pairs: 4, cols: 4 },   // 8 cards
  { id: 4, pairs: 6, cols: 4 },   // 12 cards
  { id: 5, pairs: 8, cols: 4 },   // 16 cards
  { id: 6, pairs: 10, cols: 4 },  // 20 cards (always 4 cols; mobile friendly)
];

// -------- Elements --------
const levelSelect = document.getElementById("levelSelect");
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const board = document.getElementById("game-board");

const triesEl = document.getElementById("tries");
const matchesEl = document.getElementById("matches");
const levelLabelEl = document.getElementById("levelLabel");

const winScreen = document.getElementById("win-screen");
const winMessageEl = document.getElementById("winMessage");
const difficultyNoteEl = document.getElementById("difficultyNote");
const playAgainBtn = document.getElementById("playAgainBtn");
const nextLevelBtn = document.getElementById("nextLevelBtn");

const muteBtn = document.getElementById("muteBtn");
const muteBtnStart = document.getElementById("muteBtnStart");

// -------- State --------
let currentLevelIndex = 0;
let flipped = [];
let matches = 0;
let tries = 0;

// Difficulty auto-adjust
const LS_LEVEL = "paws_pairs_level";
const LS_STREAK = "paws_pairs_streak";
const LS_MUTED = "paws_pairs_muted";

// -------- Populate levels --------
LEVELS.forEach((l) => {
  const opt = document.createElement("option");
  opt.value = String(l.id);
  opt.textContent = `Level ${l.id}`;
  levelSelect.appendChild(opt);
});

// Load saved level if present
const savedLevel = Number(localStorage.getItem(LS_LEVEL) || "1");
const savedIndex = Math.min(Math.max(savedLevel - 1, 0), LEVELS.length - 1);
levelSelect.value = String(savedIndex + 1);
currentLevelIndex = savedIndex;

// -------- Mute handling --------
let muted = localStorage.getItem(LS_MUTED) === "1";

function renderMuteButtons() {
  const label = muted ? "🔇 Muted" : "🔊 Sound";
  const aria = muted ? "true" : "false";
  const ariaLabel = muted ? "Sound muted" : "Sound on";

  if (muteBtn) {
    muteBtn.textContent = label;
    muteBtn.setAttribute("aria-pressed", aria);
    muteBtn.setAttribute("aria-label", ariaLabel);
  }
  if (muteBtnStart) {
    muteBtnStart.textContent = label;
    muteBtnStart.setAttribute("aria-pressed", aria);
    muteBtnStart.setAttribute("aria-label", ariaLabel);
  }
}

function toggleMute() {
  muted = !muted;
  localStorage.setItem(LS_MUTED, muted ? "1" : "0");
  renderMuteButtons();
}

muteBtn?.addEventListener("click", toggleMute);
muteBtnStart?.addEventListener("click", toggleMute);
renderMuteButtons();

// -------- Gentle sounds (WebAudio) --------
let audioCtx = null;
let audioEnabled = false;

function initAudio() {
  if (muted) return; // don't even start audio if muted
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioEnabled = true;
  } catch {
    audioEnabled = false;
  }
}

function tone(freq = 440, dur = 0.08, type = "triangle", vol = 0.05) {
  if (muted || !audioEnabled || !audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  // soft envelope
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + dur + 0.02);
}

const sFlip  = () => tone(520, 0.06, "triangle", 0.04);
const sNope  = () => { tone(220, 0.07, "sine", 0.035); setTimeout(() => tone(196, 0.08, "sine", 0.03), 50); };
const sMatch = () => { tone(660, 0.07, "triangle", 0.05); setTimeout(() => tone(880, 0.08, "triangle", 0.05), 70); };
const sWin   = () => [523, 659, 784, 988].forEach((f, i) => setTimeout(() => tone(f, 0.10, "triangle", 0.055), i * 90));

// -------- UI helpers --------
function updateUI() {
  triesEl.textContent = `Tries: ${tries}`;
  matchesEl.textContent = `Matches: ${matches}`;
  levelLabelEl.textContent = `Level ${currentLevelIndex + 1}`;
}

// Restart animations cleanly
function wiggle(el) {
  el.classList.remove("wiggle");
  void el.offsetWidth;
  el.classList.add("wiggle");
  setTimeout(() => el.classList.remove("wiggle"), 520);
}

function pop(el) {
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
  setTimeout(() => el.classList.remove("pop"), 260);
}

// -------- Game flow --------
startBtn.addEventListener("click", () => {
  // Apple devices need a user gesture to start audio
  if (!audioCtx) initAudio();

  // level from dropdown
  currentLevelIndex = Number(levelSelect.value) - 1;
  localStorage.setItem(LS_LEVEL, String(currentLevelIndex + 1));

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  winScreen.classList.add("hidden");

  startGame(LEVELS[currentLevelIndex]);
});

playAgainBtn.addEventListener("click", () => {
  winScreen.classList.add("hidden");
  startGame(LEVELS[currentLevelIndex]);
});

nextLevelBtn.addEventListener("click", () => {
  winScreen.classList.add("hidden");
  currentLevelIndex = Math.min(currentLevelIndex + 1, LEVELS.length - 1);
  localStorage.setItem(LS_LEVEL, String(currentLevelIndex + 1));
  levelSelect.value = String(currentLevelIndex + 1);
  startGame(LEVELS[currentLevelIndex]);
});

function startGame(level) {
  matches = 0;
  tries = 0;
  flipped = [];
  updateUI();

  // Grid columns (Level 6 always 4 cols; mobile friendly)
  board.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;

  // Normalize images from data.js: support img or src
  const pool = [...characters, ...items].filter(Boolean).map((x) => ({
    id: x.id,
    img: x.img || x.src,
    name: x.name || x.id,
  }));

  // pick pairs and duplicate
  const picked = pool.slice(0, level.pairs);
  const cards = [...picked, ...picked].sort(() => Math.random() - 0.5);

  board.innerHTML = "";
  cards.forEach((item) => createCard(item));

  tone(392, 0.08, "triangle", 0.04);
}

function createCard(item) {
  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "Memory card");

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back"></div>
      <div class="card-face card-front">
        <img src="${item.img}" alt="${item.name}">
      </div>
    </div>
  `;

  card.addEventListener("click", () => flip(card, item));
  board.appendChild(card);
}

function flip(card, item) {
  if (card.classList.contains("flipped") || flipped.length === 2) return;

  sFlip();
  card.classList.add("flipped");
  pop(card);

  flipped.push({ card, item });
  if (flipped.length === 2) check();
}

function check() {
  tries += 1;
  updateUI();

  const a = flipped[0];
  const b = flipped[1];

  if (a.item.id === b.item.id) {
    matches += 1;
    updateUI();
    sMatch();

    wiggle(a.card);
    wiggle(b.card);
    flipped = [];

    if (matches * 2 === board.children.length) {
      setTimeout(() => {
        sWin();
        showWin();
      }, 420);
    }
  } else {
    sNope();
    wiggle(a.card);
    wiggle(b.card);

    setTimeout(() => {
      a.card.classList.remove("flipped");
      b.card.classList.remove("flipped");
      flipped = [];
    }, 900);
  }
}

// -------- Difficulty auto-adjust by success --------
// comfy scoring: fewer tries = stronger success
function scoreWin(levelPairs, triesCount) {
  // Minimum tries is levelPairs if perfect. We allow a comfy margin.
  const perfect = levelPairs; // each pair found in one try
  const good = Math.ceil(levelPairs * 1.8);
  const ok = Math.ceil(levelPairs * 2.6);

  if (triesCount <= perfect) return "perfect";
  if (triesCount <= good) return "great";
  if (triesCount <= ok) return "ok";
  return "try-again";
}

function showWin() {
  const level = LEVELS[currentLevelIndex];
  const result = scoreWin(level.pairs, tries);

  // streak logic: only count great/perfect as "strong success"
  let streak = Number(localStorage.getItem(LS_STREAK) || "0");

  if (result === "great" || result === "perfect") {
    streak += 1;
  } else {
    streak = 0;
  }
  localStorage.setItem(LS_STREAK, String(streak));

  // Recommend next level if the kid is consistently successful
  const canAdvance = currentLevelIndex < LEVELS.length - 1;
  const shouldAdvance = canAdvance && streak >= 2;

  // Messages (gentle and encouraging)
  const msgMap = {
    perfect: "Wow! Super matching! ⭐⭐⭐",
    great: "Great job! ⭐⭐",
    ok: "Nice work! ⭐",
    "try-again": "That was a tricky one — you’re learning! 💛",
  };

  winMessageEl.textContent = msgMap[result] || "Nice matching!";
  difficultyNoteEl.textContent = shouldAdvance
    ? "You’re ready for a slightly bigger game next time."
    : "We’ll keep it comfy. You can try again or move on.";

  // Next level button availability
  nextLevelBtn.disabled = !canAdvance;
  nextLevelBtn.style.opacity = canAdvance ? "1" : ".5";

  // Auto-adjust: if strong streak, preselect next level and label it
  if (shouldAdvance) {
    currentLevelIndex += 1;
    localStorage.setItem(LS_LEVEL, String(currentLevelIndex + 1));
    levelSelect.value = String(currentLevelIndex + 1);

    // reset streak so it doesn't jump multiple levels
    localStorage.setItem(LS_STREAK, "0");

    winMessageEl.textContent = "Next level unlocked! ⭐⭐";
  }

  winScreen.classList.remove("hidden");
}
