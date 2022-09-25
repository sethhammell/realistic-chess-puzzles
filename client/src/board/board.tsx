import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Result } from "../enums/result";

export default function Board() {
  const apiEngine = "/api/engineEvaluation/";
  const apiDatabase = "/api/database";

  const [game, setGame] = useState(new Chess());
  const [prevGame, setPrevGame] = useState(new Chess());
  const [evaluation, setEvaluation] = useState({ evaluation: 0, moves: "" });
  const [solution, setSolution] = useState({ evaluation: 0, moves: "" });
  const [moveFilter, setMoveFilter] = useState("");
  const [ratingRange, setRatingRange] = useState([0, 4000]);
  const [result, setResult] = useState(Result.INPROGRESS);
  const [isNewPosition, setIsNewPosition] = useState(true);
  const [lastMove, setLastMove] = useState("");

  const moveMessage = () =>
    "Find the best move for " + (game.turn() === "w" ? "white" : "black");

  const resultMessage = () =>
    result === Result.SUCCESS
      ? "Success!"
      : "That's not right, try something else.";

  function makeMove(move: any) {
    const gameCopy: Chess = new Chess(game.fen());
    const result = gameCopy.move(move);
    setLastMove(move.from + move.to);
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
        setIsNewPosition(true);
        setResult(Result.INPROGRESS);
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
        console.log(isNewPosition, lastMove);
        if (isNewPosition) {
          setSolution({ evaluation: data["evaluation"], moves: data["moves"] });
          setIsNewPosition(false);
        } else if (lastMove !== "") {
          console.log(lastMove, solution.moves[0])
          lastMove === solution.moves[0]
            ? setResult(Result.SUCCESS)
            : setResult(Result.FAILURE);
        }
        setEvaluation({ evaluation: data["evaluation"], moves: data["moves"] });
      });
  }

  useEffect(() => {
    if (game.fen() !== prevGame.fen()) {
      updateEvaluation();
      setPrevGame(game);
    }
  }, [game]);

  return (
    <div>
      <div>
        {result === Result.INPROGRESS ? moveMessage() : resultMessage()}
      </div>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      {result !== Result.INPROGRESS && (
        <div>
          <div>Best move: {solution.evaluation}</div>
          <div>Your move: {evaluation.evaluation}</div>
        </div>
      )}
    </div>
  );
}
