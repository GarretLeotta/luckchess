import { Game } from './game.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'

const canvas = document.getElementById('board') as HTMLCanvasElement
const renderer = new Renderer(canvas)
const game = new Game()

function draw() {
    renderer.draw(game.board, game.selected, game.legal)
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

new Input(canvas, (cx, cy) => {
    const moved = game.select(cx, cy)
    draw()
    updateTurnUI()
    updateHandsUI()
})

draw()
updateTurnUI()
updateHandsUI()
