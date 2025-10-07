import { Game } from '../src/game.js'
import { BoardConfig } from '../src/loader/boardLoader.js'
import { CardsConfig, loadCardsConfig } from '../src/loader/cardsLoader.js'
import { loadMovesConfig, MovesConfig } from '../src/loader/movesLoader.js'
import { loadPiecesConfig, PiecesConfig } from '../src/loader/piecesLoader.js'

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { readFile } from 'fs/promises'
import { Coordinate } from '../src/coordinate.js'

let movesConfig: MovesConfig
let piecesConfig: PiecesConfig
let boardConfig: BoardConfig
let cardsConfig: CardsConfig

beforeAll(() => {
    vi.stubGlobal('fetch', async (filepath: string) => {
        const fileContent = await readFile(`${filepath}`, 'utf-8')
        return {
            json: async () => JSON.parse(fileContent)
        }
    })
})

beforeAll(async () => {
    movesConfig = await loadMovesConfig('./tests/data/moves.json')
    piecesConfig = await loadPiecesConfig('./tests/data/pieces.json')
    boardConfig = await BoardConfig.load('./tests/data/boards/test.json')
    cardsConfig = await loadCardsConfig('./tests/data/cards/test.json')
})

describe('Game', () => {
    let game: Game

    beforeEach(() => {
        game = new Game(movesConfig, piecesConfig, boardConfig, cardsConfig)
    })

    it('initializes correctly', () => {
        expect(game.turn).toBe('w')
        expect(game.selected).toBeNull()
        expect(game.legal).toEqual([])
        expect(game.board.height).toBe(boardConfig.height)
        expect(game.board.getPiece(Coordinate.fromAlgebraic("A1"))).not.toBeNull()
    })

    it('leapers can capture', () => {
        const coord = Coordinate.fromAlgebraic("G3")
        const result = game.select(coord)
        console.log(JSON.stringify(result))
        // expect(result.moved).toBe(false)
        // expect(game.selected).toEqual(coord)
        // expect(game.legal.length).toBeGreaterThan(0)
    })

    // it('selecting empty square deselects', () => {
    //     game.select({ x: 4, y: 6 })
    //     const result = game.select({ x: 0, y: 6 }) // assume not legal initially
    //     expect(result.moved).toBe(false)
    //     expect(game.selected).toBeNull()
    //     expect(game.legal).toEqual([])
    // })

    // it('moving a piece updates board and turn', () => {
    //     const from = { x: 4, y: 6 }
    //     game.select(from)
    //     const move = game.legal.find(m => m.move.x === 4 && m.move.y === 4)!
    //     const result = game.select(move.move)
    //     expect(result.moved).toBe(true)
    //     expect(game.board[4][0]).not.toBeNull()
    //     expect(game.board[6][0]).toBeNull()
    //     expect(game.turn).toBe('b')
    // })

    // it('pawn promotion works', () => {
    //     const pawnCoord = { x: 0, y: 1 }
    //     game.board[1][0] = { t: 'p', c: 'w' }
    //     game.board[0][0] = null
    //     game.select(pawnCoord)
    //     const move = game.legal.find(m => m.move.x === 0 && m.move.y === 0)!
    //     game.select(move.move)
    //     expect(game.board[0][0]!.t).not.toBe('p')
    // })

    // it('castling moves rook and king', () => {
    //     // Clear path for white king-side castling
    //     game.board[7][5] = null
    //     game.board[7][6] = null
    //     const kingCoord = { x: 4, y: 7 }
    //     game.select(kingCoord)
    //     const move = game.legal.find(m => m.move.x === 6 && m.move.y === 7)!
    //     game.select(move.move)
    //     expect(game.board[7][6]!.t).toBe('k')
    //     expect(game.board[7][5]!.t).toBe('r')
    // })

    // it('capturing king sets gameOver', () => {
    //     game.board[1][0] = { t: 'k', c: 'b' }
    //     game.board[6][0] = { t: 'p', c: 'w' }
    //     game.select({ x: 0, y: 6 })
    //     const move = game.legal.find(m => m.move.x === 0 && m.move.y === 1)!
    //     const result = game.select(move.move)
    //     expect(result.gameOver).toBe(true)
    //     expect(game.gameOver).toBe(true)
    // })
})
