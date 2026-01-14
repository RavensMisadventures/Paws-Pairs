// js/game.js
import { characters, items } from "./data.js";

/**
 * Paws & Pairs
 * Fixes included in this version:
 *  ✅ Dropdown + Start wiring made robust (change listener + safe reads)
 *  ✅ Module-safe init (waits for DOM ready even if script moves)
 *  ✅ Prevents duplicate option population if hot-reloaded
 *  ✅ Keeps your existing grid sizing + safeAssetPath + difficulty logic
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
const sNope  = () => { tone(220, 0.07, "sine", 0.035); setTimeo
