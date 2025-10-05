import { Index } from "./types.js"

/**
 * Represents a coordinate on a chessboard.
 */
export class Coordinate implements Index {
    /** The horizontal position (0-based, corresponds to column) */
    readonly x: number

    /** The vertical position (0-based, corresponds to row) */
    readonly y: number

    /**
     * Private constructor. Use static methods to create instances.
     * @param x Horizontal index
     * @param y Vertical index
     */
    private constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    /**
     * Creates a Coordinate from an Index object.
     * @param index Object with x and y properties
     * @returns A new Coordinate instance
     */
    static fromIndex(index: Index): Coordinate {
        return new Coordinate(index.x, index.y)
    }

    /**
     * Creates a Coordinate from algebraic notation (e.g., "A1").
     * @param algebraic String in algebraic format
     * @throws Error if the notation is invalid
     * @returns A new Coordinate instance
     */
    static fromAlgebraic(algebraic: string): Coordinate {
        const pos = algebraic.toUpperCase()
        if (!/^[A-Z][1-9][0-9]*$/.test(pos)) throw new Error(`Invalid algebraic position: ${pos}`)
        const x = pos.charCodeAt(0) - 65
        const y = parseInt(pos.slice(1), 10) - 1
        return new Coordinate(x, y)
    }

    /**
     * Returns the coordinate as an Index object.
     */
    get index(): { x: number; y: number } {
        return { x: this.x, y: this.y }
    }

    /**
     * Returns the coordinate in algebraic notation (e.g., "A1").
     * @throws Error if x is out of bounds for algebraic notation
     */
    get algebraicPosition(): string {
        if (this.x < 0 || this.x >= 26) throw new Error('X out of bounds for algebraic notation')
        return String.fromCharCode(65 + this.x) + (this.y + 1).toString()
    }

    /**
     * Creates a copy of this coordinate.
     * @returns A new Coordinate with the same x and y
     */
    copy(): Coordinate {
        return Coordinate.fromIndex({ ...this })
    }

    /**
     * Compares this coordinate with another for equality.
     * @param other Coordinate to compare
     * @returns True if both coordinates are equal
     */
    equals(other: Coordinate): boolean {
        return this.x === other.x && this.y === other.y
    }
}
