import { Game } from '../src/game.js'
import { BoardConfig } from '../src/loader/boardLoader.js'
import { CardsConfig, loadCardsConfig } from '../src/loader/cardsLoader.js'
import { loadMovesConfig, MovesConfig } from '../src/loader/movesLoader.js'
import { loadPiecesConfig, PiecesConfig } from '../src/loader/piecesLoader.js'

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { readFile } from 'fs/promises'
import { Coordinate } from '../src/coordinate.js'
import { Board } from '../src/board.js'
import { Piece } from '../src/types.js'



beforeAll(() => {
    vi.stubGlobal('fetch', async (filepath: string) => {
        const fileContent = await readFile(`${filepath}`, 'utf-8')
        return {
            json: async () => JSON.parse(fileContent)
        }
    })
})

describe('Board', () => {
    let board: Board

    beforeEach(async () => {
        let boardConfig = await BoardConfig.load('./tests/data/boards/test.json')
        board = Board.fromConfig(boardConfig)
    })

    it('initializes correctly', () => {
        expect(board.width).toBe(8)
        expect(board.height).toBe(8)
        expect(board.allPieces().length).toBe(12)
    })

    it('retrieves pieces', () => {
        let coord = Coordinate.fromAlgebraic("E4")
        let piece = board.getPiece(coord)
        expect(piece).not.toBeNull()
        expect(piece?.color).toBe("w")
        expect(piece?.position).toStrictEqual(coord)
        expect(piece?.type).toBe("p")
    })

    it('sets pieces', () => {
        let coord = Coordinate.fromAlgebraic("A4")
        let piece: Piece = { type: "p", position: coord, color: "w" }
        board.setPiece(coord, piece)
        expect(piece).not.toBeNull()
        expect(piece?.color).toBe("w")
        expect(piece?.position).toStrictEqual(coord)
        expect(piece?.type).toBe("p")
    })

    it('moves pieces', () => {
        let from = Coordinate.fromAlgebraic("E4")
        let to = Coordinate.fromAlgebraic("E5")
        let piece = board.getPiece(from)
        board.movePiece(from, to)
        expect(board.hasPiece(from)).toBe(false)
        let movedPiece = board.getPiece(to)
        expect(movedPiece?.color).toBe(movedPiece?.color)
        expect(piece?.position).toStrictEqual(to)
        expect(movedPiece?.type).toBe(movedPiece?.type)
    })

    it('removes pieces', () => {
        let coord = Coordinate.fromAlgebraic("E4")
        expect(board.hasPiece(coord)).toBe(true)
        board.removePiece(coord)
        expect(board.hasPiece(coord)).toBe(false)
    })
})
