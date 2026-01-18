const board = document.getElementById("game-board");
const winMessage = document.getElementById("win-message");

let cards = [];
let flippedCards = [];
let matchedCount = 0;
let totalPairs = 0;

function startGame() {
  const level = parseInt(document.getElementById("level").value);
  board.innerHTML = "";
  winMessage.classList.add("hidden");
  document.getElementById("start-screen").classList.add("hidden");

  const items = ["🐾", "🍪", "🪶", "🧸"];
  const selectedItems = items.slice(0, level / 2);
  cards = shuffle([...selectedItems, ...selectedItems]);
  totalPairs = selectedItems.length;
  matchedCount = 0;

  board.classList.remove("hidden");
  board.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(level))}, 1fr)`;

  cards.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.index = index;
    card.dataset.symbol = symbol;
    card.addEventListener("click", handleFlip);
    board.appendChild(card);
  });
}

function handleFlip(e) {
  const card = e.currentTarget;
  if (flippedCards.length === 2 || card.classList.contains("flipped")) return;

  card.textContent = card.dataset.symbol;
  card.classList.add("flipped");
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    const [a, b] = flippedCards;
    if (a.dataset.symbol === b.dataset.symbol) {
      flippedCards = [];
      matchedCount++;
      if (matchedCount === totalPairs) {
        winMessage.classList.remove("hidden");
      }
    } else {
      setTimeout(() => {
        a.textContent = "";
        b.textContent = "";
        a.classList.remove("flipped");
        b.classList.remove("flipped");
        flippedCards = [];
      }, 1000);
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