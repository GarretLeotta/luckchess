import type { Color, PieceType, Coordinate } from '../types.js'

export interface BoardPiece {
    color: Color
    piece: PieceType
    position: Coordinate
}

//TODO: BoardConfig should be a class
export function inBounds(boardConfig: BoardConfig, c: Coordinate) {
    return c.x >= 0 && c.x < boardConfig.width && c.y >= 0 && c.y < boardConfig.height
}

export interface BoardConfig {
    width: number
    height: number
    pieces: BoardPiece[]
}

export async function loadBoardConfig(): Promise<BoardConfig> {
    const resp = await fetch('/src/data/board.json')
    const raw = await resp.json()

    if (typeof raw.width !== 'number') throw new Error('Board width must be a number')
    if (typeof raw.height !== 'number') throw new Error('Board height must be a number')
    if (!Array.isArray(raw.pieces)) throw new Error('Board must have pieces array')

    const pieces: BoardPiece[] = raw.pieces.map((p: any) => {
        if (p.c !== 'w' && p.c !== 'b') throw new Error(`Invalid color: ${p.c}`)
        if (typeof p.t !== 'string') throw new Error('Invalid piece id')
        //TODO: check that pieces are in bounds
        if (typeof p.pos?.x !== 'number' || typeof p.pos?.y !== 'number') {
            throw new Error('Invalid position')
        }
        return {
            color: p.c,
            piece: p.t,
            position: { x: p.pos.x, y: p.pos.y }
        }
    })

    return { width: raw.width, height: raw.height, pieces }
}
