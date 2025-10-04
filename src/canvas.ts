import { PieceType, BoardGrid, Coordinate } from './types.js'
import { MoveWithCard } from './game.js'
import { BoardConfig, inBounds } from './loader/boardLoader.js'

/**
 * Handles rendering and interaction with the Game board on an HTML canvas.
 */
export class Canvas {
    private ctx: CanvasRenderingContext2D
    //Width & Height of a single square on the chessboard in pixels
    private cell: number
    //Vertical offset of the chessboard
    private offsetY: number
    private boardConfig: BoardConfig

    /**
     * @param canvas HTMLCanvasElement on which to draw the board
     * @param onClick Callback invoked when a board cell is clicked, with board coordinates
     */
    constructor(
        private canvas: HTMLCanvasElement,
        private _boardConfig: BoardConfig,
        private onClick: (x: number, y: number) => void
    ) {
        this.ctx = canvas.getContext('2d')!
        canvas.height = 960
        this.cell = canvas.width / 8
        this.offsetY = (canvas.height - this.cell * 8) / 2
        this.boardConfig = _boardConfig

        canvas.addEventListener('click', (e) => {
            const pos = this.screenToBoard(e.clientX, e.clientY)
            if (pos) onClick(pos.x, pos.y)
        })
    }

    /**
     * Convert mouse screen coordinates into board coordinates.
     * @param screenX Mouse X in screen space
     * @param screenY Mouse Y in screen space
     * @returns Board coordinate if inside the board, otherwise null
     */
    private screenToBoard(screenX: number, screenY: number): Coordinate | null {
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = this.canvas.width / rect.width
        const scaleY = this.canvas.height / rect.height
        const x = (screenX - rect.left) * scaleX
        const y = (screenY - rect.top) * scaleY - this.offsetY
        const bx = Math.floor(x / this.cell)
        const by = Math.floor(y / this.cell)
        if (inBounds(this.boardConfig, { x: bx, y: by })) {
            return { x: bx, y: by }
        } else {
            return null
        }
    }

    /**
     * Convert a board coordinate into the pixel-space top-left corner of that square.
     * @param coord Board coordinate
     * @returns Object containing pixel X/Y of the square's top-left corner
     */
    private boardToScreen(coord: Coordinate) {
        return {
            cx: coord.x * this.cell,
            cy: coord.y * this.cell + this.offsetY
        }
    }

    /**
     * Draw the entire board, including grid, pieces, highlights, and legal moves.
     * @param board Current board state
     * @param selected Currently selected square (if any)
     * @param legal Array of legal moves for the selected piece
     */
    draw(board: BoardGrid, selected: Coordinate | null, legal: MoveWithCard[]) {
        this.drawBoard()
        if (selected) this.highlightSelected(selected)

        for (const m of legal) {
            const target = board[m.move.y][m.move.x]
            if (target) {
                this.drawCaptureIndicator(m.move, !!m.card)
            } else {
                this.drawMoveIndicator(m.move, !!m.card)
            }
        }

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const p = board[y][x]
                if (p) this.drawPiece({ x, y }, p.t, p.c)
            }
        }
    }

    /**
     * Draw the chessboard background.
     */
    private drawBoard() {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const coord: Coordinate = { x, y }
                const { cx, cy } = this.boardToScreen(coord)
                const light = (x + y) % 2 === 0
                this.ctx.fillStyle = light ? '#eeeed2' : '#769656'
                this.ctx.fillRect(cx, cy, this.cell, this.cell)
            }
        }
    }

    /**
     * Highlight the currently selected square.
     * @param coord Board coordinate to highlight
     */
    private highlightSelected(coord: Coordinate) {
        const { cx, cy } = this.boardToScreen(coord)
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)'
        this.ctx.fillRect(cx, cy, this.cell, this.cell)
    }

    /**
     * Draw a small circle indicating a legal move.
     * @param coord Board coordinate to mark
     * @param card Whether the move comes from a special card
     */
    private drawMoveIndicator(coord: Coordinate, card: boolean) {
        const { cx, cy } = this.boardToScreen(coord)
        const centerX = cx + this.cell / 2
        const centerY = cy + this.cell / 2
        this.ctx.beginPath()
        this.ctx.arc(centerX, centerY, this.cell * 0.12, 0, Math.PI * 2)
        this.ctx.fillStyle = card ? 'rgba(255, 215, 0, 0.7)' : 'rgba(0,0,0,0.15)'
        this.ctx.fill()
    }

    /**
     * Draw capture indicator in the corners of a square.
     * @param coord Board coordinate to mark
     * @param card Whether the move comes from a special card
     */
    private drawCaptureIndicator(coord: Coordinate, card: boolean) {
        const { cx, cy } = this.boardToScreen(coord)
        const r = this.cell * 0.12
        const color = card ? 'rgba(255, 215, 0, 0.7)' : 'rgba(0,0,0,0.4)'
        this.ctx.fillStyle = color

        const corners = [
            [cx, cy, 0, 0.5 * Math.PI],
            [cx + this.cell, cy, 0.5 * Math.PI, Math.PI],
            [cx + this.cell, cy + this.cell, Math.PI, 1.5 * Math.PI],
            [cx, cy + this.cell, 1.5 * Math.PI, 2 * Math.PI]
        ]

        for (const [x0, y0, a0, a1] of corners) {
            this.ctx.beginPath()
            this.ctx.moveTo(x0, y0)
            this.ctx.arc(x0, y0, r, a0, a1)
            this.ctx.closePath()
            this.ctx.fill()
        }
    }

    /**
     * Draw a chess piece at a given square.
     * @param coord Board coordinate where the piece is drawn
     * @param t Piece type (pawn, rook, etc.)
     * @param c Piece color ('w' or 'b')
     */
    private drawPiece(coord: Coordinate, t: PieceType, c: 'w' | 'b') {
        const { cx, cy } = this.boardToScreen(coord)
        const centerX = cx + this.cell / 2
        const centerY = cy + this.cell / 2
        this.ctx.fillStyle = c === 'w' ? '#fff' : '#000'
        this.ctx.strokeStyle = c === 'w' ? '#000' : '#fff'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc(centerX, centerY, this.cell * 0.36, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.stroke()
        this.ctx.fillStyle = c === 'w' ? '#000' : '#fff'
        this.ctx.font = `${this.cell * 0.5}px sans-serif`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(t.toUpperCase(), centerX, centerY + 2)
    }
}
