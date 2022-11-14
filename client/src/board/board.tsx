import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Result, StudyResult } from "../enums/result";
import { Evaluation, FenData, MoveUci, StudyData } from "../types/chess";
import { highlightMove, undoHighlight } from "../helpers/highlightMove";
import "./board.css";
import { Mode } from "../enums/mode";

export interface BoardHandler {
  retry: () => void;
  newPosition: () => void;
}

interface BoardProps {
  mode: Mode;
  result: Result;
  setResult: React.Dispatch<React.SetStateAction<Result>>;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
  setEvaluation: React.Dispatch<React.SetStateAction<Evaluation>>;
  solution: Evaluation;
  setSolution: React.Dispatch<React.SetStateAction<Evaluation>>;
  setMovePlayed: React.Dispatch<React.SetStateAction<string>>;
  turn: string;
  setTurn: React.Dispatch<React.SetStateAction<string>>;
  userName: string;
  studyId: string;
  studyResult: StudyResult;
  setStudyResult: React.Dispatch<React.SetStateAction<StudyResult>>;
  setStudySolution: React.Dispatch<React.SetStateAction<string>>;
  setStudyMistake: React.Dispatch<React.SetStateAction<boolean>>;
}

const Board = forwardRef(
  (
    {
      mode,
      result,
      setResult,
      setUrl,
      setEvaluation,
      solution,
      setSolution,
      setMovePlayed,
      turn,
      setTurn,
      userName,
      studyId,
      studyResult,
      setStudyResult,
      setStudySolution,
      setStudyMistake,
    }: BoardProps,
    ref
  ) => {
    useImperativeHandle(ref, () => ({
      retry() {
        setDidRetry(true);
        initialize(originalPosition);
      },
      async newPosition() {
        if (mode === Mode.STUDY) {
          let currStudyData!: StudyData;
          if (!studyData.length) {
            await fetch(`${apiLichess}/studyPgns?studyId=${studyId}`)
              .then((res) => res.json())
              .then((data) => {
                setStudyData(data["studyPgns"]);
                console.log(
                  Math.floor(Math.random() * (data["studyPgns"].length - 1)),
                  data["studyPgns"].length
                );
                currStudyData =
                  data["studyPgns"][
                    Math.floor(Math.random() * (data["studyPgns"].length - 1))
                  ];
              });
          } else {
            currStudyData =
              studyData[Math.floor(Math.random() * (studyData.length - 1))];
          }
          setStudyPgn(currStudyData.moves);
          setTurn(currStudyData.turn);
          setStudyPgnIndex(0);
          if (currStudyData.turn) {
            updateStudy();
          }
          setStudyResult(StudyResult.IN_PROGRESS);
          initialize(new Chess().fen());
          console.log(currStudyData);
        } else {
          let fenData!: FenData;
          if (mode === Mode.REDO) {
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
        }
      },
    }));

    const apiEngine = "/api/engineEvaluation/";
    const apiDatabase = "/api/database";
    const apiLichess = "/api/lichess";

    const [game, setGame] = useState<Chess>(new Chess());
    const [prevGame, setPrevGame] = useState<Chess>(new Chess());
    const [prevPrevGame, setPrevPrevGame] = useState<Chess>(new Chess());
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
    const [redoFens, setRedoFens] = useState<FenData[]>([]);
    const [mostRecentGames, setMostRecentGames] = useState<number>(20);
    const [didRetry, setDidRetry] = useState<boolean>(false);
    const [studyData, setStudyData] = useState<StudyData[]>([]);
    const [studyPgn, setStudyPgn] = useState<MoveUci[]>();
    const [studyPgnIndex, setStudyPgnIndex] = useState<number>(0);

    function makeMove(move: any) {
      const gameCopy: Chess = new Chess(game.fen());
      const result = gameCopy.move(move);
      setLastMove(move.from + move.to);
      setPrevPrevGame(prevGame);
      setPrevGame(game);
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

      if (mode === Mode.STUDY) {
        setStudyPgnIndex(studyPgnIndex + 1);
      }

      undoHighlights();
      highlightSquares(sourceSquare, targetSquare);

      return true;
    }

    const getStudySolution = () => {
      if (studyPgn && studyPgnIndex < studyPgn.length) {
        return (
          studyPgn[studyPgnIndex].sourceSquare +
          studyPgn[studyPgnIndex].targetSquare
        );
      } else {
        return "";
      }
    };

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
      setPrevGame(gameCopy);
      setPrevPrevGame(gameCopy);
      setIsNewPosition(true);
      setLastMove("");
      setResult(Result.IN_PROGRESS);
    }

    const isBoardEnabled = () => {
      return (
        (mode !== Mode.STUDY && result === Result.IN_PROGRESS) ||
        (mode === Mode.STUDY && studyResult === StudyResult.IN_PROGRESS)
      );
    };

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
      if (studyResult === StudyResult.INCORRECT) {
        setStudyMistake(true);
      } else if (
        studyResult === StudyResult.GOOD_MOVE ||
        studyResult === StudyResult.SUCCESS
      ) {
        setStudyMistake(false);
      }
    }, [studyResult]);

    useEffect(() => {
      if (mode !== Mode.STUDY) {
        if (game.fen() === originalPosition) {
          // if (didRetry) {
          // }
          setTimeout(() => {
            processMove(nextMove["sourceSquare"], nextMove["targetSquare"]);
          }, 250);
        } else if (originalPosition !== "") {
          updateEvaluation();
        }
      }
    }, [game]);

    useEffect(() => {
      updateStudy();
    }, [studyPgnIndex, studyPgn]);

    function updateStudy() {
      console.log(mode, studyPgn, studyPgnIndex);
      if (
        mode === Mode.STUDY &&
        studyPgn &&
        studyResult !== StudyResult.SUCCESS
      ) {
        setStudySolution(getStudySolution());
        if (studyPgnIndex % 2 === (turn === "w" ? 1 : 0)) {
          if (studyResult !== StudyResult.INCORRECT) {
            if (studyPgnIndex === 0) {
              setTimeout(() => {
                processMove(
                  studyPgn[studyPgnIndex].sourceSquare,
                  studyPgn[studyPgnIndex].targetSquare
                );
                setStudyResult(StudyResult.IN_PROGRESS);
              }, 1000);
            } else if (
              lastMove.substring(0, 2) ===
                studyPgn[studyPgnIndex - 1].sourceSquare &&
              lastMove.substring(2, 4) ===
                studyPgn[studyPgnIndex - 1].targetSquare
            ) {
              if (studyPgnIndex === studyPgn.length) {
                setStudyResult(StudyResult.SUCCESS);
                setUrl("https://lichess.org/analysis/" + game.fen());
              } else {
                setStudyResult(StudyResult.GOOD_MOVE);
                setTimeout(() => {
                  processMove(
                    studyPgn[studyPgnIndex].sourceSquare,
                    studyPgn[studyPgnIndex].targetSquare
                  );
                  setStudyResult(StudyResult.IN_PROGRESS);
                }, 1000);
              }
            } else {
              setStudyResult(StudyResult.INCORRECT);
              setTimeout(() => {
                setGame(prevPrevGame);
                undoHighlights();
                setStudyPgnIndex(Math.max(studyPgnIndex - 2, 0));
              }, 1000);
              if (prevPrevGame.fen() === new Chess().fen()) {
                setStudyResult(StudyResult.IN_PROGRESS);
              }
            }
          } else {
            console.log("hi");
            processMove(
              studyPgn[studyPgnIndex].sourceSquare,
              studyPgn[studyPgnIndex].targetSquare
            );
            setStudyResult(StudyResult.IN_PROGRESS);
          }
        } else if (studyPgnIndex === studyPgn.length) {
          setStudyResult(StudyResult.SUCCESS);
          setUrl("https://lichess.org/analysis/" + game.fen());
        }
      }
    }

    return (
      <div>
        <Chessboard
          position={game.fen()}
          onPieceDrop={processMove}
          arePiecesDraggable={isBoardEnabled()}
          boardOrientation={turn === "w" ? "white" : "black"}
          snapToCursor={true}
          boardWidth={700}
        />
      </div>
    );
  }
);

export default Board;
