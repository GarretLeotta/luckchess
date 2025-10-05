import { Game } from './game.js'
import { Canvas } from './canvas.js'
import { BoardConfig } from './loader/boardLoader.js'
import { loadCardsConfig } from './loader/cardsLoader.js'
import { loadMovesConfig } from './loader/movesLoader.js'
import { loadPiecesConfig } from './loader/piecesLoader.js'
import { Coordinate } from './coordinate.js'

//TODO: separate SideBarRenderer and GameboardRenderer
const statusEl = document.getElementById('status')
const canvasEl = document.getElementById('board') as HTMLCanvasElement

const movesConfig = await loadMovesConfig('/src/data/moves.json')
const piecesConfig = await loadPiecesConfig('/src/data/pieces.json')
const boardConfig = await BoardConfig.load('/src/data/board.json')
// const boardConfig = await BoardConfig.load('/src/data/standard_nocards/board.json')
const cardsConfig = await loadCardsConfig('/src/data/cards.json')
// const cardsConfig = await loadCardsConfig('/src/data/standard_nocards/cards.json')

const game = new Game(movesConfig, piecesConfig, boardConfig, cardsConfig)
const canvas = new Canvas(canvasEl, boardConfig, (cx, cy) => {
    const result = game.select(Coordinate.fromIndex({ x: cx, y: cy }))
    draw()
    updateTurnUI()
    updateHandsUI()

    if (result.moved) {
        if (result.captured) {
            statusEl!.textContent = `Captured ${result.captured.color.toUpperCase()}${result.captured.type.toUpperCase()}`
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
