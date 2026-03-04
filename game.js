// Created: 2026-03-04 10:00
// 카드 짝 맞추기 게임 로직

const EMOJIS = ['🍎', '🐶', '🌟', '🎸', '🚀', '🦄', '🍕', '🎉'];
const TOTAL_PAIRS = EMOJIS.length; // 8쌍 = 16장

let cards = [];           // 카드 데이터 배열
let flippedCards = [];    // 현재 뒤집힌 카드 (최대 2장)
let matchedCount = 0;     // 맞춘 쌍 수
let moves = 0;            // 이동 횟수
let timerInterval = null; // 타이머 인터벌
let elapsedSeconds = 0;   // 경과 시간(초)
let isLocked = false;     // 클릭 잠금 (두 장 비교 중)
let gameStarted = false;  // 게임 시작 여부

// DOM 요소
const grid = document.getElementById('card-grid');
const movesDisplay = document.getElementById('moves');
const timerDisplay = document.getElementById('timer');
const restartBtn = document.getElementById('restart-btn');
const modal = document.getElementById('result-modal');
const modalResult = document.getElementById('modal-result');
const modalLeaderboard = document.getElementById('modal-leaderboard');
const modalCloseBtn = document.getElementById('modal-close');
const playerNameInput = document.getElementById('player-name');

// ─── 유틸리티 ────────────────────────────────────────────

/**
 * Fisher-Yates 셔플
 * @param {Array} arr
 * @returns {Array}
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 점수 계산: 기본 1000점에서 이동·시간 패널티 차감 */
function calcScore(moves, seconds) {
  return Math.max(0, 1000 - moves * 10 - seconds * 2);
}

/** 타이머 표시 포맷 (mm:ss) */
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ─── 타이머 ──────────────────────────────────────────────

function startTimer() {
  elapsedSeconds = 0;
  timerDisplay.textContent = '00:00';
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    timerDisplay.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// ─── 카드 생성 ────────────────────────────────────────────

function createCard(emoji, index) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.dataset.emoji = emoji;
  card.dataset.index = index;
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">?</div>
      <div class="card-back">${emoji}</div>
    </div>
  `;
  card.addEventListener('click', onCardClick);
  return card;
}

function buildGrid() {
  grid.innerHTML = '';
  cards = shuffle([...EMOJIS, ...EMOJIS]);
  cards.forEach((emoji, index) => {
    grid.appendChild(createCard(emoji, index));
  });
}

// ─── 게임 초기화 ──────────────────────────────────────────

function initGame() {
  stopTimer();
  flippedCards = [];
  matchedCount = 0;
  moves = 0;
  elapsedSeconds = 0;
  isLocked = false;
  gameStarted = false;
  movesDisplay.textContent = '0';
  timerDisplay.textContent = '00:00';
  buildGrid();
  modal.classList.add('hidden');
}

// ─── 카드 클릭 처리 ──────────────────────────────────────

function onCardClick(e) {
  const card = e.currentTarget;

  // 잠금 중이거나 이미 뒤집힌/맞춘 카드는 무시
  if (isLocked) return;
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;

  // 첫 클릭 시 타이머 시작
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  card.classList.add('flipped');
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [a, b] = flippedCards;
  const isMatch = a.dataset.emoji === b.dataset.emoji;

  if (isMatch) {
    a.classList.add('matched');
    b.classList.add('matched');
    matchedCount++;
    flippedCards = [];

    if (matchedCount === TOTAL_PAIRS) {
      stopTimer();
      setTimeout(onGameComplete, 600);
    }
  } else {
    isLocked = true;
    setTimeout(() => {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      flippedCards = [];
      isLocked = false;
    }, 800);
  }
}

// ─── 게임 완료 ────────────────────────────────────────────

async function onGameComplete() {
  const score = calcScore(moves, elapsedSeconds);
  const playerName = playerNameInput.value.trim() || '익명';

  // 결과 표시와 저장 병렬 처리
  await saveScore(playerName, moves, elapsedSeconds, score);
  const leaderboard = await getLeaderboard();

  // 내 결과
  modalResult.innerHTML = `
    <p>🎉 완료! <strong>${playerName}</strong>님의 결과</p>
    <table class="result-table">
      <tr><td>이동 횟수</td><td><strong>${moves}회</strong></td></tr>
      <tr><td>소요 시간</td><td><strong>${formatTime(elapsedSeconds)}</strong></td></tr>
      <tr><td>점수</td><td><strong>${score}점</strong></td></tr>
    </table>
  `;

  // 랭킹 테이블
  if (leaderboard.length === 0) {
    modalLeaderboard.innerHTML = '<p>랭킹 데이터가 없습니다.</p>';
  } else {
    const rows = leaderboard.map((row, i) => `
      <tr class="${row.player_name === playerName ? 'my-row' : ''}">
        <td>${i + 1}</td>
        <td>${row.player_name}</td>
        <td>${row.score}점</td>
        <td>${row.moves}회</td>
        <td>${formatTime(row.time_seconds)}</td>
      </tr>
    `).join('');

    modalLeaderboard.innerHTML = `
      <h3>🏆 TOP 10</h3>
      <table class="leaderboard-table">
        <thead>
          <tr><th>#</th><th>이름</th><th>점수</th><th>이동</th><th>시간</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  modal.classList.remove('hidden');
}

// ─── 이벤트 바인딩 ────────────────────────────────────────

restartBtn.addEventListener('click', initGame);
modalCloseBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  initGame();
});

// 게임 시작
initGame();
