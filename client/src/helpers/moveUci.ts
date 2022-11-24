import { MoveUci } from "../types/chess";

export function combineMoveUci(moveUci: MoveUci) {
  return moveUci.sourceSquare + moveUci.targetSquare;
}
