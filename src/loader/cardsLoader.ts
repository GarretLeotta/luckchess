import type { PieceType } from '../types.js'

export interface CardDef {
    pieceType: PieceType
    movesAs: PieceType
    frequency: number
}

export interface CardsConfig {
    cards: CardDef[]
}

export async function loadCardsConfig(filepath: string): Promise<CardsConfig> {
    const resp = await fetch(filepath)
    const raw = await resp.json()

    if (!Array.isArray(raw.cards)) throw new Error('cards.json must have "cards" array')

    const cards: CardDef[] = raw.cards.map((c: any) => {
        if (typeof c.pieceType !== 'string') throw new Error('Card missing pieceType')
        if (typeof c.movesAs !== 'string') throw new Error('Card missing movesAs')
        if (typeof c.frequency !== 'number') throw new Error('Card missing frequency')
        return {
            pieceType: c.pieceType,
            movesAs: c.movesAs,
            frequency: c.frequency
        }
    })

    return { cards }
}
