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

function pawnMoves(board: BoardGrid, x: number, y: number, piece: Piece) {
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

function kingMoves(board: BoardGrid, x: number, y: number, piece: Piece) {
    const moves: { x: number, y: number }[] = []
    for (const dx of [-1, 0, 1]) {
        for (const dy of [-1, 0, 1]) {
            if (dx === 0 && dy === 0) continue
            const cx = x + dx, cy = y + dy
            if (!inBounds(cx, cy)) continue
            if (!board[cy][cx] || board[cy][cx]!.c !== piece.c) moves.push({ x: cx, y: cy })
        }
    }
    return moves
}

export function generateMoves(board: BoardGrid, x: number, y: number, hand: Card[]): MoveWithCard[] {
    const piece = board[y][x]
    if (!piece) return []

    const normalMoves = generateMovesForType(board, x, y, piece.t)
    const moves: MoveWithCard[] = normalMoves.map(m => ({ move: m }))

    const occupied = new Set(normalMoves.map(m => `${m.x},${m.y}`))

    hand.forEach(card => {
        if (card.used) return
        if (card.pieceType === piece.t) {
            const cardMoves = generateMovesForType(board, x, y, card.movesAs)
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


// Helper to select move generation per piece type
function generateMovesForType(board: BoardGrid, x: number, y: number, type: PieceType) {
    switch (type) {
        case 'p': return pawnMoves(board, x, y, board[y][x]!)
        case 'n': return knightMoves(board, x, y, board[y][x]!)
        case 'b': return bishopMoves(board, x, y, board[y][x]!)
        case 'r': return rookMoves(board, x, y, board[y][x]!)
        case 'q': return queenMoves(board, x, y, board[y][x]!)
        case 'k': return kingMoves(board, x, y, board[y][x]!)
        default: return []
    }
}

