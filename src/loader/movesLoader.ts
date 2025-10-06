
//TODO: this needs re-working, should allow a list of leaper, slider, etc, maybe queens can castle
export type MoveConfig =
    | {
        type: 'pawn'
        deltas: [number, number][]
        //TODO: this should be tracked on instantiated Pieces as "hasMoved" This row method won't work for dynamic sized boards
        doubleStart: [number, number]
        captures: [number, number][]
        promotions: string[]
    }
    | {
        type: 'leaper'
        deltas: [number, number][]
    }
    | {
        type: 'slider'
        dirs: [number, number][]
        range?: number
        castling?: boolean
    }

export type MovesConfig = Record<string, MoveConfig>

export async function loadMovesConfig(filepath: string): Promise<MovesConfig> {
    const resp = await fetch(filepath)
    const raw: unknown = await resp.json()

    if (typeof raw !== 'object' || raw === null) {
        throw new Error('Invalid moves.json root')
    }

    const result: MovesConfig = {}
    for (const [piece, cfgRaw] of Object.entries(raw)) {
        const v = cfgRaw as any
        if (v.type === 'pawn') {
            if (!Array.isArray(v.deltas) || !Array.isArray(v.captures) || !Array.isArray(v.promotions)) {
                throw new Error(`Pawn config invalid for ${piece}`)
            }
            if (!Array.isArray(v.doubleStart) || v.doubleStart.length !== 2) {
                throw new Error(`Pawn doubleStart invalid for ${piece}`)
            }
            result[piece] = {
                type: 'pawn',
                deltas: v.deltas.map((d: any) => [Number(d[0]), Number(d[1])] as [number, number]),
                doubleStart: [Number(v.doubleStart[0]), Number(v.doubleStart[1])] as [number, number],
                captures: v.captures.map((c: any) => [Number(c[0]), Number(c[1])] as [number, number]),
                promotions: v.promotions.map((p: any) => String(p))
            }
        } else if (v.type === 'leaper') {
            if (!Array.isArray(v.deltas)) throw new Error(`Leaper config invalid for ${piece}`)
            result[piece] = {
                type: 'leaper',
                deltas: v.deltas.map((d: any) => [Number(d[0]), Number(d[1])] as [number, number])
            }
        } else if (v.type === 'slider') {
            if (!Array.isArray(v.dirs)) throw new Error(`Slider config invalid for ${piece}`)
            result[piece] = {
                type: 'slider',
                dirs: v.dirs.map((d: any) => [Number(d[0]), Number(d[1])] as [number, number]),
                range: v.range !== undefined ? Number(v.range) : undefined,
                castling: v.castling === true
            }
        } else {
            throw new Error(`Unknown move type for ${piece}`)
        }
    }
    return result
}
