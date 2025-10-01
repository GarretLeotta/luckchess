export type Color = 'w' | 'b'
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k'

export interface Piece {
    t: PieceType
    c: Color
}

export type BoardGrid = (Piece | null)[][]

export type Card = {
    pieceType: PieceType
    movesAs: PieceType
    used: boolean
}

export type MoveWithCard = {
    move: { x: number, y: number }
    card?: Card
}

export interface Player {
    color: Color
    cards: Card[]
}

export const players: Record<Color, Player> = {
    w: { color: 'w', cards: [{ pieceType: 'p', movesAs: 'r', used: false }, { pieceType: 'q', movesAs: 'n', used: false }] },
    b: { color: 'b', cards: [{ pieceType: 'p', movesAs: 'r', used: false }, { pieceType: 'q', movesAs: 'n', used: false }] }
}

export function initBoard(): BoardGrid {
    const emptyRow: (Piece | null)[] = Array(8).fill(null)
    const b: BoardGrid = []
    b.push([
        { t: 'r', c: 'b' }, { t: 'n', c: 'b' }, { t: 'b', c: 'b' }, { t: 'q', c: 'b' },
        { t: 'k', c: 'b' }, { t: 'b', c: 'b' }, { t: 'n', c: 'b' }, { t: 'r', c: 'b' }
    ])
    b.push(Array.from({ length: 8 }, () => ({ t: 'p', c: 'b' })))
    for (let i = 0; i < 4; i++) b.push([...emptyRow])
    b.push(Array.from({ length: 8 }, () => ({ t: 'p', c: 'w' })))
    b.push([
        { t: 'r', c: 'w' }, { t: 'n', c: 'w' }, { t: 'b', c: 'w' }, { t: 'q', c: 'w' },
        { t: 'k', c: 'w' }, { t: 'b', c: 'w' }, { t: 'n', c: 'w' }, { t: 'r', c: 'w' }
    ])
    return b
}

export function inBounds(x: number, y: number) {
    return x >= 0 && x < 8 && y >= 0 && y < 8
}

export function cloneBoard(b: BoardGrid): BoardGrid {
    return b.map(row => row.map(cell => cell ? { ...cell } : null))
}

function pawnMoves(board: BoardGrid, x: number, y: number, piece: Piece, lastDoublePawn?: { x: number, y: number, color: Color } | null) {
    const moves: { x: number, y: number }[] = []
    const dir = piece.c === 'w' ? -1 : 1
    const nx = x
    const ny = y + dir

    if (inBounds(nx, ny) && !board[ny][nx]) {
        moves.push({ x: nx, y: ny })
        const startRank = piece.c === 'w' ? 6 : 1
        if (y === startRank && !board[ny + dir][nx]) {
            moves.push({ x: nx, y: ny + dir })
        }
    }
    for (const dx of [-1, 1]) {
        const cx = x + dx
        const cy = y + dir
        if (inBounds(cx, cy) && board[cy][cx] && board[cy][cx]!.c !== piece.c) {
            moves.push({ x: cx, y: cy })
        }
    }
    // en passant
    if (lastDoublePawn) {
        if (Math.abs(lastDoublePawn.x - x) === 1 && lastDoublePawn.y === y && lastDoublePawn.color !== piece.c) {
            moves.push({ x: lastDoublePawn.x, y: y + dir })
        }
    }
    return moves
}


function knightMoves(board: BoardGrid, x: number, y: number, piece: Piece) {
    const deltas = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
    const moves: { x: number, y: number }[] = []
    for (const [dx, dy] of deltas) {
        const cx = x + dx, cy = y + dy
        if (!inBounds(cx, cy)) continue
        if (!board[cy][cx] || board[cy][cx]!.c !== piece.c) moves.push({ x: cx, y: cy })
    }
    return moves
}

function slidingMoves(board: BoardGrid, x: number, y: number, piece: Piece, dirs: number[][]) {
    const moves: { x: number, y: number }[] = []
    for (const [dx, dy] of dirs) {
        let cx = x + dx, cy = y + dy
        while (inBounds(cx, cy)) {
            if (!board[cy][cx]) {
                moves.push({ x: cx, y: cy })
            } else {
                if (board[cy][cx]!.c !== piece.c) moves.push({ x: cx, y: cy })
                break
            }
            cx += dx
            cy += dy
        }
    }
    return moves
}

function bishopMoves(board: BoardGrid, x: number, y: number, piece: Piece) {
    return slidingMoves(board, x, y, piece, [[1, 1], [1, -1], [-1, 1], [-1, -1]])
}

function rookMoves(board: BoardGrid, x: number, y: number, piece: Piece) {
    return slidingMoves(board, x, y, piece, [[1, 0], [-1, 0], [0, 1], [0, -1]])
}

function queenMoves(board: BoardGrid, x: number, y: number, piece: Piece) {
    return slidingMoves(board, x, y, piece,
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]])
}

