// js/game.js

// ---------- Pools (use YOUR exact repo folders) ----------
const ITEM_POOL = [
  { id: "cat-bed", label: "Cat Bed", src: "assets/items/cat-bed.png" },
  { id: "cookie", label: "Cookie", src: "assets/items/cookie.png" },
  { id: "feather", label: "Feather", src: "assets/items/feather.png" },
  { id: "leaf", label: "Leaf", src: "assets/items/leaf.png" },
  { id: "mouse", label: "Mouse", src: "assets/items/mouse.png" },
  { id: "rock", label: "Rock", src: "assets/items/rock.png" },
  { id: "blanket", label: "Blanket", src: "assets/items/security-blanket.png" },
  { id: "sock", label: "Sock", src: "assets/items/sock.png" }
];

const CHARACTER_POOL = [
  { id: "raven", label: "Raven", src: "assets/characters/raven.png" },
  { id: "willow", label: "Willow", src: "assets/characters/willow.png" },
  { id: "salem", label: "Salem", src: "assets/characters/salem.png" },
  { id: "bo", label: "Bo", src: "assets/characters/bo.png" }
];

// Levels: PAIRS (cards = pairs * 2)
const LEVELS = {
  1: { id: 1, pairs: 2 },   // 4 cards
  2: { id: 2, pairs: 4 },   // 8 cards
  3: { id: 3, pairs: 6 },   // 12 cards
  4: { id: 4, pairs: 8 },   // 16 cards
  5: { id: 5, pairs: 10 },  // 20 cards
  6: { id: 6, pairs: 12 }   // 24 cards
};

// ---------- DOM ----------
const startScreen = document.getElementById("startScreen");
const gameScreen  = document.getElementById("gameScreen");
const grid        = document.getElementById("cardGrid");

const levelLabel   = document.getElementById("levelLabel");
const movesLabel   = document.getElementById("movesLabel");
const matchesLabel = document.getElementById("matchesLabel");

const overlay        = document.getElementById("overlay");
const overlayTitle   = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const playAgainBtn   = document.getElementById("playAgainBtn");
const backHomeBtn    = document.getElementById("backHomeBtn");

const backBtn   = document.getElementById("backBtn");
const homeBtn   = document.getElementById("homeBtn");
const resetBtn  = document.getElementById("resetBtn");

const soundToggle   = document.getElementById("soundToggle");
const vibrateToggle = document.getElementById("vibrateToggle");

const flipSound  = document.getElementById("flipSound");
const matchSound = document.getElementById("matchSound");
const winSound   = document.getElementById("winSound");

// ---------- State ----------
let currentLevel = 1;
let deck = [];
let first = null;
let second = null;
let locked = false;

let moves = 0;
let matches = 0;
let totalPairs = 0;

let soundOn = true;
let vibrateOn = false;

// ---------- Helpers ----------
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function play(audio){
  if (!soundOn || !audio) return;
  try { audio.currentTime = 0; audio.play(); } catch {}
}

function vibe(pattern){
  if (!vibrateOn) return;
  if (navigator && typeof navigator.vibrate === "function"){
    try { navigator.vibrate(pattern); } catch {}
  }
}

function showStart(){
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
}

function showGame(){
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}

function showOverlay(title, msg){
  overlayTitle.textContent = title;
  overlayMessage.textContent = msg;
  overlay.classList.remove("hidden");
}

function hideOverlay(){
  overlay.classList.add("hidden");
}

// Level rule: 1–3 items only, 4–6 include characters
function buildDeck(levelId, pairs){
  const pool = (levelId <= 3)
    ? [...ITEM_POOL]
    : [...CHARACTER_POOL, ...ITEM_POOL];

  // Ensure we have enough unique images
  const maxPairs = Math.min(pairs, pool.length);
  const chosen = pool.slice(0, maxPairs);

  const d = [];
  chosen.forEach(item => {
    d.push({ ...item, k: item.id + "-a" });
    d.push({ ...item, k: item.id + "-b" });
  });

  shuffle(d);
  return d;
}

