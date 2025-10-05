import { PiecesConfig, loadPiecesConfig } from '../../src/loader/piecesLoader.js'

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { readFile } from 'fs/promises'

let piecesConfig: PiecesConfig

beforeAll(() => {
    vi.stubGlobal('fetch', async (filepath: string) => {
        const fileContent = await readFile(`${filepath}`, 'utf-8')
        return {
            json: async () => JSON.parse(fileContent)
        }
    })
})

describe('Moves Initialization', () => {
    it('Loads an empty cards correctly', async () => {

    })
})
