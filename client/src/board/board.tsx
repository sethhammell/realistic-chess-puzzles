import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function Board() {
  const api = "/api/engineEvaluation/";

  const [game, setGame] = useState(new Chess());
  const [evaluation, setEvaluation] = useState(0);

  function makeMove(move: any) {
    const gameCopy: Chess = new Chess(game.fen());
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result;
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    let move = makeMove({
      from: sourceSquare,
      to: targetSquare,
    });

    if (move === null) {
      move = makeMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
    }

    if (move === null) return false;

    return true;
  }

  function updateEvaluation() {
    const fen = game.fen().replaceAll('/', "%5C");
    console.log(fen);
    fetch(`${api}${fen}`)
      .then((res) => res.json())
      .then((data) => {
        setEvaluation(data["evaluation"])
      });
  }

  useEffect(() => {
    updateEvaluation();
  }, [game])

  return (
    <div>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      <div>{evaluation}</div>
    </div>
  );
}
