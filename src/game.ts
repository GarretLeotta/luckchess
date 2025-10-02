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

export interface Coordinate {
    x: number
    y: number
}

export type MoveWithCard = {
    move: Coordinate
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

export function inBounds(coord: Coordinate) {
    return coord.x >= 0 && coord.x < 8 && coord.y >= 0 && coord.y < 8
}

export class Game {
    board: BoardGrid
    turn: Color
    selected: Coordinate | null
    legal: MoveWithCard[]
    players: Record<Color, Player>
    lastDoublePawn: Coordinate & { color: Color } | null
    castleRights: { [C in Color]: { kingSide: boolean, queenSide: boolean } }

    constructor() {
        this.board = this.initBoard()
        this.turn = 'w'
        this.selected = null
        this.legal = []
        this.players = players
        this.lastDoublePawn = null
        this.castleRights = { w: { kingSide: true, queenSide: true }, b: { kingSide: true, queenSide: true } }
    }

    get currentHand() {
        return this.players[this.turn].cards.filter(c => !c.used)
    }

    select(coord: Coordinate): boolean {
        const clicked = this.board[coord.y][coord.x]
        if (this.selected) {
            const legalMove = this.legal.find(m => m.move.x === coord.x && m.move.y === coord.y)
            if (legalMove) {
                this.makeMove(this.selected, coord, legalMove.card)
                return true
            }
        }
        if (clicked && clicked.c === this.turn) {
            this.selected = { ...coord }
            this.legal = this.generateMoves(coord)
        } else {
            this.selected = null
            this.legal = []
        }
        return false
    }

    makeMove(from: Coordinate, to: Coordinate, card?: Card) {
        const b2 = this.cloneBoard()
        const moving = b2[from.y][from.x]
        if (!moving) return

        b2[to.y][to.x] = moving
        b2[from.y][from.x] = null

        // pawn promotion
        if (moving.t === 'p' && ((moving.c === 'w' && to.y === 0) || (moving.c === 'b' && to.y === 7))) {
            b2[to.y][to.x] = { t: 'q', c: moving.c }
        }

        // en passant
        if (moving.t === 'p' && this.lastDoublePawn) {
            if (to.x === this.lastDoublePawn.x && from.y === this.lastDoublePawn.y && moving.c !== this.lastDoublePawn.color) {
                b2[this.lastDoublePawn.y][this.lastDoublePawn.x] = null
            }
        }

        // castling
        if (moving.t === 'k' && Math.abs(to.x - from.x) === 2) {
            if (to.x > from.x) {
                b2[to.y][5] = b2[to.y][7]
                b2[to.y][7] = null
            } else {
                b2[to.y][3] = b2[to.y][0]
                b2[to.y][0] = null
            }
        }

        // update castle rights
        if (moving.t === 'k') {
            this.castleRights[moving.c].kingSide = false
            this.castleRights[moving.c].queenSide = false
        }
        if (moving.t === 'r') {
            if (from.y === (moving.c === 'w' ? 7 : 0)) {
                if (from.x === 0) this.castleRights[moving.c].queenSide = false
                if (from.x === 7) this.castleRights[moving.c].kingSide = false
            }
        }

        // track double pawn push
        this.lastDoublePawn = null
        if (moving.t === 'p' && Math.abs(to.y - from.y) === 2) {
            this.lastDoublePawn = { x: to.x, y: to.y, color: moving.c }
        }

        if (card) card.used = true

        this.board = b2
        this.turn = this.turn === 'w' ? 'b' : 'w'
        this.selected = null
        this.legal = []
    }

    generateMoves(coord: Coordinate): MoveWithCard[] {
        const piece = this.board[coord.y][coord.x]
        if (!piece) return []

        const normalMoves = this.generateMovesForType(coord, piece.t)
        const moves: MoveWithCard[] = normalMoves.map(m => ({ move: m }))
        const occupied = new Set(normalMoves.map(m => `${m.x},${m.y}`))

        this.currentHand.forEach(card => {
            if (card.used) return
            if (card.pieceType === piece.t) {
                const cardMoves = this.generateMovesForType(coord, card.movesAs)
                cardMoves.forEach(m => {
                    const key = `${m.x},${m.y}`
                    if (!occupied.has(key)) moves.push({ move: m, card })
                })
            }
        })

        return moves
    }


    private cloneBoard(): BoardGrid { return this.board.map(row => row.map(c => c ? { ...c } : null)) }

    private pawnMoves(coord: Coordinate, piece: Piece): Coordinate[] {
        const moves: Coordinate[] = []
        const dir = piece.c === 'w' ? -1 : 1
        const forward: Coordinate = { x: coord.x, y: coord.y + dir }

        if (inBounds(forward) && !this.board[forward.y][forward.x]) {
            moves.push({ ...forward })
            const startRank = piece.c === 'w' ? 6 : 1
            const doubleForward: Coordinate = { x: forward.x, y: forward.y + dir }
            if (coord.y === startRank && !this.board[doubleForward.y][doubleForward.x]) moves.push(doubleForward)
        }

        for (const dx of [-1, 1]) {
            const attack: Coordinate = { x: coord.x + dx, y: coord.y + dir }
            if (inBounds(attack) && this.board[attack.y][attack.x] && this.board[attack.y][attack.x]!.c !== piece.c) moves.push(attack)
        }

        if (this.lastDoublePawn) {
            if (Math.abs(this.lastDoublePawn.x - coord.x) === 1 && this.lastDoublePawn.y === coord.y && this.lastDoublePawn.color !== piece.c) {
                moves.push({ x: this.lastDoublePawn.x, y: coord.y + dir })
            }
        }

        return moves
    }

    private knightMoves(coord: Coordinate, piece: Piece): Coordinate[] {
        const deltas = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
        const moves: Coordinate[] = []
        for (const [dx, dy] of deltas) {
            const c: Coordinate = { x: coord.x + dx, y: coord.y + dy }
            if (!inBounds(c)) continue
            if (!this.board[c.y][c.x] || this.board[c.y][c.x]!.c !== piece.c) moves.push(c)
        }
        return moves
    }

    private slidingMoves(coord: Coordinate, piece: Piece, dirs: number[][]): Coordinate[] {
        const moves: Coordinate[] = []
        for (const [dx, dy] of dirs) {
            let c: Coordinate = { x: coord.x + dx, y: coord.y + dy }
            while (inBounds(c)) {
                if (!this.board[c.y][c.x]) moves.push({ ...c })
                else { if (this.board[c.y][c.x]!.c !== piece.c) moves.push({ ...c }); break }
                c = { x: c.x + dx, y: c.y + dy }
            }
        }
        return moves
    }

    private bishopMoves(coord: Coordinate, piece: Piece) { return this.slidingMoves(coord, piece, [[1, 1], [1, -1], [-1, 1], [-1, -1]]) }
    private rookMoves(coord: Coordinate, piece: Piece) { return this.slidingMoves(coord, piece, [[1, 0], [-1, 0], [0, 1], [0, -1]]) }
    private queenMoves(coord: Coordinate, piece: Piece) { return this.slidingMoves(coord, piece, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) }

    private kingMoves(coord: Coordinate, piece: Piece): Coordinate[] {
        const moves: Coordinate[] = []
        for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
            if (dx === 0 && dy === 0) continue
            const c: Coordinate = { x: coord.x + dx, y: coord.y + dy }
            if (!inBounds(c)) continue
            if (!this.board[c.y][c.x] || this.board[c.y][c.x]!.c !== piece.c) moves.push(c)
        }

        const rights = this.castleRights[piece.c]
        const row = piece.c === 'w' ? 7 : 0

        if (rights.kingSide && this.board[row][5] === null && this.board[row][6] === null && this.board[row][7]?.t === 'r' && this.board[row][7]?.c === piece.c) {
            moves.push({ x: 6, y: row })
        }
        if (rights.queenSide && this.board[row][1] === null && this.board[row][2] === null && this.board[row][3] === null && this.board[row][0]?.t === 'r' && this.board[row][0]?.c === piece.c) {
            moves.push({ x: 2, y: row })
        }

        return moves
    }

    private generateMovesForType(coord: Coordinate, type: PieceType): Coordinate[] {
        const piece = this.board[coord.y][coord.x]!
        switch (type) {
            case 'p': return this.pawnMoves(coord, piece)
            case 'n': return this.knightMoves(coord, piece)
            case 'b': return this.bishopMoves(coord, piece)
            case 'r': return this.rookMoves(coord, piece)
            case 'q': return this.queenMoves(coord, piece)
            case 'k': return this.kingMoves(coord, piece)
        }
        return []
    }

    private initBoard(): BoardGrid {
        const emptyRow: (Piece | null)[] = Array(8).fill(null)
        const b: BoardGrid = []
        b.push([{ t: 'r', c: 'b' }, { t: 'n', c: 'b' }, { t: 'b', c: 'b' }, { t: 'q', c: 'b' }, { t: 'k', c: 'b' }, { t: 'b', c: 'b' }, { t: 'n', c: 'b' }, { t: 'r', c: 'b' }])
        b.push(Array.from({ length: 8 }, () => ({ t: 'p', c: 'b' })))
        for (let i = 0; i < 4; i++) b.push([...emptyRow])
        b.push(Array.from({ length: 8 }, () => ({ t: 'p', c: 'w' })))
        b.push([{ t: 'r', c: 'w' }, { t: 'n', c: 'w' }, { t: 'b', c: 'w' }, { t: 'q', c: 'w' }, { t: 'k', c: 'w' }, { t: 'b', c: 'w' }, { t: 'n', c: 'w' }, { t: 'r', c: 'w' }])
        return b
    }
}
