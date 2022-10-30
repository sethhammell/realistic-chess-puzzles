import requests
from evaluate import evaluation
from pgnParser import parsePgns
import chess.pgn
import random
from accuracy import computeAccuracy
import asyncio
import io

async def fetchLichessGames(user, max):
    response = requests.get("https://lichess.org/api/games/user/" + user + "?max=" + str(max) + "&pgnInJson=true&rated=true")
    pgn_text = response.text.split('\n')
    for i in range(len(pgn_text)):
        pgn_text[i] += '\n'
        
    pgns = parsePgns(pgn_text, True)

    randomPgnIndex = random.randint(0, len(pgns) - 1)
    randomPgnData = pgns[randomPgnIndex]
    randomPgn = randomPgnData["moves"]

    isWhite = randomPgnData["white"] == user
    
    currGame = chess.pgn.read_game(io.StringIO(randomPgn))
    prevGame = chess.pgn.read_game(io.StringIO(randomPgn))

    currBoard = currGame.board()
    prevBoard = prevGame.board()
    mainlineMoves = currGame.mainline_moves()
    moves = []
    for m in mainlineMoves:
        moves.append(m)

    c = 0
    p = 0

    if isWhite:
        currBoard.push(moves[c])
        prevBoard.push(moves[p])
        c += 1
        p += 1

    currBoard.push(moves[c])
    c += 1

    redo_fens = []
    while c < len(moves) - 1:
        evalBeforeResult = await evaluation(currBoard.fen(), 0.1)
        evalBefore = evalBeforeResult["evaluation"]
        currBoard.push(moves[c])
        c += 1
        evalAfterResult = await evaluation(currBoard.fen(), 0.1)
        evalAfter = evalAfterResult["evaluation"]
        accuracyPercent = computeAccuracy(evalBefore, evalAfter, isWhite)

        print(accuracyPercent)
        if (accuracyPercent < 50):
            nextMove = moves[p].uci()
            nextMoveUci = { "sourceSquare": nextMove[:-2], "targetSquare": nextMove[2:] }

            prevBoardFen = prevBoard.fen()

            prevBoard.push(moves[p])
            p += 1

            movePlayed = moves[p].uci()
            movePlayedUci = { "sourceSquare": movePlayed[:-2], "targetSquare": movePlayed[2:] }

            redo_fens.append({"fen": prevBoardFen, "nextMove": nextMoveUci, "movePlayed": movePlayedUci, "url": randomPgnData["url"] + '/#' + str(p)})
        else:
            prevBoard.push(moves[p])
            p += 1
        
        currBoard.push(moves[c])
        prevBoard.push(moves[p])
        c += 1
        p += 1
    
    print(redo_fens)
    return redo_fens

    # make two copies of starting pgns, prev pgn and curr pgn put curr pgn
    # one move ahead of prev pgn

    # analyze curr pgn, do move, analyze again and if diff between two pgn
    # warrants a redo the return prev pgn (which is now 2 moves back) plus
    # the next move (and the move played in the game for fun)

asyncio.run(fetchLichessGames("Helix487", 20))
