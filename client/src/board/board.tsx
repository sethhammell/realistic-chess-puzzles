import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function Board() {
  const apiEngine = "/api/engineEvaluation/";
  const apiDatabase = "/api/database";

  const [game, setGame] = useState(new Chess());
  const [evaluation, setEvaluation] = useState(0);
  const [moveFilter, setMoveFilter] = useState("");
  const [ratingRange, setRatingRange] = useState([0, 4000]);

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

  function newPosition() {
    const fen = game.fen().replaceAll("/", "%5C");
    console.log(fen);
    fetch(
      `${apiDatabase}/randomFen?moveFilter=${moveFilter}&ratingRange=${ratingRange}`
    )
      .then((res) => res.json())
      .then((data) => {
        const newPosition: Chess = new Chess(data["fen"]);
        setGame(newPosition);
      });
  }

  useEffect(() => {
    newPosition();
  }, []);

  function updateEvaluation() {
    const fen = game.fen().replaceAll("/", "%5C");
    console.log(fen);
    fetch(`${apiEngine}${fen}`)
      .then((res) => res.json())
      .then((data) => {
        setEvaluation(data["evaluation"]);
      });
  }

  useEffect(() => {
    updateEvaluation();
  }, [game]);

  return (
    <div>
      <div>Find the best move for {game.turn() == 'w' ? "white" : "black"}</div>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      <div>{evaluation}</div>
    </div>
  );
}
