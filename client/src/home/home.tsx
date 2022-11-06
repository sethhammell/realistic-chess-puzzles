import { Button, Checkbox } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import Board, { BoardHandler } from "../board/board";
import { Result } from "../enums/result";
import { Evaluation } from "../types/chess";
import "./home.css";

export default function Home() {
  const [userGames, setUserGames] = useState<boolean>(false);
  const [result, setResult] = useState<Result>(Result.IN_PROGRESS);
  const [url, setUrl] = useState<string>("");
  const [evaluation, setEvaluation] = useState<Evaluation>({
    evaluation: 0,
    moves: "",
  });
  const [solution, setSolution] = useState<Evaluation>({
    evaluation: 0,
    moves: "",
  });
  const [movePlayed, setMovePlayed] = useState<string>("");
  const [turn, setTurn] = useState<string>("");
  const boardRef = useRef<BoardHandler>(null);

  useEffect(() => {
    boardRef.current?.newPosition();
  }, [userGames]);

  const moveMessage = () =>
    "Find the best move for " + (turn === "w" ? "white" : "black");

  const resultMessage = () =>
    result === Result.SUCCESS
      ? "Success!"
      : result === Result.PARTIAL_SUCCESS
      ? "Good move!"
      : "That's not right, try something else.";

  return (
    <div>
      <div>
        {result === Result.IN_PROGRESS ? moveMessage() : resultMessage()}
      </div>
      <div className="board">
        <Board
          ref={boardRef}
          userGames={userGames}
          result={result}
          setResult={setResult}
          setUrl={setUrl}
          setEvaluation={setEvaluation}
          solution={solution}
          setSolution={setSolution}
          setMovePlayed={setMovePlayed}
          turn={turn}
          setTurn={setTurn}
        />
      </div>
      {result !== Result.IN_PROGRESS && (
        <div>
          <div>Best move: {solution.evaluation}</div>
          <div>Your move: {evaluation.evaluation}</div>
        </div>
      )}
      {movePlayed !== "" && <div>You played {movePlayed} in the game</div>}
      <Button
        variant="contained"
        disabled={result === Result.IN_PROGRESS}
        onClick={boardRef.current?.newPosition}
      >
        Next Puzzle
      </Button>
      <Button
        variant="contained"
        disabled={result === Result.IN_PROGRESS}
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
      <Checkbox checked={userGames} onChange={() => setUserGames(!userGames)} />
    </div>
  );
}
