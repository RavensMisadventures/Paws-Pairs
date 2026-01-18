const items = [
  "cookie", "feather", "mouse", "sock", "cat-bed", "leaf", "rock", "security-blanket", "salem", "willow", "bo", "raven"
];
let board = document.getElementById("board");
let message = document.getElementById("message");
let soundOn = true;
let vibrateOn = true;
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function startGame() {
  board.innerHTML = "";
  message.textContent = "";
  const level = parseInt(document.getElementById("level").value);
  let chosen = shuffle(items).slice(0, level / 2);
  let pairSet = shuffle([...chosen, ...chosen]);
  board.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(level))}, 1fr)`;
  pairSet.forEach(name => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.name = name;
    tile.addEventListener("click", () => flipTile(tile));
    board.appendChild(tile);
  });
}
let flipped = [];
let lockBoard = false;
function flipTile(tile) {
  if (lockBoard || tile.classList.contains("revealed")) return;
  const name = tile.dataset.name;
  tile.innerHTML = `<img src="assets/items/${name}.png" alt="${name}" />`;
  tile.classList.add("revealed");
  flipped.push(tile);
  if (flipped.length === 2) {
    lockBoard = true;
    const [a, b] = flipped;
    if (a.dataset.name === b.dataset.name) {
      flipped = [];
      lockBoard = false;
      checkWin();
    } else {
      setTimeout(() => {
        a.classList.remove("revealed");
        b.classList.remove("revealed");
        a.innerHTML = "";
        b.innerHTML = "";
        flipped = [];
        lockBoard = false;
      }, 1000);
    }
  }
}
function checkWin() {
  const revealed = document.querySelectorAll(".tile.revealed").length;
  const total = document.querySelectorAll(".tile").length;
  if (revealed === total) {
    message.textContent = "🎉 Great job, you matched them all!";
  }
}
function toggleSound() {
  soundOn = !soundOn;
}
function toggleVibrate() {
  vibrateOn = !vibrateOn;
}
