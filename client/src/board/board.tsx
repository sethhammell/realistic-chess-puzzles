import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Result } from "../enums/result";
import Button from "@mui/material/Button";
import { Evaluation } from "../types/evaluation";
import { highlightMove, undoHighlight } from "../helpers/highlightMove";
import "./board.css";

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
  const [moveFilter, setMoveFilter] = useState<string>("1. e4 e6 2. d4 d5");
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 4000]);
  const [result, setResult] = useState<Result>(Result.IN_PROGRESS);
  const [isNewPosition, setIsNewPosition] = useState<boolean>(true);
  const [lastMove, setLastMove] = useState<string>("");
  const [lastMoveEls, setLastMoveEls] = useState<
    null | [HTMLElement, HTMLElement]
  >(null);
  const [url, setUrl] = useState<string>("");

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
    setPrevGame(game);
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

    undoHighlights();
    highlightSquares(sourceSquare, targetSquare);

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
        initialize(newPosition);
        setResult(Result.IN_PROGRESS);
        setUrl(data["url"]);
      });
  }

  useEffect(() => {
    newPosition();
  }, []);

  function highlightSquares(sourceSquare: string, targetSquare: string) {
    const sourceSquareEl = document.querySelector(
      `[data-square="${sourceSquare}"]`
    ) as HTMLElement;
    sourceSquareEl.style.backgroundColor = highlightMove(sourceSquare);

    const targetSquareEl = document.querySelector(
      `[data-square="${targetSquare}"]`
    ) as HTMLElement;
    targetSquareEl.style.backgroundColor = highlightMove(targetSquare);

    setLastMoveEls([sourceSquareEl, targetSquareEl]);
  }

  function undoHighlights() {
    console.log(lastMoveEls, lastMove);
    if (lastMoveEls !== null && lastMove !== "") {
      lastMoveEls[0].style.backgroundColor = undoHighlight(lastMove.substring(0, 2));
      lastMoveEls[1].style.backgroundColor = undoHighlight(lastMove.substring(2, 4));
    }
  }

  function initialize(newPosition: Chess) {
    undoHighlights();
    setGame(newPosition);
    setIsNewPosition(true);
    setLastMove("");
  }

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
            (prevGame.turn() === "b" &&
              solution.evaluation >= (data["evaluation"] as number) - 100) ||
            (prevGame.turn() === "w" &&
              solution.evaluation <= (data["evaluation"] as number) + 100)
          ) {
            console.log(
              prevGame.turn(),
              solution.evaluation,
              (data["evaluation"] as number) - 100,
              (data["evaluation"] as number) + 100
            );
            console.log("hi6");
            setResult(Result.PARTIAL_SUCCESS);
          } else {
            console.log(
              prevGame.turn(),
              solution.evaluation,
              (data["evaluation"] as number) - 100,
              (data["evaluation"] as number) + 100
            );
            console.log("hi7");
            setResult(Result.FAILURE);
          }
        }
        setEvaluation({ evaluation: data["evaluation"], moves: data["moves"] });
      });
  }

  useEffect(() => {
    console.log("hi");
    if (game.fen() !== prevGame.fen()) {
      updateEvaluation();
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
      <Button
        variant="contained"
        disabled={result === Result.IN_PROGRESS}
        href={url}
        target="_blank"
      >
        Analyze on Lichess
      </Button>
      <Button
        variant="contained"
        disabled={lastMove === ""}
        onClick={() => initialize(prevGame)}
      >
        Retry
      </Button>
    </div>
  );
}
