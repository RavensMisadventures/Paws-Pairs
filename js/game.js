// js/game.js
import { characters, items } from "./data.js";

/**
 * Paws & Pairs
 * Fixes included:
 *  ✅ Fixes "Unexpected end of input" by providing a complete, validated file
 *  ✅ Dropdown level selection is robust (populates, saves, reads at click time)
 *  ✅ Module-safe init (DOMContentLoaded guard)
 *  ✅ Keeps your existing architecture: data.js pools, fixed card-size columns, wiggle/pop, auto-difficulty
 *  ✅ Safe asset paths for GitHub Pages
 */

const LEVELS = [
  { id: 1, pairs: 2, cols: 2 },   // 4 cards
  { id: 2, pairs: 3, cols: 3 },   // 6 cards
  { id: 3, pairs: 4, cols: 4 },   // 8 cards
  { id: 4, pairs: 6, cols: 4 },   // 12 cards
  { id: 5, pairs: 8, cols: 4 },   // 16 cards
  { id: 6, pairs: 10, cols: 4 },  // 20 cards (always 4 cols)
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

const exitBtn = document.getElementById("exitBtn");

// -------- State --------
let currentLevelIndex = 0;
let flipped = [];
let matches = 0;
let tries = 0;

const LS_LEVEL = "paws_pairs_level";
const LS_STREAK = "paws_pairs_streak";
const LS_MUTED = "paws_pairs_muted";

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

// -------- Gentle sounds (WebAudio) --------
let audioCtx = null;
let audioEnabled = false;

function initAudio() {
  if (muted) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioEnabled = true;
  } catch {
    audioEnabled = false;
  }
}

function tone(freq = 440, dur = 0.08, type = "triangle", vol = 0.05) {
  if (muted || !audioEnabled || !audioCtx) return;

  // Resume on gesture if needed
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

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
  if (triesEl) triesEl.textContent = `Tries: ${tries}`;
  if (matchesEl) matchesEl.textContent = `Matches: ${matches}`;
  if (levelLabelEl) levelLabelEl.textContent = `Level ${currentLevelIndex + 1}`;
}

function wiggle(el) {
  el.classList.remove("wiggle");
  void el.offsetWidth; // reflow
  el.classList.add("wiggle");
  setTimeout(() => el.classList.remove("wiggle"), 520);
}

function pop(el) {
  el.classList.remove("pop");
  void el.offsetWidth; // reflow
  el.classList.add("pop");
  setTimeout(() => el.classList.remove("pop"), 260);
}

