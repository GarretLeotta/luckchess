import { Game } from './game.js'
import { Canvas } from './canvas.js'
import { BoardConfig } from './loader/boardLoader.js'
import { loadCardsConfig } from './loader/cardsLoader.js'
import { loadMovesConfig } from './loader/movesLoader.js'
import { loadPiecesConfig } from './loader/piecesLoader.js'
import { Coordinate } from './coordinate.js'

//TODO: separate SideBarRenderer and GameboardRenderer - Really?
const statusEl = document.getElementById('status')
const canvasEl = document.getElementById('board') as HTMLCanvasElement
const drawBtn = document.getElementById('draw-btn')

const movesConfig = await loadMovesConfig('/data/moves.json')
const piecesConfig = await loadPiecesConfig('/data/pieces.json')
const boardConfig = await BoardConfig.load('/data/board.json')
// const boardConfig = await BoardConfig.load('/data/standard_nocards/board.json')
const cardsConfig = await loadCardsConfig('/data/cards.json')
// const cardsConfig = await loadCardsConfig('/data/standard_nocards/cards.json')

const game = new Game(movesConfig, piecesConfig, boardConfig, cardsConfig)
const canvas = new Canvas(canvasEl, boardConfig, (cx, cy) => {
    const result = game.select(Coordinate.fromIndex({ x: cx, y: cy }))
    // console.log(`SelectResult: ${JSON.stringify(result)}`)
    updateUI()

    // if (result.moved) {
    //     if (result.captured) {
    //         statusEl!.textContent = `Captured ${result.captured.color.toUpperCase()}${result.captured.type.toUpperCase()}`
    //     } else {
    //         statusEl!.textContent = ''
    //     }

    //     if (result.gameOver) {
    //         statusEl!.textContent = `${game.turn === 'w' ? 'Black' : 'White'} wins!`
    //     }
    // }
})

if (drawBtn) {
    //TODO: only clickable if cards still in deck
    drawBtn.addEventListener('click', () => {
        const status = game.drawCards().status
        if (statusEl) {
            statusEl.textContent = status
        }
        updateUI()
    })
}

function updateUI() {
    draw()
    updateTurnUI()
    updateHandsUI()
}

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

    game.players.w.cards
    console.log(`White Cards: ${JSON.stringify(game.players.w.cards)}`)
    console.log(`Black Cards: ${JSON.stringify(game.players.b.cards)}`)
    whiteEl.textContent = game.players.w.cards
        .map(c => `${c.pieceType.toUpperCase()} -> ${c.movesAs.toUpperCase()}`)
        .join(', ')

    blackEl.textContent = game.players.b.cards
        .map(c => `${c.pieceType.toUpperCase()} -> ${c.movesAs.toUpperCase()}`)
        .join(', ')
}

updateUI()
