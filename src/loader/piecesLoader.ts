import type { PieceType } from '../types.js'

export interface PieceDef {
    name: string
}

export type PiecesConfig = Record<PieceType, PieceDef>

export async function loadPiecesConfig(): Promise<PiecesConfig> {
    const resp = await fetch('/src/data/pieces.json')
    const raw: unknown = await resp.json()
    if (typeof raw !== 'object' || raw === null) {
        throw new Error('Invalid moves.json root')
    }

    const result: PiecesConfig = {}
    for (const [k, v] of Object.entries(raw)) {
        if (typeof v.name !== 'string') throw new Error(`Piece ${k} missing valid name`)
        result[k] = { name: v.name }
    }
    return result
}
