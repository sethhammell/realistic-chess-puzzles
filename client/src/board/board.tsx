import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Result } from "../enums/result";
import { Evaluation, FenData, MoveUci } from "../types/chess";
import { highlightMove, undoHighlight } from "../helpers/highlightMove";
import Button from "@mui/material/Button";
import "./board.css";

export interface BoardHandler {
  retry: () => void;
  newPosition: () => void;
}

interface BoardProps {
  userGames: boolean;
  result: Result;
  setResult: React.Dispatch<React.SetStateAction<Result>>;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  setEvaluation: React.Dispatch<React.SetStateAction<Evaluation>>;
  solution: Evaluation;
  setSolution: React.Dispatch<React.SetStateAction<Evaluation>>;
  setMovePlayed: React.Dispatch<React.SetStateAction<string>>;
  turn: string;
  setTurn: React.Dispatch<React.SetStateAction<string>>;
}

const Board = forwardRef(
  (
    {
      userGames,
      result,
      setResult,
      setUrl,
      setEvaluation,
      solution,
      setSolution,
      setMovePlayed,
      turn,
      setTurn,
    }: BoardProps,
    ref
  ) => {
    useImperativeHandle(ref, () => ({
      retry() {
        setDidRetry(true);
        initialize(originalPosition);
      },
      async newPosition() {
        let fenData!: FenData;
        if (userGames) {
          console.log(redoFens.length);
          if (!redoFens.length) {
            await fetch(
              `${apiLichess}/randomLichessGame?user=${userName}&max=${mostRecentGames}`
            )
              .then((res) => res.json())
              .then((data) => {
                setRedoFens(data["redoFens"].slice(1));
                fenData = data["redoFens"][0];
                console.log(data["redoFens"]);
              });
          }
          console.log(redoFens);
          if (!!redoFens && redoFens.length) {
            fenData = redoFens[0];
            setRedoFens(redoFens.slice(1));
          }
        } else {
          await fetch(
            `${apiDatabase}/randomFen?moveFilter=${moveFilter}&ratingRange=${ratingRange}`
          )
            .then((res) => res.json())
            .then((data) => {
              console.log(data);
              fenData = data;
              fenData.movePlayed = "";
            });
        }
        const newPosition: string = fenData.fen;
        setTurn(new Chess(newPosition).turn() === "w" ? "b" : "w");
        setNextMove(fenData.nextMove);
        setMovePlayed(fenData.movePlayed);
        setOriginalPosition(fenData.fen);
        initialize(newPosition);
        setUrl(fenData.url);
        setDidRetry(false);
      },
    }));

    const apiEngine = "/api/engineEvaluation/";
    const apiDatabase = "/api/database";
    const apiLichess = "/api/lichess";

    const [game, setGame] = useState<Chess>(new Chess());
    const [originalPosition, setOriginalPosition] = useState<string>("");
    const [moveFilter, setMoveFilter] = useState<string>("1. e4 e6 2. d4 d5");
    const [ratingRange, setRatingRange] = useState<[number, number]>([0, 4000]);
    const [isNewPosition, setIsNewPosition] = useState<boolean>(true);
    const [lastMove, setLastMove] = useState<string>("");
    const [lastMoveEls, setLastMoveEls] = useState<
      null | [HTMLElement, HTMLElement]
    >(null);
    const [nextMove, setNextMove] = useState<MoveUci>({
      sourceSquare: "",
      targetSquare: "",
    });
    const [userName, setUserName] = useState<string>("Helix487");
    const [redoFens, setRedoFens] = useState<FenData[]>([]);
    const [mostRecentGames, setMostRecentGames] = useState<number>(20);
    const [didRetry, setDidRetry] = useState<boolean>(false);

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

    function updateEvaluation() {
      const fen = game.fen().replaceAll("/", "%5C");
      fetch(`${apiEngine}${fen}`)
        .then((res) => res.json())
        .then((data) => {
          if (isNewPosition) {
            setSolution({
              evaluation: data["evaluation"],
              moves: data["moves"],
            });
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
          setEvaluation({
            evaluation: data["evaluation"],
            moves: data["moves"],
          });
        });
    }

    useEffect(() => {
      if (game.fen() === originalPosition) {
        if (didRetry) {
        }
        setTimeout(() => {
          processMove(nextMove["sourceSquare"], nextMove["targetSquare"]);
        }, 250);
      } else if (originalPosition !== "") {
        updateEvaluation();
      }
    }, [game]);

    return (
      <div>
        <Chessboard
          position={game.fen()}
          onPieceDrop={processMove}
          arePiecesDraggable={result === Result.IN_PROGRESS}
          boardOrientation={turn === "w" ? "white" : "black"}
          snapToCursor={true}
          boardWidth={800}
        />
      </div>
    );
  }
);

export default Board;
