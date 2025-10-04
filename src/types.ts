export type Color = 'w' | 'b';
export type PieceType = string;

export interface Piece {
    t: PieceType
    c: Color
};

export type BoardGrid = (Piece | null)[][];

export type Card = {
    pieceType: PieceType
    movesAs: PieceType
    used: boolean
};

export interface Coordinate {
    x: number
    y: number
};