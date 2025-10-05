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
