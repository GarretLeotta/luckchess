import { Coordinate } from "./coordinate.js"
import { BoardConfig } from "./loader/boardLoader.js"
import { Piece } from "./types.js"

/**
 * Represents a chessboard holding pieces.
 * Supports variable width and height, including rectangular boards.
 */
export class Board {
    /** Internal 2D array storing pieces or null */
    private grid: (Piece | null)[][]

    /** Number of columns on the board */
    readonly width: number

    /** Number of rows on the board */
    readonly height: number

    /**
     * Creates a new Board instance.
     * @param width Number of columns
     * @param height Number of rows
     * @param initialPieces Optional array of pieces to place initially
     */
    constructor(width: number, height: number, initialPieces: Piece[] = []) {
        this.width = width
        this.height = height
        this.grid = Array.from({ length: height }, () => Array(width).fill(null))
        for (const piece of initialPieces) {
            this.setPiece(piece.position, piece)
        }
    }

    /**
     * Creates a Board from a configuration object.
     * @param config Board configuration with width, height, and pieces
     * @returns A new Board instance
     */
    static fromConfig(config: BoardConfig): Board {
        return new Board(config.width, config.height, config.pieces)
    }

    /**
     * Checks if a coordinate is within board bounds.
     * @param coord Coordinate to check
     * @returns True if the coordinate is inside the board
     */
    inBounds(coord: Coordinate): boolean {
        return coord.x >= 0 && coord.x < this.width && coord.y >= 0 && coord.y < this.height
    }

    /**
     * Checks if there is a piece at the given coordinate.
     * @param coord Coordinate to check
     * @returns True if a piece exists at the coordinate, false otherwise
     * @throws Error if the coordinate is out of bounds
     */
    hasPiece(coord: Coordinate): boolean {
        if (!this.inBounds(coord)) throw new Error("Coordinate out of bounds")
        return this.grid[coord.y][coord.x] !== null
    }

    /**
     * Returns the piece at a given coordinate.
     * @param coord Coordinate to query
     * @throws Error if coordinate is out of bounds
     * @returns The piece at the coordinate or null if empty
     */
    getPiece(coord: Coordinate): Piece | null {
        if (!this.inBounds(coord)) throw new Error("Coordinate out of bounds")
        return this.grid[coord.y][coord.x]
    }

    /**
     * Sets a piece at a given coordinate.
     * @param coord Coordinate to set
     * @param piece Piece to place, or null to remove
     * @throws Error if coordinate is out of bounds
     */
    setPiece(coord: Coordinate, piece: Piece | null): void {
        if (!this.inBounds(coord)) throw new Error("Coordinate out of bounds")
        if (piece) piece.position = coord
        this.grid[coord.y][coord.x] = piece
    }

    /**
     * Moves a piece from one coordinate to another.
     * @param from Source coordinate
     * @param to Destination coordinate
     * @throws Error if either coordinate is out of bounds or no piece at source
     */
    movePiece(from: Coordinate, to: Coordinate): void {
        if (!this.inBounds(from) || !this.inBounds(to)) throw new Error("Coordinate out of bounds")
        const piece = this.getPiece(from)
        if (!piece) throw new Error("No piece at source coordinate")
        this.setPiece(to, piece)
        this.setPiece(from, null)
    }

    /**
     * Removes a piece at a given coordinate.
     * @param coord Coordinate to clear
     * @throws Error if coordinate is out of bounds
     */
    removePiece(coord: Coordinate): void {
        if (!this.inBounds(coord)) throw new Error("Coordinate out of bounds")
        this.grid[coord.y][coord.x] = null
    }

    /**
     * Returns all pieces currently on the board.
     * @returns Array of all pieces
     */
    allPieces(): Piece[] {
        const pieces: Piece[] = []
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const piece = this.grid[y][x]
                if (piece) pieces.push(piece)
            }
        }
        return pieces
    }
}
