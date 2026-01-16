const board = document.getElementById("game-board");
const levelSelect = document.getElementById("level");
const winMessage = document.getElementById("win-message");

let cards = [];
let firstCard = null;
let lockBoard = false;

function goHome() {
  location.reload();
}

function resetGame() {
  winMessage.classList.add("hidden");
  startGame();
}

function toggleSound() {
  alert("Sound toggled!");
}

function toggleVibration() {
  alert("Vibration toggled!");
}

function startGame() {
  board.innerHTML = "";
  winMessage.classList.add("hidden");
  const level = parseInt(levelSelect.value);
  let symbols = ['🍪', '🪶', '🧸', '🐾', '🎀', '🐭'];
  let selected = symbols.slice(0, level / 2);
  cards = shuffle([...selected, ...selected]);

  board.className = 'game-board';
  if (level === 4) board.classList.add('easy');
  else if (level === 6 || level === 8) board.classList.add('medium');
  else board.classList.add('hard');

  cards.forEach(symbol => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.symbol = symbol;
    card.innerText = '🕯️';
    card.addEventListener('click', () => flipCard(card));
    board.appendChild(card);
  });
}

function flipCard(card) {
  if (lockBoard || card.classList.contains('matched') || card === firstCard) return;

  card.innerText = card.dataset.symbol;
  if (!firstCard) {
    firstCard = card;
  } else {
    if (firstCard.dataset.symbol === card.dataset.symbol) {
      firstCard.classList.add('matched');
      card.classList.add('matched');
      firstCard = null;
      if ([...document.querySelectorAll('.card')].every(c => c.classList.contains('matched'))) {
        winMessage.classList.remove('hidden');
      }
    } else {
      lockBoard = true;
      setTimeout(() => {
        firstCard.innerText = '🕯️';
        card.innerText = '🕯️';
        firstCard = null;
        lockBoard = false;
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

startGame();