import { CardsConfig, loadCardsConfig } from '../../src/loader/cardsLoader.js'

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { readFile } from 'fs/promises'

let cardsConfig: CardsConfig

beforeAll(() => {
    vi.stubGlobal('fetch', async (filepath: string) => {
        const fileContent = await readFile(`${filepath}`, 'utf-8')
        return {
            json: async () => JSON.parse(fileContent)
        }
    })
})

describe('Cards Initialization', () => {
    it('Loads an empty cards correctly', async () => {

    })
})
