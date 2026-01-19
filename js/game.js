
let currentLevel = 4;
let soundEnabled = true;
let matchSound = new Audio("assets/sounds/flip.mp3");

const assets = [
  "bo", "raven", "willow", "salem",
  "cat-bed", "cookie", "feather", "leaf", "mouse", "rock", "security-blanket", "sock"
];

function startGame() {
  const level = parseInt(document.getElementById("levelSelect").value);
  const char = document.getElementById("characterSelect").value;
  currentLevel = level;
  const totalPairs = level / 2;

  let items = shuffle([...assets]).slice(0, totalPairs);
  let cards = shuffle([...items, ...items]);

  const board = document.getElementById("gameBoard");
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(level))}, 1fr)`;

  cards.forEach(item => {
    const tile = document.createElement("div");
    tile.className = "tile";
    const img = document.createElement("img");
    img.src = "assets/backs/raven-seal.png";
    img.dataset.back = "assets/backs/raven-seal.png";
    img.dataset.front = `assets/items/${item}.png`;
    img.dataset.flipped = "false";
    img.onclick = () => flipCard(img);
    tile.appendChild(img);
    board.appendChild(tile);
  });
}

let flipped = [];
function flipCard(img) {
  if (img.dataset.flipped === "true" || flipped.length === 2) return;
  img.src = img.dataset.front;
  img.dataset.flipped = "true";
  flipped.push(img);

  if (soundEnabled) matchSound.play();

  if (flipped.length === 2) {
    const [first, second] = flipped;
    if (first.dataset.front === second.dataset.front) {
      flipped = [];
      if (document.querySelectorAll('img[data-flipped="true"]').length === currentLevel) {
        document.getElementById("overlayWin").classList.remove("hidden");
      }
    } else {
      setTimeout(() => {
        first.src = first.dataset.back;
        second.src = second.dataset.back;
        first.dataset.flipped = "false";
        second.dataset.flipped = "false";
        flipped = [];
      }, 800);
    }
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function goHome() {
  location.reload();
}
function resetGame() {
  startGame();
}
function toggleSound() {
  soundEnabled = !soundEnabled;
}
function toggleVibrate() {
  if ("vibrate" in navigator) navigator.vibrate(200);
}
