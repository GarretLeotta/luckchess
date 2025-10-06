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
        cardsConfig = await loadCardsConfig('./tests/data/cards/empty.json')
        expect(cardsConfig.cards.length).toBe(0)
    })

    it('Loads cards correctly', async () => {
        cardsConfig = await loadCardsConfig('./tests/data/cards/test.json')
        expect(cardsConfig.cards.length).toBe(2)
    })
})
