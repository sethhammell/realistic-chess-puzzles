import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Board, { BoardHandler } from "../board/board";
import { Mode } from "../enums/mode";
import { Result, StudyResult } from "../enums/result";
import { Evaluation } from "../types/chess";
import "./home.css";

export default function Home() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [result, setResult] = useState<Result>(Result.IN_PROGRESS);
  const [url, setUrl] = useState<string>("");
  const [evaluation, setEvaluation] = useState<Evaluation>({
    evaluation: 0,
    moves: [],
  });
  const [solution, setSolution] = useState<Evaluation>({
    evaluation: 0,
    moves: [],
  });
  const [movePlayed, setMovePlayed] = useState<string>("");
  const [turn, setTurn] = useState<string>("");
  const [userName, setUserName] = useState<string>("usernbame1245");
  const [studyId, setStudyId] = useState<string>("f6UavjzS");
  const [chapterFilter, setChapterFilter] = useState<string>(
    "e4 e5 (schrantz v.)"
  );
  const [studyResult, setStudyResult] = useState<StudyResult>(
    StudyResult.IN_PROGRESS
  );
  const [studyMistake, setStudyMistake] = useState<boolean>(false);
  const [studySolution, setStudySolution] = useState<string>("");
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [mistake, setMistake] = useState<boolean>(false);
  const [correctPositions, setCorrectPositions] = useState<number>(0);
  const [totalPositions, setTotalPositions] = useState<number>(0);
  const boardRef = useRef<BoardHandler>(null);

  useEffect(() => {
    console.log(mode);
    if (mode !== null) {
      boardRef.current?.newPosition();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === Mode.STUDY) {
      switch (studyResult) {
        case StudyResult.INCORRECT:
          setMistake(true);
          break;
        case StudyResult.SUCCESS:
          if (!mistake) setCorrectPositions(correctPositions + 1);
          setTotalPositions(totalPositions + 1);
          setMistake(false);
          break;
      }
    }
  }, [studyResult]);

  const moveMessage = () => {
    if (mode === Mode.STUDY) {
      switch (studyResult) {
        case StudyResult.GOOD_MOVE:
          return "Good move";
        case StudyResult.IN_PROGRESS:
          return "What would you play in this position?";
        case StudyResult.INCORRECT:
          // setMistake(true);
          return "Retry";
        case StudyResult.SUCCESS:
          // if (!mistake) setCorrectPositions(correctPositions + 1);
          // setTotalPositions(totalPositions + 1);
          // setMistake(false);
          return "Congratulations! You completed this lesson.";
      }
    } else if (turn !== "") {
      return "Find the best move for " + (turn === "w" ? "white" : "black");
    } else {
      return "";
    }
  };

  const nextMessage = () => {
    switch (mode) {
      case Mode.PUZZLES:
        return "Next Puzzle";
      case Mode.REDO:
        return "Next Position";
      case Mode.STUDY:
        return "Next Lesson";
      default:
        return "Next Position";
    }
  };

  const resultMessage = () =>
    result === Result.SUCCESS
      ? "Success!"
      : result === Result.PARTIAL_SUCCESS
      ? "Good move!"
      : "That's not right, try something else.";

  const isDisabled = () => {
    return (
      (mode !== Mode.STUDY && result === Result.IN_PROGRESS) ||
      (mode === Mode.STUDY && studyResult !== StudyResult.SUCCESS)
    );
  };

  const isDisabledUrl = () => {
    return mode !== Mode.STUDY && result === Result.IN_PROGRESS;
  };

  const showSolutionDisabled = () => {
    return (
      (mode !== Mode.STUDY && result === Result.IN_PROGRESS) ||
      (mode === Mode.STUDY && !studyMistake)
    );
  };

  const displaySolution = () => {
    if (mode === Mode.STUDY) {
      return studySolution;
    } else {
      return solution.moves[0];
    }
  };

  useEffect(() => {
    setShowSolution(false);
  }, [studySolution, solution]);

  let filters;
  if (mode === Mode.PUZZLES) {
    filters = <TextField variant="standard" label="Move Filter"></TextField>;
  } else if (mode === Mode.REDO) {
    filters = (
      <>
        <TextField variant="standard" label="Lichess Username"></TextField>
        {/* add checkboxes for rapid blitz bullet */}
      </>
    );
  } else if (mode === Mode.STUDY) {
    filters = (
      <>
        <TextField variant="standard" label="Move Filter"></TextField>
        {/* add white, black, both radio buttons */}
      </>
    );
  }

  return (
    <div className="home">
      <div className="homeLeft" />
      <div className="homeCenter">
        <div className="message">
          {result === Result.IN_PROGRESS ? moveMessage() : resultMessage()}
        </div>
        <div className="board">
          <Board
            ref={boardRef}
            mode={mode}
            result={result}
            setResult={setResult}
            setUrl={setUrl}
            setEvaluation={setEvaluation}
            solution={solution}
            setSolution={setSolution}
            setMovePlayed={setMovePlayed}
            turn={turn}
            setTurn={setTurn}
            userName={userName}
            studyId={studyId}
            studyResult={studyResult}
            chapterFilter={chapterFilter}
            setStudyResult={setStudyResult}
            setStudyMistake={setStudyMistake}
            setStudySolution={setStudySolution}
          />
        </div>
        <div className="homeButtons">
          {movePlayed !== "" && <div>You played {movePlayed} in the game</div>}
          <Button
            variant="contained"
            disabled={isDisabled()}
            onClick={boardRef.current?.newPosition}
          >
            {nextMessage()}
          </Button>
          <Button
            variant="contained"
            disabled={isDisabledUrl()}
            href={url}
            onClick={() => console.log(url)}
            target="_blank"
          >
            Analyze on Lichess
          </Button>
          <Button
            variant="contained"
            disabled={
              !(result === Result.FAILURE || result === Result.PARTIAL_SUCCESS)
            }
            onClick={() => boardRef.current?.retry()}
          >
            Retry
          </Button>
          <Button
            variant="contained"
            disabled={showSolutionDisabled() || showSolution}
            onClick={() => setShowSolution(true)}
          >
            Show Solution
          </Button>
        </div>
        <div className="moveText">
          {result !== Result.IN_PROGRESS && (
            <div className="moveEvaluation">
              <div>
                Best move
                {result !== Result.FAILURE
                  ? " (" + solution.moves[0] + ")"
                  : ""}
                : {solution.evaluation}
              </div>
              <div>Your move: {evaluation.evaluation}</div>
            </div>
          )}
          {showSolution && <div>{displaySolution()}</div>}
        </div>
      </div>
      <div className="homeRight">
        <div className="accuracy">{`Accuracy: ${correctPositions} / ${totalPositions} = ${
          (Number.isNaN(correctPositions / totalPositions)
            ? 0
            : Math.round((correctPositions / totalPositions) * 100)) + "%"
        }`}</div>
        <div className="modes">
          <FormControl>
            <FormLabel>Mode</FormLabel>
            <RadioGroup
              value={mode}
              onChange={(e) => {
                setMode(parseInt((e.target as HTMLInputElement).value) as Mode);
              }}
            >
              <FormControlLabel
                value={Mode.PUZZLES}
                control={<Radio />}
                label="Puzzles"
              />
              <FormControlLabel
                value={Mode.REDO}
                control={<Radio />}
                label="Redo Mistakes"
              />
              <FormControlLabel
                value={Mode.STUDY}
                control={<Radio />}
                label="Study"
              />
            </RadioGroup>
          </FormControl>
        </div>
        <div className="filters">{filters}</div>
      </div>
      {/* {mode === Mode.STUDY && 
      <Checkbox checked={userGames} onChange={() => setUserGames(!userGames)} />} */}
    </div>
  );
}
