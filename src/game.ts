import { loadMovesConfig, MoveConfig, MovesConfig } from './loader/movesLoader.js'
import { loadPiecesConfig, PiecesConfig } from './loader/piecesLoader.js'
import { loadBoardConfig, BoardConfig, inBounds } from './loader/boardLoader.js'
import { loadCardsConfig, CardsConfig } from './loader/cardsLoader.js'
import { BoardGrid, Card, Color, Coordinate, Piece, PieceType } from './types.js'

export type MoveWithCard = {
    move: Coordinate
    card?: Card
}

export interface Player {
    color: Color
    cards: Card[]
}

export interface SelectResult {
    moved: boolean
    from?: Coordinate
    to?: Coordinate
    card?: Card
    captured?: Piece
    gameOver: boolean
}

export class Game {
    board: BoardGrid
    turn: Color
    selected: Coordinate | null
    legal: MoveWithCard[]
    players: Record<Color, Player>
    lastDoublePawn: (Coordinate & { color: Color }) | null
    castleRights: { [C in Color]: { kingSide: boolean; queenSide: boolean } }
    gameOver: boolean
    movesConfig: MovesConfig
    piecesConfig: PiecesConfig
    boardConfig: BoardConfig
    cardsConfig: CardsConfig

    constructor(
        movesConfig: MovesConfig,
        piecesConfig: PiecesConfig,
        boardConfig: BoardConfig,
        cardsConfig: CardsConfig
    ) {
        this.movesConfig = movesConfig
        this.piecesConfig = piecesConfig
        this.boardConfig = boardConfig
        this.cardsConfig = cardsConfig

        this.board = this.initBoard(boardConfig)
        this.turn = 'w'
        this.selected = null
        this.legal = []
        this.players = {
            w: { color: 'w', cards: this.initCards('w') },
            b: { color: 'b', cards: this.initCards('b') }
        }
        this.lastDoublePawn = null
        this.castleRights = {
            w: { kingSide: true, queenSide: true },
            b: { kingSide: true, queenSide: true }
        }
        this.gameOver = false
    }

    //TODO: take a root prefix
    static async create(): Promise<Game> {
        const [moves, pieces, board, cards] = await Promise.all([
            loadMovesConfig('/src/data/moves.json'),
            loadPiecesConfig('/src/data/pieces.json'),
            loadBoardConfig('/src/data/board.json'),
            loadCardsConfig('/src/data/cards.json'),
        ])
        return new Game(moves, pieces, board, cards)
    }

    get currentHand() {
        return this.players[this.turn].cards.filter(c => !c.used)
    }

    select(coord: Coordinate): SelectResult {
        const clicked = this.board[coord.y][coord.x]
        if (this.selected) {
            const legalMove = this.legal.find(m => m.move.x === coord.x && m.move.y === coord.y)
            if (legalMove) {
                const from = { ...this.selected }
                const to = { ...coord }
                const captured = this.board[to.y][to.x] ?? undefined
                this.makeMove(from, to, legalMove.card)
                return { moved: true, from, to, card: legalMove.card, captured, gameOver: this.gameOver }
            }
        }
        if (clicked && clicked.c === this.turn) {
            this.selected = { ...coord }
            this.legal = this.generateMoves(coord)
        } else {
            this.selected = null
            this.legal = []
        }
        return { moved: false, gameOver: this.gameOver }
    }