function kingMoves(board: BoardGrid, x: number, y: number, piece: Piece, castleRights?: { [C in Color]: { kingSide: boolean, queenSide: boolean } }) {
    const moves: { x: number, y: number }[] = []
    for (const dx of [-1, 0, 1]) {
        for (const dy of [-1, 0, 1]) {
            if (dx === 0 && dy === 0) continue
            const cx = x + dx, cy = y + dy
            if (!inBounds(cx, cy)) continue
            if (!board[cy][cx] || board[cy][cx]!.c !== piece.c) moves.push({ x: cx, y: cy })
        }
    }

    // castling
    if (castleRights) {
        const rights = castleRights[piece.c]
        const row = piece.c === 'w' ? 7 : 0

        // king-side
        if (rights.kingSide &&
            board[row][5] === null &&
            board[row][6] === null &&
            board[row][7]?.t === 'r' && board[row][7]?.c === piece.c) {
            moves.push({ x: 6, y: row })
        }

        // queen-side
        if (rights.queenSide &&
            board[row][1] === null &&
            board[row][2] === null &&
            board[row][3] === null &&
            board[row][0]?.t === 'r' && board[row][0]?.c === piece.c) {
            moves.push({ x: 2, y: row })
        }
    }
    return moves
}

function generateMovesForType(
    board: BoardGrid,
    x: number,
    y: number,
    type: PieceType,
    lastDoublePawn?: { x: number, y: number, color: Color } | null,
    castleRights?: { [C in Color]: { kingSide: boolean, queenSide: boolean } }
) {
    switch (type) {
        case 'p': return pawnMoves(board, x, y, board[y][x]!, lastDoublePawn)
        case 'n': return knightMoves(board, x, y, board[y][x]!)
        case 'b': return bishopMoves(board, x, y, board[y][x]!)
        case 'r': return rookMoves(board, x, y, board[y][x]!)
        case 'q': return queenMoves(board, x, y, board[y][x]!)
        case 'k': return kingMoves(board, x, y, board[y][x]!, castleRights)
    }
}



export class Game {
    board: BoardGrid
    turn: Color
    selected: { x: number, y: number } | null
    legal: MoveWithCard[]
    players: Record<Color, Player>
    lastDoublePawn: { x: number, y: number, color: Color } | null
    castleRights: { [C in Color]: { kingSide: boolean, queenSide: boolean } }

    constructor() {
        this.board = initBoard()
        this.turn = 'w'
        this.selected = null
        this.legal = []
        this.players = players
        this.lastDoublePawn = null
        this.castleRights = {
            w: { kingSide: true, queenSide: true },
            b: { kingSide: true, queenSide: true }
        }
    }

    get currentHand() {
        return this.players[this.turn].cards.filter(c => !c.used)
    }

    makeMove(sx: number, sy: number, dx: number, dy: number, card?: Card) {
        const b2 = cloneBoard(this.board)
        const moving = b2[sy][sx]
        if (!moving) return
        b2[dy][dx] = moving
        b2[sy][sx] = null

        //promotion
        if (moving.t === 'p') {
            if ((moving.c === 'w' && dy === 0) || (moving.c === 'b' && dy === 7)) {
                b2[dy][dx] = { t: 'q', c: moving.c }
            }
        }

        // en passant capture
        if (moving.t === 'p' && this.lastDoublePawn) {
            if (dx === this.lastDoublePawn.x && sy === this.lastDoublePawn.y && moving.c !== this.lastDoublePawn.color) {
                // remove captured pawn
                b2[this.lastDoublePawn.y][this.lastDoublePawn.x] = null
            }
        }

        // track double pawn push
        this.lastDoublePawn = null
        if (moving.t === 'p' && Math.abs(dy - sy) === 2) {
            this.lastDoublePawn = { x: dx, y: dy, color: moving.c }
        }

        // detect castling
        if (moving.t === 'k' && Math.abs(dx - sx) === 2) {
            if (dx > sx) {
                // king-side
                b2[dy][5] = b2[dy][7]
                b2[dy][7] = null
            } else {
                // queen-side
                b2[dy][3] = b2[dy][0]
                b2[dy][0] = null
            }
        }

        // update castle rights
        if (moving.t === 'k') {
            this.castleRights[moving.c].kingSide = false
            this.castleRights[moving.c].queenSide = false
        }
        if (moving.t === 'r') {
            if (sy === (moving.c === 'w' ? 7 : 0)) {
                if (sx === 0) this.castleRights[moving.c].queenSide = false
                if (sx === 7) this.castleRights[moving.c].kingSide = false
            }
        }


        if (card) card.used = true
        this.board = b2
        this.turn = this.turn === 'w' ? 'b' : 'w'
        this.selected = null
        this.legal = []
    }

    select(x: number, y: number) {
        const clicked = this.board[y][x]
        if (this.selected) {
            const legalMove = this.legal.find(m => m.move.x === x && m.move.y === y)
            if (legalMove) {
                this.makeMove(this.selected.x, this.selected.y, x, y, legalMove.card)
                return true
            }
        }
        if (clicked && clicked.c === this.turn) {
            this.selected = { x, y }
            this.legal = this.generateMoves(x, y)
        } else {
            this.selected = null
            this.legal = []
        }
        return false
    }

    generateMoves(x: number, y: number): MoveWithCard[] {
        const piece = this.board[y][x]
        if (!piece) return []
        const normalMoves = generateMovesForType(this.board, x, y, piece.t, this.lastDoublePawn, this.castleRights)
        const moves: MoveWithCard[] = normalMoves.map(m => ({ move: m }))
        const occupied = new Set(normalMoves.map(m => `${m.x},${m.y}`))
        this.currentHand.forEach(card => {
            if (card.used) return
            if (card.pieceType === piece.t) {
                //Card Moves do not include en passant or castling
                const cardMoves = generateMovesForType(this.board, x, y, card.movesAs)
                cardMoves.forEach(m => {
                    const key = `${m.x},${m.y}`
                    if (!occupied.has(key)) {
                        moves.push({ move: m, card })
                    }
                })
            }
        })
        return moves
    }
}
