/*
  PUBLIC_INTERFACE
  initTicTacToeApp
  This file bootstraps the Tic Tac Toe game UI and implements all client-side logic.
  - Two-player local game with alternating turns (X then O).
  - Winner detection and draw state.
  - Highlight winning combination.
  - Scoreboard for X wins, O wins, and ties.
  - Restart game and Reset scoreboard actions.
  - Ocean Professional theme styling is provided by style.css.
*/

import './style.css'

// PUBLIC_INTERFACE
function initTicTacToeApp() {
  /** Initialize app container and render UI skeleton */
  const app = document.querySelector('#app')
  if (!app) {
    // If the root container is missing, abort initialization gracefully
    // This avoids a top-level 'return' which is invalid in ES modules.
    console.warn('Tic Tac Toe root #app not found.')
    return
  }

  app.innerHTML = `
    <div class="op-app">
      <div class="op-gradient-bg"></div>
      <header class="op-header card-elev">
        <div class="op-title">
          <div class="op-badge">Ocean Professional</div>
          <h1 class="op-heading">Classic Tic Tac Toe</h1>
          <p class="op-subtitle">Two players, one device — smooth, modern, and minimal.</p>
        </div>
        <div class="op-scoreboard">
          <div class="score-item">
            <span class="label">Player X</span>
            <span id="score-x" class="value">0</span>
          </div>
          <div class="score-item">
            <span class="label">Ties</span>
            <span id="score-t" class="value">0</span>
          </div>
          <div class="score-item">
            <span class="label">Player O</span>
            <span id="score-o" class="value">0</span>
          </div>
        </div>
      </header>

      <main class="op-main">
        <section class="op-status card-elev">
          <div class="status-row">
            <div id="turn-indicator" class="chip chip-primary">X's turn</div>
            <div id="game-message" class="message"></div>
          </div>
        </section>

        <section class="op-board card-elev">
          <div class="board-grid" id="board">
            ${Array.from({ length: 9 })
              .map(
                (_, i) => `
              <button class="cell" data-index="${i}" aria-label="Cell ${i + 1}"></button>
            `
              )
              .join('')}
          </div>
        </section>

        <section class="op-actions">
          <button id="btn-restart" class="btn btn-primary">Restart Game</button>
          <button id="btn-reset" class="btn btn-outline">Reset Scoreboard</button>
        </section>
      </main>

      <footer class="op-footer">
        <span class="footer-note">Built with Vite • Ocean Professional Theme</span>
      </footer>
    </div>
  `

  // Game State
  const state = {
    board: Array(9).fill(null),
    xIsNext: true,
    winner: null,
    winningCombo: [],
    scores: loadScores(),
  }

  // Elements
  const boardEl = app.querySelector('#board')
  const cells = Array.from(app.querySelectorAll('.cell'))
  const turnIndicator = app.querySelector('#turn-indicator')
  const gameMessage = app.querySelector('#game-message')
  const btnRestart = app.querySelector('#btn-restart')
  const btnReset = app.querySelector('#btn-reset')
  const scoreXEl = app.querySelector('#score-x')
  const scoreOEl = app.querySelector('#score-o')
  const scoreTEl = app.querySelector('#score-t')

  // Persistent Scoreboard
  updateScoreboard()

  // Wire events
  boardEl.addEventListener('click', onCellClick)
  btnRestart.addEventListener('click', restartGame)
  btnReset.addEventListener('click', resetScoreboard)

  // Initial render
  render()

  function onCellClick(e) {
    const btn = e.target
    if (!btn.classList.contains('cell')) return
    const idx = parseInt(btn.getAttribute('data-index'), 10)

    // Block interaction if game over or occupied
    if (state.winner || state.board[idx]) {
      pulse(btn)
      return
    }

    state.board[idx] = state.xIsNext ? 'X' : 'O'
    state.xIsNext = !state.xIsNext

    const result = evaluateBoard(state.board)
    if (result.winner) {
      state.winner = result.winner
      state.winningCombo = result.combo
      // Update score
      if (state.winner === 'X') state.scores.x += 1
      if (state.winner === 'O') state.scores.o += 1
      saveScores(state.scores)
      updateScoreboard()
    } else if (result.isDraw) {
      state.winner = 'Draw'
      state.scores.t += 1
      saveScores(state.scores)
      updateScoreboard()
    }

    render()
  }

  function render() {
    // Render cells
    cells.forEach((c, i) => {
      const val = state.board[i]
      c.textContent = val ? val : ''
      c.classList.toggle('filled', Boolean(val))
      c.classList.remove('win')
      c.disabled = Boolean(state.winner) || Boolean(val)

      // subtle stagger transition
      c.style.transitionDelay = `${(i % 3) * 30}ms`

      if (state.winner && Array.isArray(state.winningCombo) && state.winningCombo.includes(i)) {
        c.classList.add('win')
      }
    })

    // Update status
    if (state.winner === 'Draw') {
      turnIndicator.className = 'chip chip-elev'
      turnIndicator.textContent = 'Draw'
      gameMessage.textContent = 'It’s a tie! Start a new round.'
      gameMessage.className = 'message text-amber'
    } else if (state.winner === 'X' || state.winner === 'O') {
      turnIndicator.className = 'chip chip-success'
      turnIndicator.textContent = `${state.winner} wins`
      gameMessage.textContent = `Congratulations, Player ${state.winner}!`
      gameMessage.className = 'message text-primary'
    } else {
      turnIndicator.className = 'chip chip-primary'
      turnIndicator.textContent = state.xIsNext ? "X's turn" : "O's turn"
      gameMessage.textContent = ''
      gameMessage.className = 'message'
    }
  }

  function restartGame() {
    state.board = Array(9).fill(null)
    state.winner = null
    state.winningCombo = []
    // Alternate starting player each round for fairness
    state.xIsNext = !state.xIsNext
    // Enable all cells
    cells.forEach((c) => (c.disabled = false))
    ripple(btnRestart)
    render()
  }

  function resetScoreboard() {
    state.scores = { x: 0, o: 0, t: 0 }
    saveScores(state.scores)
    updateScoreboard()
    ripple(btnReset)
  }

  function updateScoreboard() {
    scoreXEl.textContent = state.scores.x
    scoreOEl.textContent = state.scores.o
    scoreTEl.textContent = state.scores.t
  }

  function evaluateBoard(b) {
    const wins = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]
    for (const [a, m, n] of wins) {
      if (b[a] && b[a] === b[m] && b[a] === b[n]) {
        return { winner: b[a], combo: [a, m, n], isDraw: false }
      }
    }
    const isDraw = b.every((c) => c !== null)
    return { winner: null, combo: [], isDraw }
  }

  // Local storage helpers
  function loadScores() {
    try {
      const raw = localStorage.getItem('ttt_scores')
      if (!raw) return { x: 0, o: 0, t: 0 }
      const parsed = JSON.parse(raw)
      return {
        x: Number(parsed.x) || 0,
        o: Number(parsed.o) || 0,
        t: Number(parsed.t) || 0,
      }
    } catch {
      return { x: 0, o: 0, t: 0 }
    }
  }
  function saveScores(scores) {
    try {
      localStorage.setItem('ttt_scores', JSON.stringify(scores))
    } catch {
      // ignore storage errors
    }
  }

  // Subtle visual effects: ripple and pulse
  function ripple(el) {
    el.classList.remove('ripple')
    void el.offsetWidth // reflow
    el.classList.add('ripple')
    setTimeout(() => el.classList.remove('ripple'), 400)
  }
  function pulse(el) {
    el.classList.add('pulse')
    setTimeout(() => el.classList.remove('pulse'), 250)
  }
}

initTicTacToeApp()

// PUBLIC_INTERFACE
export { initTicTacToeApp }
