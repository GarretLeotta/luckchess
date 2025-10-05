import { BoardConfig } from '../../src/loader/boardLoader.js'

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { readFile } from 'fs/promises'

let boardConfig: BoardConfig

beforeAll(() => {
    vi.stubGlobal('fetch', async (filepath: string) => {
        const fileContent = await readFile(`${filepath}`, 'utf-8')
        return {
            json: async () => JSON.parse(fileContent)
        }
    })
})

describe('Board Initialization', () => {
    it('Loads an empty board correctly', async () => {
        boardConfig = await BoardConfig.load('./tests/data/boards/empty.json')
        expect(boardConfig.width).toBe(8)
        expect(boardConfig.height).toBe(8)
        expect(boardConfig.pieces.length).toBe(0)
    })

    it('should load in the standard board correctly', async () => {
        boardConfig = await BoardConfig.load('./tests/data/boards/standard.json')
        expect(boardConfig.width).toBe(8)
        expect(boardConfig.height).toBe(8)
        expect(boardConfig.pieces.length).toBe(32)
        //TODO: check pieces
    })

    it('should reject board configs with invalid colors', async () => {
        await expect(BoardConfig.load('./tests/data/boards/invalidColor.json'))
        .rejects.toThrow();
    })

    it('should reject board configs with invalid pieces', async () => {
        await expect(BoardConfig.load('./tests/data/boards/invalidPieces.json'))
        .rejects.toThrow();
    })

    it('should reject board configs with invalid piece Positions', async () => {
        await expect(BoardConfig.load('./tests/data/boards/invalidPosition.json'))
        .rejects.toThrow();
    })
})