function setHud(){
  levelLabel.textContent = `Level ${currentLevel}`;
  movesLabel.textContent = `Moves: ${moves}`;
  matchesLabel.textContent = `Matches: ${matches}/${totalPairs}`;
}

// ---------- Render ----------
function render(){
  grid.innerHTML = "";

  deck.forEach((cardData, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.id = cardData.id;
    btn.dataset.idx = String(idx);

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "face back";

    const front = document.createElement("div");
    front.className = "face front";

    const img = document.createElement("img");
    img.alt = cardData.label;
    img.src = cardData.src;

    // If image fails, log the exact missing path
    img.addEventListener("error", () => {
      console.error("IMAGE NOT FOUND:", cardData.src);
    });

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = cardData.label;

    front.appendChild(img);
    front.appendChild(label);

    inner.appendChild(back);
    inner.appendChild(front);
    btn.appendChild(inner);

    btn.addEventListener("click", () => onCardClick(btn));

    grid.appendChild(btn);
  });
}

// ---------- Gameplay ----------
function startLevel(levelId){
  const level = LEVELS[levelId] || LEVELS[1];
  currentLevel = level.id;

  moves = 0;
  matches = 0;
  totalPairs = level.pairs;

  first = null;
  second = null;
  locked = false;

  hideOverlay();

  deck = buildDeck(level.id, level.pairs);
  setHud();
  render();
  showGame();
}

function resetLevel(){
  startLevel(currentLevel);
}

function onCardClick(cardEl){
  if (locked) return;
  if (cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) return;

  cardEl.classList.add("flipped");
  play(flipSound);

  if (!first){
    first = cardEl;
    return;
  }

  if (cardEl === first) return;

  second = cardEl;
  locked = true;

  moves++;
  setHud();

  const a = first.dataset.id;
  const b = second.dataset.id;

  if (a === b){
    // match
    play(matchSound);
    vibe([20, 40, 20]);

    setTimeout(() => {
      first.classList.add("matched");
      second.classList.add("matched");

      matches++;
      setHud();

      first = null;
      second = null;
      locked = false;

      if (matches === totalPairs){
        play(winSound);
        vibe([30, 60, 30, 60, 30]);
        showOverlay("Great job!", "You found all the cozy pairs. 🐾");
      }
    }, 260);
  } else {
    // mismatch
    setTimeout(() => {
      first.classList.remove("flipped");
      second.classList.remove("flipped");
      first = null;
      second = null;
      locked = false;
    }, 520);
  }
}

// ---------- Controls ----------
function setSoundUI(){
  soundToggle.setAttribute("aria-pressed", soundOn ? "true" : "false");
  soundToggle.innerHTML = soundOn ? "🔊 <span>Sound</span>" : "🔇 <span>Sound</span>";
}

function setVibeUI(){
  vibrateToggle.setAttribute("aria-pressed", vibrateOn ? "true" : "false");
  vibrateToggle.innerHTML = vibrateOn ? "📳 <span>Vibrate</span>" : "📴 <span>Vibrate</span>";
}

// ---------- Init ----------
document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const lv = parseInt(btn.dataset.level, 10);
    startLevel(lv);
  });
});

backBtn.addEventListener("click", () => showStart());
homeBtn.addEventListener("click", () => showStart());
resetBtn.addEventListener("click", () => resetLevel());

playAgainBtn.addEventListener("click", () => resetLevel());
backHomeBtn.addEventListener("click", () => { hideOverlay(); showStart(); });

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  setSoundUI();
});

vibrateToggle.addEventListener("click", () => {
  vibrateOn = !vibrateOn;
  setVibeUI();
  if (vibrateOn) vibe(20);
});

// default UI
setSoundUI();
setVibeUI();
