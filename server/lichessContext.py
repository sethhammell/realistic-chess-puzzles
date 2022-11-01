import requests
from evaluate import evaluation
from pgnParser import parsePgns
import chess.pgn
import random
from accuracy import computeAccuracy
import asyncio
import io


async def fetchLichessGames(user, max):
    redoFens = []
    while redoFens == []:
        response = requests.get("https://lichess.org/api/games/user/" +
                                user + "?max=" + str(max) + "&pgnInJson=true&rated=true")
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
        strMoves = [m for m in randomPgn.split(' ') if '.' not in m]
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

        while c < len(moves) - 1:
            evalBeforeResult = await evaluation(currBoard.fen(), 0.1)
            evalBefore = evalBeforeResult["evaluation"]
            currBoard.push(moves[c])
            c += 1
            evalAfterResult = await evaluation(currBoard.fen(), 0.1)
            evalAfter = evalAfterResult["evaluation"]
            accuracyPercent = computeAccuracy(evalBefore, evalAfter, isWhite)

            print(accuracyPercent)
            if (accuracyPercent < 70):
                nextMove = moves[p].uci()
                nextMoveUci = {
                    "sourceSquare": nextMove[:-2], "targetSquare": nextMove[2:]}

                prevBoardFen = prevBoard.fen()

                prevBoard.push(moves[p])
                p += 1

                movePlayed = strMoves[p]

                redoFens.append({"fen": prevBoardFen, "nextMove": nextMoveUci,
                                "movePlayed": movePlayed, "url": randomPgnData["url"] + '/' + ('black' if not (isWhite) else '') + '#' + str(p)})
            else:
                prevBoard.push(moves[p])
                p += 1

            currBoard.push(moves[c])
            prevBoard.push(moves[p])
            c += 1
            p += 1
    return redoFens

# asyncio.run(fetchLichessGames("Helix487", 20))
