const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const finalScreen = document.getElementById("finalScreen");
const modal = document.getElementById("modal");
const startButton = document.getElementById("startButton");
const escapeButton = document.getElementById("escapeButton");
const lab = document.getElementById("lab");
const player = document.getElementById("player");
const pascal = document.getElementById("pascal");
const itemsCount = document.getElementById("itemsCount");
const statusText = document.getElementById("status");
const giftDoor = document.getElementById("giftDoor");
const music = document.getElementById("music");

let playerPos = { x: 10, y: 52 };
let pascalPos = { x: 62, y: 50 };
let keys = {};
let collected = new Set();
let gameRunning = false;
let animationId = null;
let lastTime = 0;
let confettiTimer = null;

const playerSpeed = 28; // % of lab width per second
const pascalSpeed = 11;
const collisionDistance = 6.2;

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function updatePositions() {
  player.style.left = playerPos.x + "%";
  player.style.top = playerPos.y + "%";
  pascal.style.left = pascalPos.x + "%";
  pascal.style.top = pascalPos.y + "%";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function resetToStart() {
  playerPos = { x: 10, y: 52 };
  pascalPos = { x: 62, y: 50 };
  keys = {};
  updatePositions();
}

function startGame() {
  showScreen(gameScreen);
  collected.clear();
  document.querySelectorAll(".item").forEach(item => item.classList.remove("collected"));
  giftDoor.classList.add("locked");
  giftDoor.classList.remove("unlocked");
  itemsCount.textContent = "0/3";
  statusText.textContent = "Trouve 🔬 🧫 ☕ puis rejoins 🎁";
  resetToStart();
  gameRunning = true;
  lastTime = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  showScreen(finalScreen);
  music.play().catch(() => {});
  startConfetti();
}

function captureByPascal() {
  gameRunning = false;
  showScreen(modal);
}

function resumeAfterCapture() {
  resetToStart();
  showScreen(gameScreen);
  statusText.textContent = "Retour au début du labo. Évite Pascal !";
  gameRunning = true;
  lastTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

function collectItems() {
  document.querySelectorAll(".item:not(.collected)").forEach(item => {
    const itemPos = {
      x: parseFloat(item.style.left),
      y: parseFloat(item.style.top)
    };
    if (distance(playerPos, itemPos) < collisionDistance) {
      collected.add(item.dataset.item);
      item.classList.add("collected");
      itemsCount.textContent = `${collected.size}/3`;
      const names = { microscope: "Microscope récupéré", culture: "Culture bactérienne sécurisée", cafe: "Café vital obtenu" };
      statusText.textContent = names[item.dataset.item] + " !";
      if (collected.size === 3) {
        giftDoor.classList.remove("locked");
        giftDoor.classList.add("unlocked");
        statusText.textContent = "Le cadeau est débloqué. Rejoins 🎁 sans te faire attraper !";
      }
    }
  });
}

function checkGift() {
  if (collected.size < 3) return;
  const giftPos = { x: 80, y: 76 };
  if (distance(playerPos, giftPos) < collisionDistance) {
    endGame();
  }
}

function movePascal(dt) {
  const dx = playerPos.x - pascalPos.x;
  const dy = playerPos.y - pascalPos.y;
  const d = Math.hypot(dx, dy) || 1;
  pascalPos.x += (dx / d) * pascalSpeed * dt;
  pascalPos.y += (dy / d) * pascalSpeed * dt;
  pascalPos.x = clamp(pascalPos.x, 4, 96);
  pascalPos.y = clamp(pascalPos.y, 6, 94);
}

function gameLoop(now) {
  if (!gameRunning) return;
  const dt = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;

  let dx = 0;
  let dy = 0;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    playerPos.x += (dx / len) * playerSpeed * dt;
    playerPos.y += (dy / len) * playerSpeed * dt;
  }

  playerPos.x = clamp(playerPos.x, 4, 96);
  playerPos.y = clamp(playerPos.y, 6, 94);

  movePascal(dt);
  updatePositions();
  collectItems();
  checkGift();

  if (distance(playerPos, pascalPos) < collisionDistance) {
    captureByPascal();
    return;
  }

  animationId = requestAnimationFrame(gameLoop);
}

function setDirection(dir, active) {
  keys[dir] = active;
}

document.addEventListener("keydown", e => {
  const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", z: "up", s: "down", q: "left", d: "right", w: "up", a: "left" };
  const dir = map[e.key];
  if (dir) {
    e.preventDefault();
    setDirection(dir, true);
  }
});

document.addEventListener("keyup", e => {
  const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", z: "up", s: "down", q: "left", d: "right", w: "up", a: "left" };
  const dir = map[e.key];
  if (dir) setDirection(dir, false);
});

document.querySelectorAll(".ctrl").forEach(button => {
  const dir = button.dataset.dir;
  button.addEventListener("pointerdown", e => { e.preventDefault(); setDirection(dir, true); });
  button.addEventListener("pointerup", e => { e.preventDefault(); setDirection(dir, false); });
  button.addEventListener("pointerleave", () => setDirection(dir, false));
  button.addEventListener("pointercancel", () => setDirection(dir, false));
});

function createConfetti() {
  const colors = ["#ff4d6d", "#ffb703", "#06d6a0", "#4cc9f0", "#f72585", "#ffd166", "#8338ec", "#ffffff"];
  const confetti = document.createElement("div");
  confetti.classList.add("confetti");
  confetti.style.left = Math.random() * 100 + "vw";
  confetti.style.width = (Math.random() * 10 + 6) + "px";
  confetti.style.height = (Math.random() * 14 + 8) + "px";
  confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
  confetti.style.animationDuration = (Math.random() * 5 + 5) + "s";
  document.body.appendChild(confetti);
  setTimeout(() => confetti.remove(), 12000);
}

function startConfetti() {
  clearInterval(confettiTimer);
  confettiTimer = setInterval(createConfetti, 120);
}

startButton.addEventListener("click", startGame);
escapeButton.addEventListener("click", resumeAfterCapture);
updatePositions();
