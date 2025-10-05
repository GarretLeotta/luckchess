import type { Color, Piece, PieceType } from '../types.js'
import { Coordinate } from '../coordinate.js'

export class BoardConfig {
    width: number
    height: number
    pieces: Piece[]

    constructor(width: number, height: number, pieces: Piece[]) {
        this.width = width
        this.height = height
        this.pieces = pieces
    }

    inBounds(c: Coordinate): boolean {
        return c.x >= 0 && c.x < this.width && c.y >= 0 && c.y < this.height
    }

    static async load(filepath: string): Promise<BoardConfig> {
        const resp = await fetch(filepath)
        const raw = await resp.json()

        if (typeof raw.width !== 'number') throw new Error('Board width must be a number')
        if (typeof raw.height !== 'number') throw new Error('Board height must be a number')
        if (!Array.isArray(raw.pieces)) throw new Error('Board must have pieces array')

        const pieces: Piece[] = raw.pieces.map((p: any) => {
            //TODO: piece colors should be based off configs
            if (p.c !== 'w' && p.c !== 'b') throw new Error(`Invalid color: ${p.c}`)
            if (typeof p.t !== 'string') throw new Error('Invalid piece id')
            if (typeof p.pos !== 'string') throw new Error(`Invalid Position: ${p.pos} must be algebraic string`)

            const position = Coordinate.fromAlgebraic(p.pos)
            if (position.x < 0 || position.x >= raw.width || position.y < 0 || position.y >= raw.height) {
                throw new Error(`Piece out of bounds: ${p.pos}`)
            }

            return {
                type: p.t,
                position: position,
                color: p.c
            }
        })

        return new BoardConfig(raw.width, raw.height, pieces)
    }
}
