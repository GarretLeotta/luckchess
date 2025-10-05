import { describe, it, expect } from 'vitest'
import { Coordinate } from '../src/coordinate.js'

describe('Coordinate', () => {
    it('creates from index correctly', () => {
        const coord = Coordinate.fromIndex({ x: 0, y: 0 })
        expect(coord.index).toEqual({ x: 0, y: 0 })
        expect(coord.algebraicPosition).toBe('A1')
    })

    it('creates from algebraic notation correctly', () => {
        const coord = Coordinate.fromAlgebraic('B3')
        expect(coord.index).toEqual({ x: 1, y: 2 })
        expect(coord.algebraicPosition).toBe('B3')

        const coord2 = Coordinate.fromAlgebraic('b3')
        expect(coord2.index).toEqual({ x: 1, y: 2 })
        expect(coord2.algebraicPosition).toBe('B3')
    })

    it('round-trips algebraic -> Index -> algebraic', () => {
        const coord = Coordinate.fromAlgebraic('H8')
        const roundTrip = Coordinate.fromIndex(coord.index)
        expect(roundTrip.algebraicPosition).toBe('H8')
        expect(roundTrip.index).toEqual({ x: 7, y: 7 })
    })

    it('index-created and algebraic-created are equal', () => {
        const coord1 = Coordinate.fromAlgebraic('A1')
        const coord2 = Coordinate.fromIndex({ x: 0, y: 0 })
        expect(coord1.equals(coord2)).toBe(true)
        expect(coord2.equals(coord1)).toBe(true)
    })

    it('throws on invalid algebraic string', () => {
        expect(() => Coordinate.fromAlgebraic('Z0')).toThrow()
        expect(() => Coordinate.fromAlgebraic('AA1')).toThrow()
        expect(() => Coordinate.fromAlgebraic('1A')).toThrow()
    })

    it('throws when algebraicPosition exceeds width limit', () => {
        const coord = Coordinate.fromIndex({ x: 26, y: 0 })
        expect(() => coord.algebraicPosition).toThrow('X out of bounds for algebraic notation')
    })
})
