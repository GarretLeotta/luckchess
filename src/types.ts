import { Coordinate } from "./coordinate.js";

export type Color = 'w' | 'b';
export type PieceType = string;

export interface Piece {
    type: PieceType
    position: Coordinate
    color: Color
};

export type Card = {
    pieceType: PieceType
    movesAs: PieceType
    used: boolean
};

export interface Index {
    x: number
    y: number
};

export type Move =
    | NormalMove
    | CardMove
    | DrawMove

export type NormalMove = {
    type: 'normal'
    piece: Piece
    from: Coordinate
    to: Coordinate
    captured?: Piece
}

export type CardMove = {
    type: 'card'
    piece: Piece
    from: Coordinate
    to: Coordinate
    card: Card
    captured?: Piece
}

export type DrawMove = {
    type: 'draw'
}
