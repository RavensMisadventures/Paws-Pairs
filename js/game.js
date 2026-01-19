
const ITEM_POOL = [
  { id: "cat-bed", src: "assets/items/cat-bed.png" },
  { id: "cookie", src: "assets/items/cookie.png" },
  { id: "feather", src: "assets/items/feather.png" },
  { id: "leaf", src: "assets/items/leaf.png" },
  { id: "mouse", src: "assets/items/mouse.png" },
  { id: "rock", src: "assets/items/rock.png" },
  { id: "blanket", src: "assets/items/security-blanket.png" },
  { id: "sock", src: "assets/items/sock.png" }
];

const CHARACTER_POOL = [
  { id: "raven", src: "assets/characters/raven.png" },
  { id: "willow", src: "assets/characters/willow.png" },
  { id: "salem", src: "assets/characters/salem.png" },
  { id: "bo", src: "assets/characters/bo.png" }
];

const LEVELS = {
  1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7
};

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const grid = document.getElementById("cardGrid");
const playAgainBtn = document.getElementById("playAgainBtn");

document.querySelectorAll(".level-btn").forEach(btn => {
  btn.onclick = () => startLevel(parseInt(btn.dataset.level));
});

playAgainBtn.onclick = () => startScreen.classList.add("active");

function startLevel(level) {
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
  grid.innerHTML = "";

  const pairs = LEVELS[level];
  const pool = level <= 2
    ? [...ITEM_POOL]
    : [...ITEM_POOL, ...CHARACTER_POOL];

  shuffle(pool);
  const chosen = pool.slice(0, pairs);

  const deck = [];
  chosen.forEach(c => {
    deck.push(c, c);
  });

  shuffle(deck);

  deck.forEach(card => {
    const el = document.createElement("div");
    el.className = "card";
    const img = document.createElement("img");
    img.src = card.src;
    el.appendChild(img);
    grid.appendChild(el);
  });
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}
