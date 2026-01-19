// Raven’s Paws Pairs — grid-based LEVELS config

const CARD_DEFS = {
  raven:   { id: "raven",   label: "Raven",   src: "assets/characters/raven.png" },
  willow:  { id: "willow",  label: "Willow",  src: "assets/characters/willow.png" },
  salem:   { id: "salem",   label: "Salem",   src: "assets/characters/salem.png" },
  bo:      { id: "bo",      label: "Bo",      src: "assets/characters/bo.png" },
  cookie:  { id: "cookie",  label: "Cookie",  src: "assets/items/cookie.png" },
  mouse:   { id: "mouse",   label: "Mouse",   src: "assets/items/mouse.png" },
  sock:    { id: "sock",    label: "Sock",    src: "assets/items/sock.png" },
  feather: { id: "feather", label: "Feather", src: "assets/items/feather.png" },
  leaf:    { id: "leaf",    label: "Leaf",    src: "assets/items/leaf.png" },
  rock:    { id: "rock",    label: "Rock",    src: "assets/items/rock.png" }
};

/* ----- Levels (pairs only) ----- */
const LEVELS = [
  { id: 1, name: "Level 1 • 4 Cards (2×2)",  cols: 2, rows: 2, pool: ["raven","willow"] },
  { id: 2, name: "Level 2 • 6 Cards (3×2)",  cols: 3, rows: 2, pool: ["raven","willow","cookie"] },
  { id: 3, name: "Level 3 • 8 Cards (4×2)",  cols: 4, rows: 2, pool: ["raven","willow","cookie","leaf"] },
  { id: 4, name: "Level 4 • 12 Cards (4×3)", cols: 4, rows: 3, pool: ["raven","willow","salem","bo","cookie","mouse"] },
  { id: 5, name: "Level 5 • 16 Cards (4×4)", cols: 4, rows: 4, pool: ["raven","willow","salem","bo","cookie","mouse","sock","feather"] },
  { id: 6, name: "Level 6 • 20 Cards (5×4)", cols: 5, rows: 4, pool: ["raven","willow","salem","bo","cookie","mouse","sock","feather","leaf","rock"] },
];

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

let currentLevelIndex = 0;
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

function updateHud(level){
  levelLabel.textContent = level.name;
  movesLabel.textContent = `Moves: ${moves}`;
  matchesLabel.textContent = `Matches: ${matches}/${totalPairs}`;
}

function vibrate(pattern){
  if (!vibeOn) return;
  if (navigator && typeof navigator.vibrate === "function"){
    try { navigator.vibrate(pattern); } catch {}
  }
}

// WebAudio tones
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

// build deck for a level
function buildDeck(level){
  const totalCards = level.cols * level.rows;
  const pairs = totalCards / 2;
  const ids = level.pool.slice(0, pairs); // one pair per id

  const cards = [];
  ids.forEach((key) => {
    const def = CARD_DEFS[key];
    if (!def){
      console.warn("CARD DEF MISSING FOR", key);
      return;
    }
    cards.push({ ...def, key: key + "-a" });
    cards.push({ ...def, key: key + "-b" });
  });

  shuffle(cards);
  return { cards, pairs };
}

function render(level){
  // set CSS grid columns based on level
  grid.style.setProperty("--grid-cols", level.cols);

  grid.innerHTML = "";

  deck.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.id = c.id;

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "face back";

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
}

function startLevelById(levelId){
  const index = LEVELS.findIndex(l => l.id === levelId);
  if (index === -1) return;
  currentLevelIndex = index;
  const level = LEVELS[currentLevelIndex];

  const { cards, pairs } = buildDeck(level);
  deck = cards;
  totalPairs = pairs;
  moves = 0;
  matches = 0;
  first = null;
  second = null;
  locked = false;

  hideOverlay();
  updateHud(level);
  render(level);
  showGame();
}

function resetLevel(){
  const level = LEVELS[currentLevelIndex];
  startLevelById(level.id);
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
  updateHud(LEVELS[currentLevelIndex]);

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
  updateHud(LEVELS[currentLevelIndex]);

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
  btn.addEventListener("click", () => {
    const id = parseInt(btn.dataset.level, 10);
    startLevelById(id);
  });
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
