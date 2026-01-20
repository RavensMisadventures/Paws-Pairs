/* ============================================================
   CARD DEFINITIONS
   ============================================================ */
const CARD_DEFS = {
  raven:   { id: "raven", label: "Raven", src: "assets/characters/raven.png" },
  willow:  { id: "willow", label: "Willow", src: "assets/characters/willow.png" },
  salem:   { id: "salem", label: "Salem", src: "assets/characters/salem.png" },
  bo:      { id: "bo", label: "Bo", src: "assets/characters/bo.png" },

  cookie:  { id: "cookie", label: "Cookie", src: "assets/items/cookie.png" },
  mouse:   { id: "mouse", label: "Mouse", src: "assets/items/mouse.png" },
  sock:    { id: "sock", label: "Sock", src: "assets/items/sock.png" },
  feather: { id: "feather", label: "Feather", src: "assets/items/feather.png" },
  leaf:    { id: "leaf", label: "Leaf", src: "assets/items/leaf.png" },
  rock:    { id: "rock", label: "Rock", src: "assets/items/rock.png" },

  securityBlanket: {
    id: "securityBlanket",
    label: "Security Blanket",
    src: "assets/items/security-blanket.png"
  }
};


/* ============================================================
   LEVELS
   ============================================================ */
const LEVELS = [
  { id: 1, cols: 2, rows: 2, pool: ["raven", "willow"] },

  { id: 2, cols: 3, rows: 2, pool: ["raven", "willow", "cookie"] },

  { id: 3, cols: 4, rows: 2, pool: 
    ["raven", "willow", "cookie", "leaf", "securityBlanket"] 
  },

  { id: 4, cols: 4, rows: 3, pool: 
    ["raven", "willow", "salem", "bo", "cookie", "mouse", "securityBlanket"] 
  },

  { id: 5, cols: 4, rows: 4, pool: 
    ["raven", "willow", "salem", "bo", "cookie", "mouse", "sock", "feather", "securityBlanket"] 
  },

  { id: 6, cols: 5, rows: 4, pool:
    ["raven", "willow", "salem", "bo", "cookie", "mouse", "sock", "feather", "leaf", "rock", "securityBlanket"]
  }
];


function $(id) { return document.getElementById(id); }


/* ============================================================
   GLOBAL GAME STATE
   ============================================================ */
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

const startScreen  = $("startScreen");
const gameScreen   = $("gameScreen");
const cardGrid     = $("cardGrid");
const levelLabel   = $("levelLabel");
const movesLabel   = $("movesLabel");
const matchesLabel = $("matchesLabel");

const overlay      = $("overlay");
const overlayTitle = $("overlayTitle");
const overlayMsg   = $("overlayMsg");

let audioCtx = null;


/* ============================================================
   UTILS
   ============================================================ */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function playTone(freq, ms) {
  if (!soundOn) return;
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = 0.06;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => osc.stop(), ms);
}

function vibrate(ms) {
  if (!vibeOn) return;
  if (navigator.vibrate) navigator.vibrate(ms);
}



/* ============================================================
   BUILD DECK
   ============================================================ */
function buildDeck(level) {
  const totalCards = level.cols * level.rows;
  const pairs = totalCards / 2;

  const pool = level.pool.slice(0, pairs);

  const cards = [];
  pool.forEach(key => {
    const def = CARD_DEFS[key];
    if (!def) return;

    cards.push({ ...def, key: key + "-a" });
    cards.push({ ...def, key: key + "-b" });
  });

  shuffle(cards);
  return { cards, pairs };
}


/* ============================================================
   RENDER CARDS
   ============================================================ */
function render(level) {
  cardGrid.style.gridTemplateColumns = `repeat(${level.cols}, var(--cardSize))`;
  cardGrid.innerHTML = "";

  deck.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "card";
    btn.dataset.id = c.id;

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const back = document.createElement("div");
    back.className = "face back";

    const front = document.createElement("div");
    front.className = "face front";

    const img = document.createElement("img");
    img.src = c.src;
    img.alt = c.label;

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = c.label;

    front.appendChild(img);
    front.appendChild(label);

    inner.appendChild(back);
    inner.appendChild(front);
    btn.appendChild(inner);

    btn.addEventListener("click", () => onCard(btn));

    cardGrid.appendChild(btn);
  });
}


/* ============================================================
   START LEVEL
   ============================================================ */
function startLevelById(id) {
  const index = LEVELS.findIndex(l => l.id === id);
  if (index === -1) return;

  currentLevelIndex = index;
  const level = LEVELS[index];

  const built = buildDeck(level);
  deck = built.cards;
  totalPairs = built.pairs;

  moves = 0;
  matches = 0;
  first = null;
  second = null;
  locked = false;

  updateHUD(level);
  render(level);
  showGame();
}

