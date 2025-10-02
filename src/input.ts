import { inBounds } from './game.js'

export class Input {
    constructor(
        private canvas: HTMLCanvasElement,
        private onClick: (x: number, y: number) => void
    ) {
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect()
            const tileW = rect.width / 8
            const tileH = rect.height / 8
            const cx = Math.floor((e.clientX - rect.left) / tileW)
            const cy = Math.floor((e.clientY - rect.top) / tileH)
            if (inBounds({ x: cx, y: cy })) onClick(cx, cy)
        })
    }
}
