import { Game } from './game.js'
import { Canvas } from './canvas.js'

//TODO: separate SideBarRenderer and GameboardRenderer
const statusEl = document.getElementById('status')
const canvasEl = document.getElementById('board') as HTMLCanvasElement

const game = new Game()
const canvas = new Canvas(canvasEl, (cx, cy) => {
    const result = game.select({ x: cx, y: cy })
    draw()
    updateTurnUI()
    updateHandsUI()

    if (result.moved) {
        if (result.captured) {
            statusEl!.textContent = `Captured ${result.captured.c.toUpperCase()}${result.captured.t.toUpperCase()}`
        } else {
            statusEl!.textContent = ''
        }

        if (result.gameOver) {
            statusEl!.textContent = `${game.turn === 'w' ? 'Black' : 'White'} wins!`
        }
    }
})

function draw() {
    canvas.draw(game.board, game.selected, game.legal)
}

function updateTurnUI() {
    const el = document.getElementById('turn')
    if (el) el.textContent = game.turn === 'w' ? 'White' : 'Black'
}

function updateHandsUI() {
    const whiteEl = document.getElementById('hand-w')
    const blackEl = document.getElementById('hand-b')
    if (!whiteEl || !blackEl) return

    whiteEl.textContent = game.players.w.cards
        .filter(c => !c.used)
        .map(c => `${c.pieceType.toUpperCase()} -> ${c.movesAs.toUpperCase()}`)
        .join(', ')

    blackEl.textContent = game.players.b.cards
        .filter(c => !c.used)
        .map(c => `${c.pieceType.toUpperCase()} -> ${c.movesAs.toUpperCase()}`)
        .join(', ')
}

draw()
updateTurnUI()
updateHandsUI()