function updateHUD(level) {
  levelLabel.textContent   = level.name;
  movesLabel.textContent   = `Moves: ${moves}`;
  matchesLabel.textContent = `Matches: ${matches}/${totalPairs}`;
}

function showStart() {
  startScreen.classList.add("active");
  gameScreen.classList.remove("active");
  overlay.classList.add("hidden");
}

function showGame() {
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}



/* ============================================================
   CARD INTERACTION
   ============================================================ */
function onCard(card) {
  if (locked) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  card.classList.add("flipped");
  playTone(520, 60);

  if (!first) {
    first = card;
    return;
  }

  second = card;
  locked = true;
  moves++;
  updateHUD(LEVELS[currentLevelIndex]);

  if (first.dataset.id === second.dataset.id) {
    setTimeout(() => matchPair(first, second), 260);
  } else {
    setTimeout(unflipPair, 520);
  }
}



/* ============================================================
   MATCH LOGIC (now includes blanket sparkle + message)
   ============================================================ */
function matchPair(a, b) {
  const id = a.dataset.id;

  a.classList.add("matched");
  b.classList.add("matched");

  matches++;
  updateHUD(LEVELS[currentLevelIndex]);

  playTone(820, 90);
  vibrate(40);

  /* ✨ Sparkle effect for blanket */
  if (id === "securityBlanket") {
    sparkle(a);
    sparkle(b);
    showBlanketMessage();
  }

  first = null;
  second = null;
  locked = false;

  if (matches === totalPairs) {
    setTimeout(showWin, 350);
  }
}

function unflipPair() {
  first.classList.remove("flipped");
  second.classList.remove("flipped");
  playTone(300, 80);

  first = null;
  second = null;
  locked = false;
}


/* ============================================================
   ✨ Blanket Sparkle Effect
   ============================================================ */
function sparkle(cardBtn) {
  const sparkle = document.createElement("div");
  sparkle.className = "sparkle";

  sparkle.style.position = "absolute";
  sparkle.style.inset = "0";
  sparkle.style.pointerEvents = "none";
  sparkle.style.background = "radial-gradient(circle, rgba(255,255,255,.85), transparent 60%)";
  sparkle.style.borderRadius = "20px";
  sparkle.style.animation = "sparkleFade 1s ease-out forwards";

  cardBtn.appendChild(sparkle);

  setTimeout(() => sparkle.remove(), 1100);
}

/* Sparkle animation injected into DOM */
const style = document.createElement("style");
style.textContent = `
@keyframes sparkleFade {
  0%   { opacity: 0; transform: scale(.6); }
  25%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.4); }
}
`;
document.head.appendChild(style);


/* ============================================================
   Blanket Message
   ============================================================ */
function showBlanketMessage() {
  overlay.classList.remove("hidden");
  overlayTitle.textContent = "A Cozy Moment";
  overlayMsg.textContent   = "Raven feels safe when she finds her blanket.";
}


/* ============================================================
   WIN OVERLAY
   ============================================================ */
function showWin() {
  overlay.classList.remove("hidden");
  overlayTitle.textContent = "Great job!";
  overlayMsg.textContent   = "You found all the cozy pairs! 🐾";
}


/* ============================================================
   UI WIRING
   ============================================================ */
function wireUI() {
  document.querySelector(".level-grid")?.addEventListener("click", e => {
    const btn = e.target.closest(".level-btn");
    if (!btn) return;
    startLevelById(parseInt(btn.dataset.level));
  });

  $("backBtn")?.addEventListener("click", showStart);
  $("homeBtn")?.addEventListener("click", showStart);
  $("playAgainBtn")?.addEventListener("click", () => startLevelById(LEVELS[currentLevelIndex].id));
  $("backHomeBtn")?.addEventListener("click", showStart);

  $("resetBtn")?.addEventListener("click", () =>
    startLevelById(LEVELS[currentLevelIndex].id)
  );

  $("soundBtn")?.addEventListener("click", e => {
    soundOn = !soundOn;
    e.target.innerHTML = soundOn ? "🔊 <span>Sound</span>" : "🔇 <span>Sound</span>";
    e.target.setAttribute("aria-pressed", soundOn);
  });

  $("vibeBtn")?.addEventListener("click", e => {
    vibeOn = !vibeOn;
    e.target.innerHTML = vibeOn ? "📳 <span>Vibrate</span>" : "📴 <span>Vibrate</span>";
    e.target.setAttribute("aria-pressed", vibeOn);
  });

  showStart();
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", wireUI)
  : wireUI();
