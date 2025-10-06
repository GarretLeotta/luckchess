import type { CardDef, CardsConfig } from './loader/cardsLoader.js'
import { Card } from './types.js'

export class Deck {
    private deck: Card[]

    constructor(config: CardsConfig) {
        const pool: Card[] = []
        for (const card of config.cards) {
            for (let i = 0; i < card.frequency; i++) {
                pool.push(this.makeCard(card))
            }
        }
        this.deck = this.shuffle(pool)
    }

    private shuffle(cards: Card[]): Card[] {
        // console.log(`Shuffling: ${cards.length}`)
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const temp = cards[i]
            cards[i] = cards[j]
            cards[j] = temp
        }
        return cards
    }

    private makeCard(def: CardDef): Card {
        return { pieceType: def.pieceType, movesAs: def.movesAs, used: false }
    }

    draw(count = 1): Card[] {
        // console.log(`Drawing: ${this.remaining()}`)
        const drawn: Card[] = []
        for (let i = 0; i < count; i++) {
            const card = this.deck.pop()
            if (!card) break
            drawn.push(card)
        }
        return drawn
    }

    remaining(): number {
        return this.deck.length
    }

    isEmpty(): boolean {
        return this.deck.length === 0
    }
}
