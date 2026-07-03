const track = document.querySelector('#track');
const player = document.querySelector('#player');
const scoreEl = document.querySelector('#score');
const speedEl = document.querySelector('#speed');
const coinsEl = document.querySelector('#coins');
const overlay = document.querySelector('#overlay');
const overlayTitle = document.querySelector('#overlayTitle');
const overlayText = document.querySelector('#overlayText');
const startButton = document.querySelector('#startButton');
const leftButton = document.querySelector('#leftButton');
const rightButton = document.querySelector('#rightButton');

const lanes = [22, 39.5, 57, 74.5];
const state = {
  running: false,
  paused: false,
  lane: 1,
  score: 0,
  coins: 0,
  speed: 260,
  lastTime: 0,
  obstacleTimer: 0,
  coinTimer: 0,
  objects: [],
  animationId: null,
};

function resetGame() {
  state.running = true;
  state.paused = false;
  state.lane = 1;
  state.score = 0;
  state.coins = 0;
  state.speed = 260;
  state.lastTime = performance.now();
  state.obstacleTimer = 0;
  state.coinTimer = 0;
  state.objects.forEach((item) => item.element.remove());
  state.objects = [];
  overlay.classList.add('hidden');
  movePlayer();
  updateHud();
  track.focus();
  cancelAnimationFrame(state.animationId);
  state.animationId = requestAnimationFrame(gameLoop);
}

function movePlayer() {
  player.style.left = `${lanes[state.lane]}%`;
}

function changeLane(direction) {
  if (!state.running || state.paused) return;
  state.lane = Math.max(0, Math.min(lanes.length - 1, state.lane + direction));
  movePlayer();
}

function spawnObject(type) {
  const element = document.createElement('div');
  const lane = Math.floor(Math.random() * lanes.length);
  element.className = type === 'coin' ? 'coin' : 'car enemy';
  element.style.left = `${lanes[lane]}%`;
  element.style.top = type === 'coin' ? '-44px' : '-104px';
  track.appendChild(element);
  state.objects.push({ type, lane, y: type === 'coin' ? -44 : -104, element });
}

function updateObjects(delta) {
  const distance = state.speed * delta;
  state.objects.forEach((item) => {
    item.y += distance;
    item.element.style.top = `${item.y}px`;
  });

  state.objects = state.objects.filter((item) => {
    if (item.y > track.clientHeight + 120) {
      item.element.remove();
      return false;
    }
    return true;
  });
}

function hasCollision(a, b, padding = 8) {
  const first = a.getBoundingClientRect();
  const second = b.getBoundingClientRect();
  return !(
    first.right - padding < second.left ||
    first.left + padding > second.right ||
    first.bottom - padding < second.top ||
    first.top + padding > second.bottom
  );
}

function checkCollisions() {
  state.objects = state.objects.filter((item) => {
    if (!hasCollision(player, item.element, item.type === 'coin' ? 0 : 10)) return true;

    item.element.remove();
    if (item.type === 'coin') {
      state.coins += 1;
      state.score += 250;
      updateHud();
      return false;
    }

    endGame();
    return false;
  });
}

function updateHud() {
  scoreEl.textContent = Math.floor(state.score).toLocaleString('ko-KR');
  speedEl.textContent = `${(state.speed / 260).toFixed(1)}x`;
  coinsEl.textContent = state.coins.toLocaleString('ko-KR');
}

function gameLoop(time) {
  if (!state.running || state.paused) return;

  const delta = Math.min((time - state.lastTime) / 1000, 0.04);
  state.lastTime = time;
  state.score += delta * 110;
  state.speed += delta * 8;
  state.obstacleTimer -= delta;
  state.coinTimer -= delta;

  if (state.obstacleTimer <= 0) {
    spawnObject('enemy');
    state.obstacleTimer = Math.max(0.42, 1.05 - state.speed / 900);
  }

  if (state.coinTimer <= 0) {
    spawnObject('coin');
    state.coinTimer = 1.6 + Math.random() * 1.2;
  }

  updateObjects(delta);
  checkCollisions();
  updateHud();

  if (state.running) {
    state.animationId = requestAnimationFrame(gameLoop);
  }
}

function endGame() {
  state.running = false;
  cancelAnimationFrame(state.animationId);
  overlayTitle.textContent = '충돌! 레이스 종료';
  overlayText.textContent = `최종 점수 ${Math.floor(state.score).toLocaleString('ko-KR')}점 · 코인 ${state.coins}개`;
  startButton.textContent = '다시 달리기';
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (state.paused) {
    cancelAnimationFrame(state.animationId);
    overlayTitle.textContent = '일시정지';
    overlayText.textContent = 'Space를 누르거나 버튼을 눌러 계속 달리세요.';
    startButton.textContent = '계속하기';
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    state.lastTime = performance.now();
    state.animationId = requestAnimationFrame(gameLoop);
  }
}

startButton.addEventListener('click', () => {
  if (state.running && state.paused) {
    togglePause();
    return;
  }
  resetGame();
});

leftButton.addEventListener('click', () => changeLane(-1));
rightButton.addEventListener('click', () => changeLane(1));

track.addEventListener('pointerdown', (event) => {
  const midpoint = track.getBoundingClientRect().left + track.clientWidth / 2;
  changeLane(event.clientX < midpoint ? -1 : 1);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') changeLane(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') changeLane(1);
  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  }
});

movePlayer();
updateHud();