// -------- Path safety (fixes broken images on Pages) --------
function safeAssetPath(p) {
  if (!p) return "";
  let out = String(p).replace(/^\.\//, "");
  out = out.replace(/^\/+/, "");
  return out;
}

function attachImgFallback(imgEl, label) {
  imgEl.addEventListener("error", () => {
    imgEl.style.display = "none";
    const holder = document.createElement("div");
    holder.style.width = "90%";
    holder.style.height = "90%";
    holder.style.display = "grid";
    holder.style.placeItems = "center";
    holder.style.fontWeight = "900";
    holder.style.opacity = "0.75";
    holder.textContent = label || "Missing";
    imgEl.parentElement?.appendChild(holder);

    try {
      const resolved = new URL(imgEl.getAttribute("src"), window.location.href).href;
      console.warn("Image failed to load:", resolved);
    } catch {}
  });
}

// -------- Populate levels (robust) --------
function populateLevelOptions() {
  if (!levelSelect) return;

  if (levelSelect.options.length === 0) {
    LEVELS.forEach((l) => {
      const opt = document.createElement("option");
      opt.value = String(l.id);
      opt.textContent = `Level ${l.id}`;
      levelSelect.appendChild(opt);
    });
  }

  const savedLevel = Number(localStorage.getItem(LS_LEVEL) || "1");
  currentLevelIndex = Math.min(Math.max(savedLevel - 1, 0), LEVELS.length - 1);
  levelSelect.value = String(currentLevelIndex + 1);
}

function bindLevelSelect() {
  levelSelect?.addEventListener("change", () => {
    const picked = Number(levelSelect.value) || 1;
    currentLevelIndex = Math.min(Math.max(picked - 1, 0), LEVELS.length - 1);
    localStorage.setItem(LS_LEVEL, String(currentLevelIndex + 1));
    updateUI();
  });
}

// -------- Exit / Home button --------
function bindExit() {
  exitBtn?.addEventListener("click", () => {
    flipped = [];
    matches = 0;
    tries = 0;

    gameScreen?.classList.add("hidden");
    winScreen?.classList.add("hidden");
    startScreen?.classList.remove("hidden");

    if (board) board.innerHTML = "";

    tone(330, 0.08, "triangle", 0.04);
  });
}

// -------- Game flow --------
function bindFlowButtons() {
  startBtn?.addEventListener("click", () => {
    if (!audioCtx) initAudio();

    const picked = Number(levelSelect?.value || "1") || 1;
    currentLevelIndex = Math.min(Math.max(picked - 1, 0), LEVELS.length - 1);
    localStorage.setItem(LS_LEVEL, String(currentLevelIndex + 1));

    startScreen?.classList.add("hidden");
    gameScreen?.classList.remove("hidden");
    winScreen?.classList.add("hidden");

    startGame(LEVELS[currentLevelIndex]);
  });

  playAgainBtn?.addEventListener("click", () => {
    winScreen?.classList.add("hidden");
    startGame(LEVELS[currentLevelIndex]);
  });

  nextLevelBtn?.addEventListener("click", () => {
    winScreen?.classList.add("hidden");
    currentLevelIndex = Math.min(currentLevelIndex + 1, LEVELS.length - 1);
    localStorage.setItem(LS_LEVEL, String(currentLevelIndex + 1));
    if (levelSelect) levelSelect.value = String(currentLevelIndex + 1);
    startGame(LEVELS[currentLevelIndex]);
  });

  muteBtn?.addEventListener("click", toggleMute);
  muteBtnStart?.addEventListener("click", toggleMute);
}

// -------- Game start / deck creation --------
function startGame(level) {
  matches = 0;
  tries = 0;
  flipped = [];
  updateUI();

  if (board) {
    board.style.gridTemplateColumns = `repeat(${level.cols}, var(--cardSize))`;
    board.innerHTML = "";
  }

  const pool = [...characters, ...items]
    .filter(Boolean)
    .map((x) => ({
      id: x.id,
      img: safeAssetPath(x.img || x.src),
      name: x.name || x.id,
    }))
    .filter((x) => x.id !== "raven-dance");

  // Shuffle pool so levels don’t always use the same first items
  pool.sort(() => Math.random() - 0.5);

  const picked = pool.slice(0, level.pairs);
  const cards = [...picked, ...picked].sort(() => Math.random() - 0.5);

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

  const imgEl = card.querySelector("img");
  if (imgEl) attachImgFallback(imgEl, item.name);

  card.addEventListener("click", () => flip(card, item));
  board?.appendChild(card);
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

    if (board && matches * 2 === board.children.length) {
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
function scoreWin(levelPairs, triesCount) {
  const perfect = levelPairs;
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

  let streak = Number(localStorage.getItem(LS_STREAK) || "0");
  if (result === "great" || result === "perfect") streak += 1;
  else streak = 0;
  localStorage.setItem(LS_STREAK, String(streak));

  const canAdvance = currentLevelIndex < LEVELS.length - 1;
  const shouldAdvance = canAdvance && streak >= 2;

  const msgMap = {
    perfect: "Wow! Super matching! ⭐⭐⭐",
    great: "Great job! ⭐⭐",
    ok: "Nice work! ⭐",
    "try-again": "That was a tricky one — you’re learning! 💛",
  };

  if (winMessageEl) winMessageEl.textContent = msgMap[result] || "Nice matching!";
  if (difficultyNoteEl) {
    difficultyNoteEl.textContent = shouldAdvance
      ? "You’re ready for a slightly bigger game next time."
      : "We’ll keep it comfy. You can try again or move on.";
  }

  if (nextLevelBtn) {
    nextLevelBtn.disabled = !canAdvance;
    nextLevelBtn.style.opacity = canAdvance ? "1" : ".5";
  }

  if (shouldAdvance) {
    currentLevelIndex += 1;
    localStorage.setItem(LS_LEVEL, String(currentLevelIndex + 1));
    if (levelSelect) levelSelect.value = String(currentLevelIndex + 1);
    localStorage.setItem(LS_STREAK, "0");
    if (winMessageEl) winMessageEl.textContent = "Next level unlocked! ⭐⭐";
  }

  winScreen?.classList.remove("hidden");
}

// -------- Init (module-safe) --------
function init() {
  populateLevelOptions();
  bindLevelSelect();

  renderMuteButtons();
  bindFlowButtons();
  bindExit();

  updateUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
