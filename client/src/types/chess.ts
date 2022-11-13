export interface Evaluation {
  evaluation: string | number;
  moves: string[];
}

export interface FenData {
  fen: string;
  nextMove: MoveUci;
  movePlayed: string;
  url: string;
}

export interface MoveUci {
  sourceSquare: string;
  targetSquare: string;
}

export interface StudyData {
  turn: string;
  moves: MoveUci[];
}
