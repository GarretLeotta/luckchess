import { loadMovesConfig, MoveConfig, MovesConfig } from './loader/movesLoader.js'
import { loadPiecesConfig, PiecesConfig } from './loader/piecesLoader.js'
import { BoardConfig } from './loader/boardLoader.js'
import { loadCardsConfig, CardsConfig } from './loader/cardsLoader.js'
import { Card, Color, Piece } from './types.js'
import { Coordinate } from './coordinate.js'
import { Board } from './board.js'
import { Deck } from './deck.js'

//TODO: handle drawing cards as a move
export type Move = {
    piece: Piece
    from: Coordinate
    to: Coordinate
    captured?: Piece
    card?: Card
}

export type MoveWithCard = {
    move: Coordinate
    card?: Card
}

export interface Player {
    color: Color
    cards: Card[]
}

// export interface SelectResult {
//     moved: boolean
//     from?: Coordinate
//     to?: Coordinate
//     card?: Card
//     captured?: Piece
//     gameOver: boolean
// }

export type SelectResult =
    | PieceSelected
    | InvalidSelection
    | IllegalMove
    | LegalMove

export interface PieceSelected {
    type: "PieceSelected"
    piece: Piece
}

export interface InvalidSelection {
    type: "InvalidSelection"
    coord: Coordinate
}

export interface IllegalMove {
    type: "IllegalMove"
    from: Coordinate
    to: Coordinate
}

export interface LegalMove {
    type: "LegalMove"
    from: Coordinate
    to: Coordinate
    card?: Card
    captured?: Piece
    gameOver: boolean
}

export interface DrawResult {
    status: string
}

const CARDS_PER_DRAW = 3;
const START_CARDS = 3;

export class Game {
    //gross game state
    board: Board
    deck: Deck
    //fine game state
    turn: Color
    selected: Coordinate | null
    //TODO: remove legal, cross-turn state like this should be minimized
    legal: MoveWithCard[]
    players: Record<Color, Player>
    gameOver: boolean
    //special game logic (should be configurable via custom scripting)
    lastDoublePawn: Piece | null
    castleRights: { [C in Color]: { kingSide: boolean; queenSide: boolean } }
    //configs
    movesConfig: MovesConfig
    piecesConfig: PiecesConfig

    constructor(
        movesConfig: MovesConfig,
        piecesConfig: PiecesConfig,
        boardConfig: BoardConfig,
        cardsConfig: CardsConfig
    ) {
        this.movesConfig = movesConfig
        this.piecesConfig = piecesConfig
        this.board = Board.fromConfig(boardConfig)
        this.deck = new Deck(cardsConfig)

        this.turn = 'w'
        this.selected = null
        this.legal = []
        this.players = {
            w: { color: 'w', cards: this.deck.draw(START_CARDS) },
            b: { color: 'b', cards: this.deck.draw(START_CARDS) }
        }
        this.lastDoublePawn = null
        this.castleRights = {
            w: { kingSide: true, queenSide: true },
            b: { kingSide: true, queenSide: true }
        }
        this.gameOver = false
    }

    //TODO: selectable in UI
    static async create(): Promise<Game> {
        const [moves, pieces, board, cards] = await Promise.all([
            loadMovesConfig('/src/data/moves.json'),
            loadPiecesConfig('/src/data/pieces.json'),
            BoardConfig.load('/src/data/board.json'),
            loadCardsConfig('/src/data/cards.json'),
        ])
        return new Game(moves, pieces, board, cards)
    }

    get currentPlayer() {
        return this.players[this.turn]
    }


