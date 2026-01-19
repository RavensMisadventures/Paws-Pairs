let currentLevel = 1;
let soundEnabled = true;
const matchSound = new Audio("assets/sounds/flip.mp3");

const assets = [
  "bo", "raven", "willow", "salem",
  "cat-bed", "cookie", "feather", "leaf",
  "mouse", "rock", "security-blanket", "sock"
];

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function startGame() {
  const level = parseInt(document.getElementById("level").selectedIndex) + 1;
  const totalPairs = level + 1;
  const char = document.getElementById("character").value;
  const board = document.getElementById("board");
  board.innerHTML = "";

  let items = shuffle(assets).slice(0, totalPairs);
  let cards = shuffle([...items, ...items]);

  let columns = Math.ceil(Math.sqrt(cards.length));
  board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  cards.forEach(name => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-back"><img src="assets/backs/raven-seal.png"></div>
        <div class="card-front"><img src="assets/items/${name}.png"></div>
      </div>`;
    board.appendChild(card);
    card.addEventListener("click", () => flipCard(card, name));
  });
}

let flippedCards = [];
function flipCard(card, name) {
  if (flippedCards.length >= 2 || card.classList.contains("flipped")) return;
  card.classList.add("flipped");
  soundEnabled && matchSound.play();
  flippedCards.push({ card, name });
  if (flippedCards.length === 2) {
    const [a, b] = flippedCards;
    if (a.name === b.name) {
      flippedCards = [];
      if (document.querySelectorAll(".card:not(.flipped)").length === 0) {
        document.getElementById("winDance").style.display = "block";
      }
    } else {
      setTimeout(() => {
        a.card.classList.remove("flipped");
        b.card.classList.remove("flipped");
        flippedCards = [];
      }, 1000);
    }
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
}
