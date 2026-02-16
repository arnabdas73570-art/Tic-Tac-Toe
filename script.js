let board = Array(9).fill("");
let currentPlayer = "X";
let isGameActive = true;
let gameMode = "friend";
let aiDifficulty = "medium";
let scores = { X: 0, O: 0, Draw: 0 };

const xIcon = `<svg class="marker-svg text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const oIcon = `<svg class="marker-svg text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle></svg>`;

const WIN_COMBOS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('game-status');
const nextRoundBtn = document.getElementById('next-round-btn');
const resetScoresBtn = document.getElementById('reset-scores-btn');
const modeFriendBtn = document.getElementById('mode-friend');
const modeAiBtn = document.getElementById('mode-ai');
const aiSettings = document.getElementById('ai-settings');
const diffChips = document.querySelectorAll('.diff-chip');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');

function init() {
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    nextRoundBtn.addEventListener('click', () => restartGame(false));
    resetScoresBtn.addEventListener('click', () => restartGame(true));
    modeFriendBtn.addEventListener('click', () => setMode('friend'));
    modeAiBtn.addEventListener('click', () => setMode('ai'));
    modalClose.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        restartGame(false);
    });
    diffChips.forEach(btn => btn.addEventListener('click', () => {
        aiDifficulty = btn.getAttribute('data-level');
        updateDiffUI();
        restartGame(true);
    }));
    updateTurnIndicator();
}

function setMode(mode) {
    gameMode = mode;
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active', 'text-slate-500'));
    if (mode === 'friend') {
        modeFriendBtn.classList.add('active');
        modeAiBtn.classList.add('text-slate-500');
        aiSettings.classList.add('hidden');
    } else {
        modeAiBtn.classList.add('active');
        modeFriendBtn.classList.add('text-slate-500');
        aiSettings.classList.remove('hidden');
    }
    restartGame(true);
}

function updateDiffUI() {
    diffChips.forEach(btn => {
        if (btn.getAttribute('data-level') === aiDifficulty) {
            btn.className = "diff-chip flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase border-2 border-indigo-500 bg-indigo-50 text-indigo-600 transition-all";
        } else {
            btn.className = "diff-chip flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase border-2 border-slate-100 text-slate-400 transition-all hover:bg-slate-50";
        }
    });
    document.getElementById('diff-label').innerText = aiDifficulty;
}

function updateTurnIndicator() {
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    scoreX.classList.toggle('turn-active', currentPlayer === 'X');
    scoreO.classList.toggle('turn-active', currentPlayer === 'O');
    scoreX.classList.toggle('text-indigo-600', currentPlayer === 'X');
    scoreO.classList.toggle('text-rose-500', currentPlayer === 'O');
    statusText.innerText = `Player ${currentPlayer}'s Turn`;
}

function handleCellClick(e) {
    const index = e.currentTarget.getAttribute('data-index');
    if (board[index] !== "" || !isGameActive) return;
    makeMove(index, currentPlayer);
    if (isGameActive && gameMode === 'ai' && currentPlayer === 'O') {
        isGameActive = false;
        setTimeout(aiMove, 600);
    }
}

function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.innerHTML = player === 'X' ? xIcon : oIcon;
    cell.classList.add('occupied');
    checkResult();
    if (isGameActive) {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateTurnIndicator();
    }
}

function checkResult() {
    let roundWon = false;
    let winningLine = null;
    for (let i = 0; i < WIN_COMBOS.length; i++) {
        const [a, b, c] = WIN_COMBOS[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true; winningLine = [a, b, c]; break;
        }
    }
    if (roundWon) {
        isGameActive = false;
        winningLine.forEach(idx => cells[idx].classList.add('win-pulse'));
        scores[currentPlayer]++;
        updateScoreboard();
        setTimeout(() => showEndModal(`${currentPlayer} Wins!`, `A masterclass in strategy.`, currentPlayer === 'X' ? '👑' : '🤖'), 600);
        return;
    }
    if (!board.includes("")) {
        isGameActive = false;
        scores.Draw++;
        updateScoreboard();
        showEndModal("Grid Locked!", "It's a draw.", "🤝");
    }
}

function updateScoreboard() {
    document.getElementById('val-x').innerText = scores.X;
    document.getElementById('val-o').innerText = scores.O;
    document.getElementById('val-draw').innerText = scores.Draw;
}

function showEndModal(title, desc, icon) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerText = desc;
    document.getElementById('modal-icon').innerText = icon;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function restartGame(resetScores) {
    if (resetScores) { scores = { X: 0, O: 0, Draw: 0 }; updateScoreboard(); }
    board = Array(9).fill("");
    currentPlayer = "X";
    isGameActive = true;
    updateTurnIndicator();
    cells.forEach(cell => {
        cell.innerHTML = "";
        cell.classList.remove('occupied', 'win-pulse');
    });
}

function aiMove() {
    isGameActive = true;
    let move;
    if (aiDifficulty === 'easy') move = getRandomMove();
    else if (aiDifficulty === 'medium') move = Math.random() > 0.5 ? getBestMove() : getRandomMove();
    else move = getBestMove();
    if (move !== undefined) makeMove(move, "O");
}

function getRandomMove() {
    const available = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    return available[Math.floor(Math.random() * available.length)];
}

function getBestMove() {
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            board[i] = "O";
            let score = minimax(board, 0, false);
            board[i] = "";
            if (score > bestScore) { bestScore = score; move = i; }
        }
    }
    return move;
}

const minimaxScores = { O: 10, X: -10, draw: 0 };
function minimax(currBoard, depth, isMaximizing) {
    const result = checkWinnerForMinimax(currBoard);
    if (result !== null) return minimaxScores[result];
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (currBoard[i] === "") {
                currBoard[i] = "O";
                bestScore = Math.max(bestScore, minimax(currBoard, depth + 1, false));
                currBoard[i] = "";
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (currBoard[i] === "") {
                currBoard[i] = "X";
                bestScore = Math.min(bestScore, minimax(currBoard, depth + 1, true));
                currBoard[i] = "";
            }
        }
        return bestScore;
    }
}

function checkWinnerForMinimax(b) {
    for (let i = 0; i < WIN_COMBOS.length; i++) {
        const [a, b_idx, c] = WIN_COMBOS[i];
        if (b[a] && b[a] === b[b_idx] && b[a] === b[c]) return b[a];
    }
    return b.includes("") ? null : 'draw';
}

init();
