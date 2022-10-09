import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Result } from "../enums/result";
import Button from "@mui/material/Button";
import { Evaluation } from "../types/evaluation";

export default function Board() {
  const apiEngine = "/api/engineEvaluation/";
  const apiDatabase = "/api/database";

  const [game, setGame] = useState(new Chess());
  const [prevGame, setPrevGame] = useState(new Chess());
  const [evaluation, setEvaluation] = useState<Evaluation>({
    evaluation: 0,
    moves: "",
  });
  const [solution, setSolution] = useState<Evaluation>({
    evaluation: 0,
    moves: "",
  });
  const [moveFilter, setMoveFilter] = useState("1. e4 e6 2. d4 d5");
  const [ratingRange, setRatingRange] = useState([0, 4000]);
  const [result, setResult] = useState(Result.IN_PROGRESS);
  const [isNewPosition, setIsNewPosition] = useState(true);
  const [lastMove, setLastMove] = useState("");

  const moveMessage = () =>
    "Find the best move for " + (game.turn() === "w" ? "white" : "black");

  const resultMessage = () =>
    result === Result.SUCCESS
      ? "Success!"
      : result === Result.PARTIAL_SUCCESS
      ? "Good move!"
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
        setLastMove("");
        setResult(Result.IN_PROGRESS);
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
          console.log(lastMove, solution.moves[0]);
          if (lastMove === solution.moves[0]) {
            console.log("hi1");
            setResult(Result.SUCCESS);
          } else if ((solution.evaluation as string)[0] === "#") {
            if ((solution.evaluation as string)[1] === "-") {
              if ((data["evaluation"] as string).substring(0, 2) === "#-") {
                console.log("hi2");
                setResult(Result.PARTIAL_SUCCESS);
              } else {
                console.log("hi3");
                setResult(Result.FAILURE);
              }
            } else {
              if (
                (data["evaluation"] as string)[0] === "#" &&
                (data["evaluation"] as string)[0] !== "-"
              ) {
                console.log("hi4");
                setResult(Result.PARTIAL_SUCCESS);
              } else {
                console.log("hi5");
                setResult(Result.FAILURE);
              }
            }
          } else if (
            (prevGame.turn() === 'b' &&
              solution.evaluation >= (data["evaluation"] as number) - 100) ||
            (prevGame.turn() === 'w' &&
              solution.evaluation <= (data["evaluation"] as number) + 100)
          ) {
            console.log(prevGame.turn(), solution.evaluation, ((data["evaluation"] as number) - 100), ((data["evaluation"] as number) + 100));
            console.log("hi6");
            setResult(Result.PARTIAL_SUCCESS);
          } else {
            console.log(prevGame.turn(), solution.evaluation, ((data["evaluation"] as number) - 100), ((data["evaluation"] as number) + 100));
            console.log("hi7");
            setResult(Result.FAILURE);
          }
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
        {result === Result.IN_PROGRESS ? moveMessage() : resultMessage()}
      </div>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      {result !== Result.IN_PROGRESS && (
        <div>
          <div>Best move: {solution.evaluation}</div>
          <div>Your move: {evaluation.evaluation}</div>
        </div>
      )}
      <Button
        variant="contained"
        disabled={result === Result.IN_PROGRESS}
        onClick={newPosition}
      >
        Next Puzzle
      </Button>
    </div>
  );
}