    /**
     * Handles selecting a coordinate on the board.
     * If the coordinate is empty or holds a piece owned by another player, nothing
     * happens.
     * If the coordinate holds a piece owned by the player, that piece is selected.
     * If there is a piece already selected, and the coordinate is a legal move for that
     * piece, the piece moves.
     * If there is a piece selected and the coordinate is an illegal move, the piece is
     * deselected. I
     * @param coord Coordinate the player wants to select
     * @returns SelectResult
     */
    select(coord: Coordinate): SelectResult {
        // console.log(`Selected: ${coord.algebraicPosition}, ${JSON.stringify(this.selected)}`)
        const clicked = this.board.getPiece(coord)
        if (this.selected) {
            const legalMove = this.legal.find(m => m.move.x === coord.x && m.move.y === coord.y)
            if (legalMove) {
                const from = this.selected.copy()
                const to = coord.copy()
                const captured = this.board.getPiece(to) ?? undefined
                this.makeMove(from, to, legalMove.card)
                return { type: "LegalMove", from, to, card: legalMove.card, captured, gameOver: this.gameOver }
            } else {
                const result: SelectResult = { type: "IllegalMove", from: this.selected.copy(), to: coord }
                this.selected = null
                this.legal = []
                return result
            }
        } else {
            //No piece selected
            if (clicked && clicked.color === this.turn) {
                //Select a piece
                this.selected = coord.copy()
                this.legal = this.generateMoves(coord)
                return { type: "PieceSelected", piece: clicked }
            } else {
                this.selected = null
                this.legal = []
                return { type: "InvalidSelection", coord: coord.copy() }
            }
        }
    }

    //TODO: this should return a Move to another function
    drawCards(): DrawResult {
        this.currentPlayer.cards = this.deck.draw(CARDS_PER_DRAW)
        //TODO: make method to represent changeTurn
        this.turn = this.turn === 'w' ? 'b' : 'w'
        this.selected = null
        this.legal = []
        return { status: `Drew ${this.currentPlayer.cards.length} Cards` }
    }

    //TODO: this should return a Move to another function
    makeMove(from: Coordinate, to: Coordinate, card?: Card) {
        const moving = this.board.getPiece(from)
        if (!moving) return

        const target = this.board.getPiece(to)
        if (target && target.type === 'k') this.gameOver = true

        // en passant capture
        //TODO: handle cards
        if (this.movesConfig[moving.type].type == "pawn" && this.lastDoublePawn) {
            const ep = this.lastDoublePawn
            const dir = moving.color === 'w' ? 1 : -1
            if (
                to.x === ep.position.x &&
                to.y === from.y + dir &&
                ep.position.y === from.y &&
                ep.color !== moving.color &&
                !target // ensure normal capture did not occur
            ) {
                //kill the pawn
                this.board.setPiece(ep.position, null)
            }
        }

        this.board.movePiece(from, to)

        // pawn promotion
        if (
            //TODO: any piece should be able to promote, if configged
            this.movesConfig[moving.type].type == "pawn" && (
                (moving.color === 'w' && to.y === 0) ||
                (moving.color === 'b' && to.y === this.board.height - 1))
        ) {
            const pawnConfig = this.movesConfig['p'] as Extract<MoveConfig, { type: 'pawn' }>
            const promotionType = pawnConfig.promotions[0] // choose default, could allow selection
            moving.type = promotionType
            this.board.setPiece(to, moving)
        }

        // castling
        if (moving.type === 'k' && Math.abs(to.x - from.x) === 2) {
            if (to.x > from.x) {
                this.board.movePiece(
                    Coordinate.fromIndex({ x: 7, y: to.y }),
                    Coordinate.fromIndex({ x: 5, y: to.y }),
                )
            } else {
                this.board.movePiece(
                    Coordinate.fromIndex({ x: 3, y: to.y }),
                    Coordinate.fromIndex({ x: 0, y: to.y }),
                )
            }
        }

        // update castle rights
        if (moving.type === 'k') this.castleRights[moving.color].kingSide = this.castleRights[moving.color].queenSide = false
        if (moving.type === 'r') {
            if (from.y === (moving.color === 'w' ? 7 : 0)) {
                if (from.x === 0) this.castleRights[moving.color].queenSide = false
                if (from.x === 7) this.castleRights[moving.color].kingSide = false
            }
        }

        // track double pawn push
        this.lastDoublePawn = null
        if (moving.type === 'p' && Math.abs(to.y - from.y) === 2) {
            this.lastDoublePawn = moving
        }

        //should add unique IDs to cards
        if (card) {
            card.used = true
        }
        this.currentPlayer.cards = this.currentPlayer.cards.filter(c => !c.used)
        this.turn = this.turn === 'w' ? 'b' : 'w'
        this.selected = null
        this.legal = []
    }

