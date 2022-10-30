import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Result } from "../enums/result";
import { Evaluation } from "../types/evaluation";
import { highlightMove, undoHighlight } from "../helpers/highlightMove";
import Button from "@mui/material/Button";
import "./board.css";
import { Checkbox } from "@mui/material";

export default function Board() {
  const apiEngine = "/api/engineEvaluation/";
  const apiDatabase = "/api/database";

  const [game, setGame] = useState<Chess>(new Chess());
  const [originalPosition, setOriginalPosition] = useState<string>("");
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
  const [nextMove, setNextMove] = useState<{
    sourceSquare: string;
    targetSquare: string;
  }>({ sourceSquare: "", targetSquare: "" });
  const [turn, setTurn] = useState<string>("");
  const [userGames, setUserGames] = useState<boolean>(false);

  const moveMessage = () =>
    "Find the best move for " + (turn === "w" ? "white" : "black");

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

  function processMove(sourceSquare: string, targetSquare: string) {
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
    fetch(
      `${apiDatabase}/randomFen?moveFilter=${moveFilter}&ratingRange=${ratingRange}`
    )
      .then((res) => res.json())
      .then((data) => {
        const newPosition: string = data["fen"];
        setTurn(new Chess(newPosition).turn() === "w" ? "b" : "w");
        setNextMove(data["nextMove"]);
        setOriginalPosition(data["fen"]);
        initialize(newPosition);
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
    if (lastMoveEls !== null && lastMove !== "") {
      lastMoveEls[0].style.backgroundColor = undoHighlight(
        lastMove.substring(0, 2)
      );
      lastMoveEls[1].style.backgroundColor = undoHighlight(
        lastMove.substring(2, 4)
      );
    }
  }

  function initialize(newPosition: string) {
    undoHighlights();
    const gameCopy: Chess = new Chess(newPosition);
    setGame(gameCopy);
    setIsNewPosition(true);
    setLastMove("");
    setResult(Result.IN_PROGRESS);
  }

  function retry() {
    initialize(originalPosition);
  }

  function updateEvaluation() {
    const fen = game.fen().replaceAll("/", "%5C");
    fetch(`${apiEngine}${fen}`)
      .then((res) => res.json())
      .then((data) => {
        if (isNewPosition) {
          setSolution({ evaluation: data["evaluation"], moves: data["moves"] });
          setIsNewPosition(false);
        } else if (lastMove !== "") {
          if (lastMove === solution.moves[0]) {
            setResult(Result.SUCCESS);
          } else if ((solution.evaluation as string)[0] === "#") {
            if ((solution.evaluation as string)[1] === "-") {
              if ((data["evaluation"] as string).substring(0, 2) === "#-") {
                setResult(Result.PARTIAL_SUCCESS);
              } else {
                setResult(Result.FAILURE);
              }
            } else {
              if (
                (data["evaluation"] as string)[0] === "#" &&
                (data["evaluation"] as string)[0] !== "-"
              ) {
                setResult(Result.PARTIAL_SUCCESS);
              } else {
                setResult(Result.FAILURE);
              }
            }
          } else if (
            (turn === "b" &&
              solution.evaluation >= (data["evaluation"] as number) - 100) ||
            (turn === "w" &&
              solution.evaluation <= (data["evaluation"] as number) + 100)
          ) {
            setResult(Result.PARTIAL_SUCCESS);
          } else {
            setResult(Result.FAILURE);
          }
        }
        setEvaluation({ evaluation: data["evaluation"], moves: data["moves"] });
      });
  }

  useEffect(() => {
    if (game.fen() === originalPosition) {
      setTimeout(() => {
        processMove(nextMove["sourceSquare"], nextMove["targetSquare"]);
      }, 500);
    }
    else if (originalPosition !== '') {
      updateEvaluation();
    }
  }, [game]);

  return (
    <div>
      <div>
        {result === Result.IN_PROGRESS ? moveMessage() : resultMessage()}
      </div>
      <Chessboard
        position={game.fen()}
        onPieceDrop={processMove}
        arePiecesDraggable={result === Result.IN_PROGRESS}
        boardOrientation={turn === "w" ? "white" : "black"}
        snapToCursor={true}
      />
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
        disabled={
          !(result === Result.FAILURE || result === Result.PARTIAL_SUCCESS)
        }
        onClick={() => retry()}
      >
        Retry
      </Button>
      <Checkbox checked={userGames} onChange={() => setUserGames(!userGames)} />
    </div>
  );
}
