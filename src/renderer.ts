import { BoardGrid, PieceType, MoveWithCard } from './game'

export class Renderer {
    private ctx: CanvasRenderingContext2D
    private cell: number

    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext('2d')!
        this.cell = canvas.width / 8
    }

    draw(board: BoardGrid, selected: { x: number, y: number } | null, legal: MoveWithCard[]) {
        this.drawBoard()
        if (selected) this.highlightSelected(selected.x, selected.y)

        for (const m of legal) {
            const target = board[m.move.y][m.move.x]
            if (target) {
                this.drawCaptureIndicator(m.move.x, m.move.y, !!m.card)
            } else {
                this.drawMoveIndicator(m.move.x, m.move.y, !!m.card)
            }
        }

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const p = board[y][x]
                if (p) this.drawPiece(x, y, p.t, p.c)
            }
        }
    }

    private drawBoard() {
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const light = (x + y) % 2 === 0
                this.ctx.fillStyle = light ? '#eeeed2' : '#769656'
                this.ctx.fillRect(x * this.cell, y * this.cell, this.cell, this.cell)
            }
        }
    }

    private highlightSelected(x: number, y: number) {
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)'
        this.ctx.fillRect(x * this.cell, y * this.cell, this.cell, this.cell)
    }

    private drawMoveIndicator(x: number, y: number, card: boolean) {
        const cx = (x + 0.5) * this.cell
        const cy = (y + 0.5) * this.cell
        this.ctx.beginPath()
        this.ctx.arc(cx, cy, this.cell * 0.12, 0, Math.PI * 2)
        this.ctx.fillStyle = card ? 'rgba(255, 215, 0, 0.7)' : 'rgba(0,0,0,0.15)'
        this.ctx.fill()
    }

    private drawCaptureIndicator(x: number, y: number, card: boolean) {
        const r = this.cell * 0.12
        const color = card ? 'rgba(255, 215, 0, 0.7)' : 'rgba(0,0,0,0.4)'
        this.ctx.fillStyle = color

        const corners = [
            [x * this.cell, y * this.cell, 0, 0.5 * Math.PI],
            [(x + 1) * this.cell, y * this.cell, 0.5 * Math.PI, Math.PI],
            [(x + 1) * this.cell, (y + 1) * this.cell, Math.PI, 1.5 * Math.PI],
            [x * this.cell, (y + 1) * this.cell, 1.5 * Math.PI, 2 * Math.PI]
        ]

        for (const [cx0, cy0, a0, a1] of corners) {
            this.ctx.beginPath()
            this.ctx.moveTo(cx0, cy0)
            this.ctx.arc(cx0, cy0, r, a0, a1)
            this.ctx.closePath()
            this.ctx.fill()
        }
    }

    private drawPiece(x: number, y: number, t: PieceType, c: 'w' | 'b') {
        this.ctx.fillStyle = c === 'w' ? '#fff' : '#000'
        this.ctx.strokeStyle = c === 'w' ? '#000' : '#fff'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc((x + 0.5) * this.cell, (y + 0.5) * this.cell, this.cell * 0.36, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.stroke()
        this.ctx.fillStyle = c === 'w' ? '#000' : '#fff'
        this.ctx.font = `${this.cell * 0.5}px sans-serif`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(this.symbolFor(t), (x + 0.5) * this.cell, (y + 0.5) * this.cell + 2)
    }

    private symbolFor(t: PieceType) {
        switch (t) {
            case 'p': return 'P'
            case 'r': return 'R'
            case 'n': return 'N'
            case 'b': return 'B'
            case 'q': return 'Q'
            case 'k': return 'K'
        }
    }
}
