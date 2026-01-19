// game.js

// ---------- Game configuration ----------

// Cozy items for Levels 1–3
const ITEM_POOL = [
  { id: "cat-bed", label: "Cat Bed", src: "assets/items/cat-bed.png" },
  { id: "cookie", label: "Cookie", src: "assets/items/cookie.png" },
  { id: "feather", label: "Feather", src: "assets/items/feather.png" },
  { id: "leaf", label: "Leaf", src: "assets/items/leaf.png" },
  { id: "mouse", label: "Mouse", src: "assets/items/mouse.png" },
  { id: "rock", label: "Rock", src: "assets/items/rock.png" },
  { id: "blanket", label: "Security Blanket", src: "assets/items/security-blanket.png" },
  { id: "sock", label: "Sock", src: "assets/items/sock.png" }
];

// Characters included in Levels 4–6
const CHARACTER_POOL = [
  { id: "raven", label: "Raven", src: "assets/characters/raven.png" },
  { id: "willow", label: "Willow", src: "assets/characters/willow.png" },
  { id: "salem", label: "Salem", src: "assets/characters/salem.png" },
  { id: "bo", label: "Bo", src: "assets/characters/bo.png" }
];

// Levels defined by PAIRS; cards = pairs * 2
const LEVELS = {
  1: { id: 1, label: "Level 1 — Gentle Start", pairs: 2 },   // 4 cards
  2: { id: 2, label: "Level 2 — Cozy Match", pairs: 4 },      // 8 cards
  3: { id: 3, label: "Level 3 — Extra Snuggly", pairs: 6 },   // 12 cards
  4: { id: 4, label: "Level 4 — Big Stretch", pairs: 8 },     // 16 cards
  5: { id: 5, label: "Level 5 — Brave Tail", pairs: 10 },     // 20 cards
  6: { id: 6, label: "Level 6 — Super Cozy", pairs: 12 }      // 24 cards
};

// ---------- DOM elements ----------
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const levelButtons = document.querySelectorAll(".level-button");
const cardGrid = document.getElementById("cardGrid");
const backToMenuBtn = document.getElementById("backToMenu");

const levelLabel = document.getElementById("levelLabel");
const movesLabel = document.getElementById("movesLabel");
const matchesLabel = document.getElementById("matchesLabel");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const playAgainButton = document.getElementById("playAgainButton");
const backHomeButton = document.getElementById("backHomeButton");

const soundToggle = document.getElementById("soundToggle");
const flipSound = document.getElementById("flipSound");
const matchSound = document.getElementById("matchSound");
const winSound = document.getElementById("winSound");

// ---------- Game state ----------
let currentLevelId = 1;
let deck = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchesFound = 0;
let totalPairs = 0;
let soundEnabled = true;

// ---------- Utility functions ----------
function shuffleArray(array) {
  // Fisher-Yates
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function playSound(audioEl) {
  if (!soundEnabled || !audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) {
    // ignore autoplay errors
  }
}

// Create a deck for a given level + pair count
function createDeck(levelId, pairs) {
  const isItemOnly = levelId <= 3;

  // Level 1–3: items only
  // Level 4–6: characters + items
  let basePool = [];

  if (isItemOnly) {
    basePool = [...ITEM_POOL];
  } else {
    basePool = [...CHARACTER_POOL, ...ITEM_POOL];
  }

  if (pairs > basePool.length) {
    console.warn("Not enough unique images for requested pairs. Truncating.");
    pairs = basePool.length;
  }

  // For 4–6, this ensures Raven/Willow/Salem/Bo appear first
  const chosen = basePool.slice(0, pairs);

  const newDeck = [];
  chosen.forEach((item) => {
    newDeck.push({ ...item, instance: 1 });
    newDeck.push({ ...item, instance: 2 });
  });

  shuffleArray(newDeck);
  return newDeck;
}

// Render cards into the grid
function renderDeck(deck) {
  cardGrid.innerHTML = "";

  deck.forEach((cardData, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.cardId = cardData.id;
    card.dataset.index = index;

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const backFace = document.createElement("div");
    backFace.className = "card-face card-back";
    backFace.setAttribute("aria-hidden", "true");

    const frontFace = document.createElement("div");
    frontFace.className = "card-face card-front";

    const img = document.createElement("img");
    img.src = cardData.src;
    img.alt = cardData.label;
    img.loading = "lazy";

    const label = document.createElement("div");
    label.className = "card-label";
    label.textContent = cardData.label;

    frontFace.appendChild(img);
    frontFace.appendChild(label);

    inner.appendChild(backFace);
    inner.appendChild(frontFace);
    card.appendChild(inner);

    card.addEventListener("click", () => handleCardClick(card));
    cardGrid.appendChild(card);
  });
}

// Reset and start a level
function startLevel(levelId) {
  const level = LEVELS[levelId] || LEVELS[1];
  currentLevelId = level.id;

  moves = 0;
  matchesFound = 0;
  totalPairs = level.pairs;
  firstCard = null;
  secondCard = null;
  lockBoard = false;

  movesLabel.textContent = `Moves: ${moves}`;
  matchesLabel.textContent = `Matches: ${matchesFound}/${totalPairs}`;
  levelLabel.textContent = `Level ${level.id}`;

  deck = createDeck(level.id, level.pairs);
  renderDeck(deck);

  // Switch screens
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}

// ---------- Card interaction ----------
function handleCardClick(cardEl) {
  if (lockBoard) return;
  if (cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) return;

  cardEl.classList.add("flipped");
  playSound(flipSound);

  if (!firstCard) {
    firstCard = cardEl;
    return;
  }

  if (cardEl === firstCard) {
    return; // clicked same card again
  }

  secondCard = cardEl;
  lockBoard = true;
  moves++;
  movesLabel.textContent = `Moves: ${moves}`;

  const id1 = firstCard.dataset.cardId;
  const id2 = secondCard.dataset.cardId;

  if (id1 === id2) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch() {
  playSound(matchSound);

  setTimeout(() => {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    matchesFound++;
    matchesLabel.textContent = `Matches: ${matchesFound}/${totalPairs}`;

    resetTurn();

    if (matchesFound === totalPairs) {
      handleWin();
    }
  }, 300);
}

function handleMismatch() {
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetTurn();
  }, 550);
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

// ---------- Win handling ----------
function handleWin() {
  playSound(winSound);

  overlayTitle.textContent = "Great job!";
  overlayMessage.textContent =
    "You found all the cozy pairs. Raven is doing a happy dance just for you. 🐾";
  overlay.classList.remove("hidden");
}

// ---------- Navigation ----------
function showStartScreen() {
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

// ---------- Sound toggle ----------
function updateSoundToggleButton() {
  soundToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
}

// ---------- Event listeners ----------
document.addEventListener("DOMContentLoaded", () => {
  // Level buttons
  levelButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const levelId = parseInt(btn.dataset.level, 10);
      hideOverlay();
      startLevel(levelId);
    });
  });

  // Back to menu from game
  backToMenuBtn.addEventListener("click", () => {
    showStartScreen();
  });

  // Overlay buttons
  playAgainButton.addEventListener("click", () => {
    hideOverlay();
    startLevel(currentLevelId);
  });

  backHomeButton.addEventListener("click", () => {
    hideOverlay();
    showStartScreen();
  });

  // Sound toggle
  soundEnabled = true;
  updateSoundToggleButton();

  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    updateSoundToggleButton();
  });
});
