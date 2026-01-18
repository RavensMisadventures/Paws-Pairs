
let board = document.querySelector('.board');
let soundEnabled = true;
const flipSound = new Audio('assets/sounds/flip.mp3');
const winSound = new Audio('assets/sounds/win.mp3');

const items = ['sock', 'cookie', 'feather', 'mouse', 'leaf', 'rock'];
let currentLevel = 4;

function shuffle(array) {
  return array.sort(() => 0.5 - Math.random());
}

function createBoard(level) {
  board.innerHTML = '';
  let totalTiles = level * 2;
  let selected = shuffle(items).slice(0, level);
  let gameItems = shuffle([...selected, ...selected]);
  board.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(totalTiles))}, 1fr)`;

  gameItems.forEach(item => {
    let tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.item = item;
    tile.innerHTML = '<img src="assets/backs/raven-seal.png" alt="back">';
    tile.addEventListener('click', () => flipTile(tile));
    board.appendChild(tile);
  });
}

let flipped = [];

function flipTile(tile) {
  if (flipped.length >= 2 || tile.classList.contains('matched')) return;

  const img = document.createElement('img');
  img.src = `assets/items/${tile.dataset.item}.png`;
  tile.innerHTML = '';
  tile.appendChild(img);

  if (soundEnabled) flipSound.play();

  flipped.push(tile);

  if (flipped.length === 2) {
    const [a, b] = flipped;
    if (a.dataset.item === b.dataset.item) {
      a.classList.add('matched');
      b.classList.add('matched');
      flipped = [];
      checkWin();
    } else {
      setTimeout(() => {
        a.innerHTML = '<img src="assets/backs/raven-seal.png" alt="back">';
        b.innerHTML = '<img src="assets/backs/raven-seal.png" alt="back">';
        flipped = [];
      }, 1000);
    }
  }
}

function checkWin() {
  if (document.querySelectorAll('.tile:not(.matched)').length === 0) {
    if (soundEnabled) winSound.play();
    const dance = document.createElement('img');
    dance.src = 'assets/characters/raven-dance.gif';
    dance.style.marginTop = '2rem';
    document.body.appendChild(dance);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
}

document.getElementById('soundToggle').addEventListener('click', toggleSound);
document.getElementById('levelSelect').addEventListener('change', (e) => {
  currentLevel = parseInt(e.target.value);
  createBoard(currentLevel);
});

createBoard(currentLevel);
