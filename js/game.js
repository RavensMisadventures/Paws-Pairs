
const gameBoard = document.getElementById('gameBoard');
const gameMessage = document.getElementById('gameMessage');

const allImages = [
  'assets/items/cookie.png',
  'assets/items/feather.png',
  'assets/items/leaf.png',
  'assets/items/mouse.png',
  'assets/items/rock.png',
  'assets/items/security-blanket.png',
  'assets/items/sock.png',
  'assets/items/cat-bed.png',
  'assets/characters/raven.png',
  'assets/characters/salem.png',
  'assets/characters/willow.png',
  'assets/characters/bo.png'
];

let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 0;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function startGame() {
  gameBoard.innerHTML = '';
  gameMessage.textContent = '';
  flippedCards = [];
  matchedPairs = 0;

  let level = parseInt(document.getElementById('levelSelect').value);
  let selected = allImages.slice(0, level / 2);
  let cards = [...selected, ...selected];
  shuffleArray(cards);
  totalPairs = cards.length / 2;

  gameBoard.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(cards.length))}, 1fr)`;

  cards.forEach(src => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.image = src;
    card.innerHTML = `<img src="${src}" style="display: none;">`;
    card.addEventListener('click', () => flipCard(card));
    gameBoard.appendChild(card);
  });
}

function flipCard(card) {
  if (card.classList.contains('flipped') || flippedCards.length === 2) return;

  card.classList.add('flipped');
  card.querySelector('img').style.display = 'block';
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    setTimeout(() => {
      const [card1, card2] = flippedCards;
      if (card1.dataset.image === card2.dataset.image) {
        matchedPairs++;
        if (matchedPairs === totalPairs) {
          gameMessage.textContent = '🎉 Great job, you matched them all!';
        }
      } else {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.querySelector('img').style.display = 'none';
        card2.querySelector('img').style.display = 'none';
      }
      flippedCards = [];
    }, 800);
  }
}

function resetGame() {
  startGame();
}

function goHome() {
  window.location.href = "https://ravensmisadventures.github.io/";
}

function toggleSound() {
  alert("🔈 Sound toggle not implemented yet.");
}

function toggleVibration() {
  alert("📳 Vibration toggle not implemented yet.");
}