    makeMove(from: Coordinate, to: Coordinate, card?: Card) {
        const b2 = this.cloneBoard()
        const moving = b2[from.y][from.x]
        if (!moving) return

        const target = b2[to.y][to.x]
        if (target && target.t === 'k') this.gameOver = true

        // en passant capture
        if (moving.t === 'p' && this.lastDoublePawn) {
            const ep = this.lastDoublePawn
            const dir = moving.c === 'w' ? -1 : 1
            if (
                to.x === ep.x &&
                to.y === from.y + dir &&
                ep.y === from.y &&
                ep.color !== moving.c &&
                !target // ensure normal capture did not occur
            ) {
                b2[ep.y][ep.x] = null
            }
        }

        b2[to.y][to.x] = moving
        b2[from.y][from.x] = null

        // pawn promotion (use JSON promotions)
        if (moving.t === 'p' && ((moving.c === 'w' && to.y === 0) || (moving.c === 'b' && to.y === this.board.length - 1))) {
            const pawnConfig = this.movesConfig['p'] as Extract<MoveConfig, { type: 'pawn' }>
            const promotionType = pawnConfig.promotions[0] // choose default, could allow selection
            b2[to.y][to.x] = { t: promotionType, c: moving.c }
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
        if (moving.t === 'k') this.castleRights[moving.c].kingSide = this.castleRights[moving.c].queenSide = false
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

    private generateMovesForType(coord: Coordinate, type: string): Coordinate[] {
        const piece = this.board[coord.y][coord.x]!
        const config = this.movesConfig[type]
        if (!config) return []

        switch (config.type) {
            case 'pawn':
                return this.generatePawnMoves(coord, piece, config)
            case 'leaper':
                return this.generateLeaperMoves(coord, piece, config)
            case 'slider':
                return this.generateSliderMoves(coord, piece, config)
        }
    }

    private generatePawnMoves(coord: Coordinate, piece: Piece, cfg: Extract<MoveConfig, { type: 'pawn' }>): Coordinate[] {
        const moves: Coordinate[] = []
        const dir = piece.c === 'w' ? -1 : 1

        // normal forward moves
        for (const [dx, dy] of cfg.deltas) {
            const target = { x: coord.x + dx, y: coord.y + dy * dir }
            if (inBounds(this.boardConfig, target) && !this.board[target.y][target.x]) {
                moves.push(target)
            }
        }

        // double move from start rank
        const startRank = piece.c === 'w' ? cfg.doubleStart[1] : cfg.doubleStart[0]
        if (coord.y === startRank) {
            const intermediate = { x: coord.x, y: coord.y + dir }
            const doubleForward = { x: coord.x, y: coord.y + 2 * dir }
            if (inBounds(this.boardConfig, doubleForward) && !this.board[intermediate.y][intermediate.x] && !this.board[doubleForward.y][doubleForward.x]) {
                moves.push(doubleForward)
            }
        }

        // normal captures
        for (const [dx, dy] of cfg.captures) {
            const target = { x: coord.x + dx, y: coord.y + dy * dir }
            if (inBounds(this.boardConfig, target)) {
                const targetPiece = this.board[target.y][target.x]
                if (targetPiece && targetPiece.c !== piece.c) {
                    moves.push(target)
                }
            }
        }

        // en passant
        if (this.lastDoublePawn) {
            const ep = this.lastDoublePawn
            if (
                ep.color !== piece.c &&
                coord.y === (piece.c === 'w' ? 3 : 4) && // row where en passant is possible
                Math.abs(ep.x - coord.x) === 1 &&
                ep.y === coord.y
            ) {
                // target square is diagonally ahead
                moves.push({ x: ep.x, y: coord.y + dir })
            }
        }

        return moves
    }

    private generateLeaperMoves(coord: Coordinate, piece: Piece, cfg: Extract<MoveConfig, { type: 'leaper' }>): Coordinate[] {
        const moves: Coordinate[] = []
        for (const [dx, dy] of cfg.deltas) {
            const target = { x: coord.x + dx, y: coord.y + dy }
            if (!inBounds(this.boardConfig, target)) continue
            if (!this.board[target.y][target.x] || this.board[target.y][target.x]!.c !== piece.c) {
                moves.push(target)
            }
        }
        return moves
    }

    private generateSliderMoves(coord: Coordinate, piece: Piece, cfg: Extract<MoveConfig, { type: 'slider' }>): Coordinate[] {
        const moves: Coordinate[] = []
        for (const [dx, dy] of cfg.dirs) {
            let steps = 0
            let target = { x: coord.x + dx, y: coord.y + dy }
            while (inBounds(this.boardConfig, target)) {
                steps++
                const occupant = this.board[target.y][target.x]
                if (!occupant) {
                    moves.push({ ...target })
                } else {
                    if (occupant.c !== piece.c) moves.push({ ...target })
                    break
                }
                if (cfg.range && steps >= cfg.range) break
                target = { x: target.x + dx, y: target.y + dy }
            }
        }

        if (cfg.castling) {
            const rights = this.castleRights[piece.c]
            const row = piece.c === 'w' ? 7 : 0
            if (rights.kingSide && this.board[row][5] === null && this.board[row][6] === null && this.board[row][7]?.t === 'r') {
                moves.push({ x: 6, y: row })
            }
            if (rights.queenSide && this.board[row][1] === null && this.board[row][2] === null && this.board[row][3] === null && this.board[row][0]?.t === 'r') {
                moves.push({ x: 2, y: row })
            }
        }

        return moves
    }


    //TODO: Board should be initialized by BoardLoader
    private initBoard(boardConfig: BoardConfig): BoardGrid {
        const grid: BoardGrid = Array.from({ length: boardConfig.height }, () => Array(boardConfig.width).fill(null))
        for (const p of boardConfig.pieces) {
            if (!this.piecesConfig[p.piece]) throw new Error(`Unknown piece type ${p.piece}`)
            grid[p.position.y][p.position.x] = { t: p.piece, c: p.color }
        }
        return grid
    }

    private initCards(color: Color): Card[] {
        const cards: Card[] = []
        for (const def of this.cardsConfig.cards) {
            for (let i = 0; i < def.frequency; i++) {
                cards.push({ pieceType: def.pieceType, movesAs: def.movesAs, used: false })
            }
        }
        return cards
    }

    private cloneBoard(): BoardGrid {
        return this.board.map(row => row.map(c => (c ? { ...c } : null)))
    }
}
