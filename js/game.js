// Raven’s Paws Pairs — Option A styling, Option B size, EVEN grid (4 across, even rows)

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

// Levels (NO Level 6)
const LEVELS = {
  1: { id: 1, pairs: 2 }, // 4 cards
  2: { id: 2, pairs: 3 }, // 6 cards
  3: { id: 3, pairs: 4 }, // 8 cards
  4: { id: 4, pairs: 5 }, // 10 cards
  5: { id: 5, pairs: 6 }  // 12 cards
};

const COLS = 4; // even across
// ensure even rows: 2, 4, 6... rows
function evenRowsForCards(cardCount){
  const rows = Math.ceil(cardCount / COLS);
  return (rows % 2 === 0) ? rows : rows + 1;
}
function slotsForCards(cardCount){
  return evenRowsForCards(cardCount) * COLS;
}

// DOM
const startScreen = document.getElementById("startScreen");
const gameScreen  = document.getElementById("gameScreen");
const grid        = document.getElementById("cardGrid");

const levelLabel  = document.getElementById("levelLabel");
const movesLabel  = document.getElementById("movesLabel");
const matchesLabel= document.getElementById("matchesLabel");

const overlay     = document.getElementById("overlay");
const overlayTitle= document.getElementById("overlayTitle");
const overlayMsg  = document.getElementById("overlayMsg");
const playAgainBtn= document.getElementById("playAgainBtn");
const backHomeBtn = document.getElementById("backHomeBtn");

const backBtn     = document.getElementById("backBtn");
const homeBtn     = document.getElementById("homeBtn");
const resetBtn    = document.getElementById("resetBtn");
const soundBtn    = document.getElementById("soundBtn");
const vibeBtn     = document.getElementById("vibeBtn");

// state
let currentLevel = 1;
let deck = [];
let first = null;
let second = null;
let locked = false;

let moves = 0;
let matches = 0;
let totalPairs = 0;

let soundOn = false;
let vibeOn = false;

// utils
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
function showStart(){
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
  hideOverlay();
}
function showGame(){
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}
function showOverlay(title, msg){
  overlayTitle.textContent = title;
  overlayMsg.textContent = msg;
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
function vibrate(pattern){
  if (!vibeOn) return;
  if (navigator && typeof navigator.vibrate === "function"){
    try { navigator.vibrate(pattern); } catch {}
  }
}

// WebAudio tones (no mp3 files)
let audioCtx = null;
function playTone(freq, ms){
  if (!soundOn) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    setTimeout(() => o.stop(), ms);
  }catch{}
}
function setSoundUI(){
  soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
  soundBtn.innerHTML = soundOn ? "🔊 <span>Sound</span>" : "🔇 <span>Sound</span>";
}
function setVibeUI(){
  vibeBtn.setAttribute("aria-pressed", vibeOn ? "true" : "false");
  vibeBtn.innerHTML = vibeOn ? "📳 <span>Vibrate</span>" : "📴 <span>Vibrate</span>";
}

// deck rules
function buildDeck(levelId, pairs){
  const pool = (levelId <= 2)
    ? [...ITEM_POOL]
    : [...ITEM_POOL, ...CHARACTER_POOL];

  shuffle(pool);
  const chosen = pool.slice(0, Math.min(pairs, pool.length));

  const cards = [];
  for (const c of chosen){
    cards.push({ ...c, key: c.id + "-a" });
    cards.push({ ...c, key: c.id + "-b" });
  }
  shuffle(cards);
  return cards;
}

function render(){
  grid.innerHTML = "";

  // render cards
  deck.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.id = c.id;

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "face back";

    // seal fallback if aged not present
    const testSeal = new Image();
    testSeal.onerror = () => back.classList.add("fallback");
    testSeal.src = "assets/backs/raven-seal-aged.png";

    const front = document.createElement("div");
    front.className = "face front";

    const img = document.createElement("img");
    img.alt = c.label;
    img.src = c.src;
    img.addEventListener("error", () => console.error("IMAGE NOT FOUND:", c.src));

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = c.label;

    front.appendChild(img);
    front.appendChild(label);

    inner.appendChild(back);
    inner.appendChild(front);
    btn.appendChild(inner);

    btn.addEventListener("click", () => onCard(btn));
    grid.appendChild(btn);
  });

  // pad with placeholders so rows are even
  const neededSlots = slotsForCards(deck.length);
  const placeholders = Math.max(0, neededSlots - deck.length);
  for (let i=0; i<placeholders; i++){
    const ph = document.createElement("div");
    ph.className = "placeholder";
    grid.appendChild(ph);
  }
}

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
  updateHud();
  render();
  showGame();
}

function resetLevel(){
  startLevel(currentLevel);
}

function onCard(card){
  if (locked) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  card.classList.add("flipped");
  playTone(520, 70);

  if (!first){
    first = card;
    return;
  }
  if (card === first) return;

  second = card;
  locked = true;

  moves++;
  updateHud();

  if (first.dataset.id === second.dataset.id){
    setTimeout(matchPair, 240);
  } else {
    setTimeout(unflipPair, 520);
  }
}

function matchPair(){
  first.classList.add("matched");
  second.classList.add("matched");

  matches++;
  updateHud();

  playTone(740, 90);
  vibrate([18, 30, 18]);

  first = null;
  second = null;
  locked = false;

  if (matches === totalPairs){
    playTone(660, 120);
    playTone(880, 140);
    vibrate([40, 60, 40, 60, 40]);
    showOverlay("Great job!", "You found all the cozy pairs. 🐾");
  }
}

function unflipPair(){
  first.classList.remove("flipped");
  second.classList.remove("flipped");

  playTone(320, 90);
  vibrate(20);

  first = null;
  second = null;
  locked = false;
}

// events
document.querySelectorAll(".level-btn").forEach(btn => {
  btn.addEventListener("click", () => startLevel(parseInt(btn.dataset.level, 10)));
});

backBtn.addEventListener("click", showStart);
homeBtn.addEventListener("click", showStart);
resetBtn.addEventListener("click", resetLevel);

playAgainBtn.addEventListener("click", resetLevel);
backHomeBtn.addEventListener("click", showStart);

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  setSoundUI();
  if (soundOn) playTone(600, 70);
});

vibeBtn.addEventListener("click", () => {
  vibeOn = !vibeOn;
  setVibeUI();
  if (vibeOn) vibrate(30);
});

// init
setSoundUI();
setVibeUI();
hideOverlay();
