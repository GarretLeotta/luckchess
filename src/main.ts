import { initBoard, BoardGrid, Color, generateMoves, cloneBoard, players, Card, MoveWithCard } from './game.js'
import { Renderer } from './renderer.js'
import { Input } from './input.js'

const canvas = document.getElementById('board') as HTMLCanvasElement
const renderer = new Renderer(canvas)

let board: BoardGrid = initBoard()
let turn: Color = 'w'
let selected: { x: number, y: number } | null = null
let legal: MoveWithCard[] = []
let currentHand = players[turn].cards

function draw() {
    renderer.draw(board, selected, legal)
}

function updateTurnUI() {
    const el = document.getElementById('turn')
    if (el) el.textContent = turn === 'w' ? 'White' : 'Black'
}

export function makeMove(board: BoardGrid, sx: number, sy: number, dx: number, dy: number, turn: Color, card?: Card) {
    const b2 = cloneBoard(board)
    const moving = b2[sy][sx]
    if (!moving) return board
    b2[dy][dx] = moving
    b2[sy][sx] = null

    if (moving.t === 'p') {
        if ((moving.c === 'w' && dy === 0) || (moving.c === 'b' && dy === 7)) {
            b2[dy][dx] = { t: 'q', c: moving.c }
        }
    }

    if (card) card.used = true

    return b2
}


new Input(canvas, (cx, cy) => {
    const clicked = board[cy][cx]

    if (selected) {
        // Check if clicked square is a legal move
        const legalMove = legal.find(m => m.move.x === cx && m.move.y === cy)
        if (legalMove) {
            board = makeMove(board, selected.x, selected.y, cx, cy, turn, legalMove.card)
            selected = null
            legal = []
            // Update current hand after card consumption
            currentHand = players[turn].cards.filter(c => !c.used)
            turn = turn === 'w' ? 'b' : 'w'
            currentHand = players[turn].cards.filter(c => !c.used)
            draw()
            updateTurnUI()
            updateHandsUI()
            return
        }
    }

    // Select piece if it's the current player's turn
    if (clicked && clicked.c === turn) {
        selected = { x: cx, y: cy }
        legal = generateMoves(board, cx, cy, currentHand)
    } else {
        selected = null
        legal = []
    }

    draw()
})

function updateHandsUI() {
    const whiteEl = document.getElementById('hand-w')
    const blackEl = document.getElementById('hand-b')
    if (!whiteEl || !blackEl) return

    whiteEl.textContent = players.w.cards
        .filter(c => !c.used)
        .map(c => `${c.pieceType.toUpperCase()} -> ${c.movesAs.toUpperCase()}`)
        .join(', ')

    blackEl.textContent = players.b.cards
        .filter(c => !c.used)
        .map(c => `${c.pieceType.toUpperCase()} -> ${c.movesAs.toUpperCase()}`)
        .join(', ')
}

draw()
updateTurnUI()
updateHandsUI()