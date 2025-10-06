import { loadCardsConfig } from '../src/loader/cardsLoader.js'

import { describe, it, expect, beforeAll , vi} from 'vitest'
import { readFile } from 'fs/promises'

import { Deck } from '../src/deck.js'
import { Card } from '../src/types.js'

beforeAll(() => {
    vi.stubGlobal('fetch', async (filepath: string) => {
        const fileContent = await readFile(`${filepath}`, 'utf-8')
        return {
            json: async () => JSON.parse(fileContent)
        }
    })
})

describe('Deck', () => {
    it('builds a deck with correct total size', async () => {
        const config = await loadCardsConfig('./tests/data/cards/test.json')
        const totalFreq = config.cards.reduce((sum, c) => sum + c.frequency, 0)
        const deck = new Deck(config)
        expect(deck.remaining()).toBe(totalFreq)
    })

    it('draw reduces deck size and returns a card', async () => {
        const config = await loadCardsConfig('./tests/data/cards/test.json')
        const deck = new Deck(config)
        const before = deck.remaining()
        const card = deck.draw()
        expect(card).toBeTruthy()
        expect(deck.remaining()).toBe(before - 1)
    })

    it('deck becomes empty after drawing all cards', async () => {
        const config = await loadCardsConfig('./tests/data/cards/test.json')
        const deck = new Deck(config)
        while (!deck.isEmpty()) {
            deck.draw()
        }
        expect(deck.isEmpty()).toBe(true)
        expect(deck.draw()).toStrictEqual([])
    })

    it('can draw multiple cards', async () => {
        const config = await loadCardsConfig('./tests/data/cards/test.json')
        const deck = new Deck(config)
        const cards = deck.draw(4)
        expect(cards.length).toBe(4)
        const lessCards = deck.draw(4)
        expect(lessCards.length).toBe(2)
    })
})
