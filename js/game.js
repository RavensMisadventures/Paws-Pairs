// js/game.js

// ---------- Card pools ----------
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

// Levels by PAIRS (cards = pairs * 2)
const LEVELS = {
  1: { id: 1, pairs: 2 },   // 4 cards
  2: { id: 2, pairs: 4 },   // 8 cards
  3: { id: 3, pairs: 6 },   // 12 cards
  4: { id: 4, pairs: 8 },   // 16 cards
  5: { id: 5, pairs: 10 },  // 20 cards
  6: { id: 6, pairs: 12 }   // 24 cards
};

// ---------- DOM ----------
const startScreen   = document.getElementById("startScreen");
const gameScreen    = document.getElementById("gameScreen");
const grid          = document.getElementById("cardGrid");
const levelLabel    = document.getElementById("levelLabel");
const movesLabel    = document.getElementById("movesLabel");
const matchesLabel  = document.getElementById("matchesLabel");

const overlay       = document.getElementById("overlay");
const overlayTitle  = document.getElementById("overlayTitle");
const overlayMessage= document.getElementById("overlayMessage");
const playAgainBtn  = document.getElementById("playAgainBtn");
const backHomeBtn   = document.getElementById("backHomeBtn");

const backBtn       = document.getElementById("backBtn");
const homeBtn       = document.getElementById("homeBtn");
const resetBtn      = document.getElementById("resetBtn");

const soundToggle   = document.getElementById("soundToggle");
const vibrateToggle = document.getElementById("vibrateToggle");

const flipSound     = document.getElementById("flipSound");
const matchSound    = document.getElementById("matchSound");
const winSound      = document.getElementById("winSound");

// ---------- State ----------
let currentLevel = 1;
let deck = [];
let firstCard = null;
let secondCard = null;
let boardLocked = false;

let moves = 0;
let matches = 0;
let totalPairs = 0;

let soundOn = true;
let vibrateOn = false;

// ---------- Utility ----------
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function playSound(audio){
  if (!soundOn || !audio) return;
  try { audio.currentTime = 0; audio.play(); } catch {}
}

function vibrate(pattern){
  if (!vibrateOn) return;
  if (navigator && typeof navigator.vibrate === "function"){
    try { navigator.vibrate(pattern); } catch {}
  }
}

function showScreenStart(){
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
}

function showScreenGame(){
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

function updateHud(){
  levelLabel.textContent = `Level ${currentLevel}`;
  movesLabel.textContent = `Moves: ${moves}`;
  matchesLabel.textContent = `Matches: ${matches}/${totalPairs}`;
}

// Level rule: 1–3 items only, 4–6 items + characters
function buildDeck(levelId, pairs){
  const pool = (levelId <= 3)
    ? [...ITEM_POOL]
    : [...CHARACTER_POOL, ...ITEM_POOL];

  const maxPairs = Math.min(pairs, pool.length);
  const chosen = pool.slice(0, maxPairs);

  const cards = [];
  chosen.forEach(item => {
    cards.push({ ...item, key: item.id + "-a" });
    cards.push({ ...item, key: item.id + "-b" });
  });

  shuffle(cards);
  return cards;
}

// ---------- Rendering ----------
function renderDeck(){
  grid.innerHTML = "";

  deck.forEach((cardData, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.id = cardData.id;
    btn.dataset.index = String(index);

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "face back";

    const front = document.createElement("div");
    front.className = "face front";

    const img = document.createElement("img");
    img.alt = cardData.label;
    img.src = cardData.src;

    // Log missing images to console for easy debugging
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

// ---------- Game flow ----------
function startLevel(levelId){
  const level = LEVELS[levelId] || LEVELS[1];
  currentLevel = level.id;

  moves = 0;
  matches = 0;
  totalPairs = level.pairs;

  firstCard = null;
  secondCard = null;
  boardLocked = false;

  hideOverlay();

  deck = buildDeck(level.id, level.pairs);
  updateHud();
  renderDeck();
  showScreenGame();
}

function resetLevel(){
  startLevel(currentLevel);
}

function onCardClick(card){
  if (boardLocked) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  card.classList.add("flipped");
  playSound(flipSound);

  if (!firstCard){
    firstCard = card;
    return;
  }

  if (card === firstCard) return;

  secondCard = card;
  boardLocked = true;

  moves++;
  updateHud();

  const a = firstCard.dataset.id;
  const b = secondCard.dataset.id;

  if (a === b){
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch(){
  playSound(matchSound);
  vibrate([20, 40, 20]);

  setTimeout(() => {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    matches++;
    updateHud();

    firstCard = null;
    secondCard = null;
    boardLocked = false;

    if (matches === totalPairs){
      playSound(winSound);
      vibrate([40, 60, 40, 60, 40]);
      showOverlay("Great job!", "You found all the cozy pairs. 🐾");
    }
  }, 260);
}

function handleMismatch(){
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    firstCard = null;
    secondCard = null;
    boardLocked = false;
  }, 520);
}

// ---------- UI Toggles ----------
function updateSoundUI(){
  soundToggle.setAttribute("aria-pressed", soundOn ? "true" : "false");
  soundToggle.innerHTML = soundOn
    ? "🔊 <span>Sound</span>"
    : "🔇 <span>Sound</span>";
}

function updateVibrateUI(){
  vibrateToggle.setAttribute("aria-pressed", vibrateOn ? "true" : "false");
  vibrateToggle.innerHTML = vibrateOn
    ? "📳 <span>Vibrate</span>"
    : "📴 <span>Vibrate</span>";
}

// ---------- Event wiring ----------
document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const levelId = parseInt(btn.dataset.level, 10);
    startLevel(levelId);
  });
});

backBtn.addEventListener("click", showScreenStart);
homeBtn.addEventListener("click", showScreenStart);
resetBtn.addEventListener("click", resetLevel);

playAgainBtn.addEventListener("click", resetLevel);
backHomeBtn.addEventListener("click", () => {
  hideOverlay();
  showScreenStart();
});

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  updateSoundUI();
});

vibrateToggle.addEventListener("click", () => {
  vibrateOn = !vibrateOn;
  updateVibrateUI();
  if (vibrateOn) vibrate(30);
});

// Initial UI
updateSoundUI();
updateVibrateUI();
