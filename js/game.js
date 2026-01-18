
const board = document.getElementById("game-board");
const levelSelect = document.getElementById("level-select");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const homeBtn = document.getElementById("homeBtn");
const winMessage = document.getElementById("win-message");
const playAgainBtn = document.getElementById("playAgainBtn");
const exitBtn = document.getElementById("exitBtn");
const flipSound = document.getElementById("flipSound");

let cards = [];
let flipped = [];
let matched = [];

const items = [
  "bo", "raven", "salem", "willow", "cat-bed", "cookie", "feather", "leaf", "mouse", "rock", "security-blanket", "sock"
];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)];
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateCards(count) {
  const selected = shuffle([...items]).slice(0, count / 2);
  const pairItems = shuffle([...selected, ...selected]);

  board.innerHTML = "";
  board.classList.remove("hidden");
  board.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(count))}, 1fr)`;

  cards = [];
  flipped = [];
  matched = [];

  pairItems.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("card");

    const front = document.createElement("img");
    front.src = `assets/items/${item}.png`;
    front.classList.add("front");

    const back = document.createElement("div");
    back.classList.add("back");

    card.appendChild(front);
    card.appendChild(back);

    card.dataset.item = item;
    card.addEventListener("click", () => flipCard(card));

    board.appendChild(card);
    cards.push(card);
  });
}

function flipCard(card) {
  if (flipped.includes(card) || matched.includes(card)) return;

  card.querySelector(".front").style.zIndex = "2";
  card.querySelector(".back").style.zIndex = "1";
  flipped.push(card);
  flipSound.play();

  if (flipped.length === 2) {
    setTimeout(() => {
      const [first, second] = flipped;
      if (first.dataset.item === second.dataset.item) {
        matched.push(first, second);
        if (matched.length === cards.length) {
          winMessage.classList.remove("hidden");
        }
      } else {
        first.querySelector(".front").style.zIndex = "0";
        second.querySelector(".front").style.zIndex = "0";
      }
      flipped = [];
    }, 800);
  }
}

startBtn.addEventListener("click", () => {
  const count = parseInt(levelSelect.value);
  winMessage.classList.add("hidden");
  generateCards(count);
});

resetBtn.addEventListener("click", () => {
  board.innerHTML = "";
  winMessage.classList.add("hidden");
});

homeBtn.addEventListener("click", () => {
  location.reload();
});

playAgainBtn.addEventListener("click", () => {
  const count = parseInt(levelSelect.value);
  winMessage.classList.add("hidden");
  generateCards(count);
});

exitBtn.addEventListener("click", () => {
  location.reload();
});