    generateMoves(coord: Coordinate): MoveWithCard[] {
        const piece = this.board.getPiece(coord)
        if (!piece) return []
        const normalMoves = this.generateMovesForType(coord, piece.type)
        const moves: MoveWithCard[] = normalMoves.map(m => ({ move: m }))
        const occupied = new Set(normalMoves.map(m => `${m.x},${m.y}`))

        this.currentPlayer.cards.forEach(card => {
            if (card.pieceType === piece.type) {
                const cardMoves = this.generateMovesForType(coord, card.movesAs)
                cardMoves.forEach(m => {
                    const key = `${m.x},${m.y}`
                    if (!occupied.has(key)) moves.push({ move: m, card })
                })
            }
        })
        // console.log(`Moves: ${JSON.stringify(moves)}`)
        return moves
    }

    private generateMovesForType(coord: Coordinate, type: string): Coordinate[] {
        const piece = this.board.getPiece(coord)
        const config = this.movesConfig[type]
        if (!piece || !config) return []

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
        const dir = piece.color === 'w' ? 1 : -1
        // normal forward moves
        for (const [dx, dy] of cfg.deltas) {
            const target = Coordinate.fromIndex({ x: coord.x + dx, y: coord.y + dy * dir })
            if (this.board.inBounds(target) && !this.board.getPiece(target)) {
                moves.push(target)
            }
        }

        // double move from start rank
        const startRank = piece.color === 'w' ? cfg.doubleStart[1] : cfg.doubleStart[0]
        if (coord.y === startRank) {
            const intermediate = Coordinate.fromIndex({ x: coord.x, y: coord.y + dir })
            const doubleForward = Coordinate.fromIndex({ x: coord.x, y: coord.y + 2 * dir })
            if (this.board.inBounds(doubleForward) && !this.board.getPiece(intermediate) && !this.board.getPiece(doubleForward)) {
                moves.push(doubleForward)
            }
        }

        // normal captures
        for (const [dx, dy] of cfg.captures) {
            const target = Coordinate.fromIndex({ x: coord.x + dx, y: coord.y + dy * dir })
            if (this.board.inBounds(target)) {
                const targetPiece = this.board.getPiece(target)
                if (targetPiece && targetPiece.color !== piece.color) {
                    moves.push(target)
                }
            }
        }

        // en passant
        if (this.lastDoublePawn) {
            const ep = this.lastDoublePawn
            if (
                ep.color !== piece.color &&
                Math.abs(ep.position.x - coord.x) === 1 &&
                ep.position.y === coord.y
            ) {
                // target square is diagonally ahead
                moves.push(Coordinate.fromIndex({ x: ep.position.x, y: coord.y + dir }))
            }
        }

        return moves
    }

    private generateLeaperMoves(coord: Coordinate, piece: Piece, cfg: Extract<MoveConfig, { type: 'leaper' }>): Coordinate[] {
        const moves: Coordinate[] = []
        for (const [dx, dy] of cfg.deltas) {
            const target = Coordinate.fromIndex({ x: coord.x + dx, y: coord.y + dy })
            if (!this.board.inBounds(target)) continue
            if (!this.board.getPiece(target) || this.board.getPiece(coord)!.color !== piece.color) {
                moves.push(target)
            }
        }
        return moves
    }

    private generateSliderMoves(coord: Coordinate, piece: Piece, cfg: Extract<MoveConfig, { type: 'slider' }>): Coordinate[] {
        const moves: Coordinate[] = []
        for (const [dx, dy] of cfg.dirs) {
            let steps = 0
            let target = Coordinate.fromIndex({ x: coord.x + dx, y: coord.y + dy })
            while (this.board.inBounds(target)) {
                steps++
                const occupant = this.board.getPiece(target)
                if (!occupant) {
                    moves.push(target.copy())
                } else {
                    if (occupant.color !== piece.color) moves.push(target.copy())
                    break
                }
                if (cfg.range && steps >= cfg.range) break
                target = Coordinate.fromIndex({ x: target.x + dx, y: target.y + dy })
            }
        }

        //TODO: Support Fischer Random
        // if (cfg.castling) {
        //     const rights = this.castleRights[piece.color]
        //     const row = piece.color === 'w' ? 7 : 0
        //     if (rights.kingSide && this.board[row][5] === null && this.board[row][6] === null && this.board[row][7]?.type === 'r') {
        //         moves.push(Coordinate.fromIndex({ x: 6, y: row }))
        //     }
        //     if (rights.queenSide && this.board[row][1] === null && this.board[row][2] === null && this.board[row][3] === null && this.board[row][0]?.type === 'r') {
        //         moves.push(Coordinate.fromIndex({ x: 2, y: row }))
        //     }
        // }

        return moves
    }
}
