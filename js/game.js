
const characters = [
  "raven", "willow", "salem", "bo",
  "cookie", "feather", "rock", "sock",
  "cat-bed", "mouse", "security-blanket", "leaf"
];

let selectedLevel, board, flippedCards, matchedPairs, totalPairs;

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);
document.getElementById('exit-btn').addEventListener('click', showStart);
document.getElementById('home-btn').addEventListener('click', showStart);
document.getElementById('reset-btn').addEventListener('click', startGame);

function showStart() {
  document.getElementById('start-screen').classList.remove('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('win-message').classList.add('hidden');
}

function startGame() {
  const levelValue = parseInt(document.getElementById('level').value);
  const gameBoard = document.getElementById('game-board');
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('win-message').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  const selected = characters.slice(0, levelValue);
  const items = [...selected, ...selected].sort(() => 0.5 - Math.random());

  gameBoard.innerHTML = '';
  gameBoard.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(items.length))}, 1fr)`;

  flippedCards = [];
  matchedPairs = 0;
  totalPairs = selected.length;

  items.forEach(name => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.name = name;

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="assets/backs/raven-seal.png" alt="Back">
        </div>
        <div class="card-back">
          <img src="assets/characters/${name}.png" onerror="this.onerror=null; this.src='assets/items/${name}.png';" alt="${name}">
        </div>
      </div>
    `;

    card.addEventListener('click', () => flipCard(card));
    gameBoard.appendChild(card);
  });
}

function flipCard(card) {
  if (card.classList.contains('flipped') || flippedCards.length >= 2) return;

  card.classList.add('flipped');
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    const [c1, c2] = flippedCards;
    const match = c1.dataset.name === c2.dataset.name;

    setTimeout(() => {
      if (!match) {
        c1.classList.remove('flipped');
        c2.classList.remove('flipped');
      } else {
        matchedPairs++;
        if (matchedPairs === totalPairs) {
          document.getElementById('win-message').classList.remove('hidden');
        }
      }
      flippedCards = [];
    }, 800);
  }
}
