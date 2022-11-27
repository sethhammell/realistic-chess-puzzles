import requests
from evaluate import evaluation
from pgnParser import parsePgns, parseStudy
import chess.pgn
import random
from accuracy import computeAccuracy
import asyncio
import io


async def fetchLichessGames(user, max):
    redoFens = []
    while redoFens == []:
        response = requests.get("https://lichess.org/api/games/user/" +
                                user + "?max=" + str(max) + "&pgnInJson=true&rated=true&perfType=rapid")
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


def fetchLichessStudy(studyId):
    response = requests.get(
        "https://lichess.org/api/study/" + studyId + ".pgn?clocks=false&comments=false")

    pgn_text = response.text.split('\n')
    for i in range(len(pgn_text)):
        pgn_text[i] += '\n'

    turn = 'w'
    turns = []
    chapters = []
    for l in pgn_text:
        s = l.split(' ')
        if s[0] == '1.':
            study_text = [m for m in s if m != '' and '*' not in m]
            newChapter = parseStudy([], study_text)
            bc = 1
            for j in study_text:
                if '(' in j:
                    bc += 1
            # print(bc)
            # print(len(newChapter))
            # print(study_text)
            # print(newChapter)
            chapters += newChapter
            for i in range(len(newChapter)):
                turns.append(turn)
        elif s[0] == '[Event':
            turn = 'w' if len(s) % 2 == 0 else 'b'

    chaptersUCI = []

    print(len(turns), len(chapters))
    for x, c in enumerate(chapters):
        moves = []
        game = chess.pgn.read_game(io.StringIO(' '.join(c)))
        mainlineMoves = game.mainline_moves()
        for m in mainlineMoves:
            move = m.uci()
            moves.append({"sourceSquare": move[:-2], "targetSquare": move[2:]})
        chaptersUCI.append({"turn": turns[x], "moves": moves})
        # if turns[x] == 'b':
        #     print(mainlineMoves)

    # for c in chaptersUCI:
    #     print(c)
    return chaptersUCI


# fetchLichessStudy('f6UavjzS')
# asyncio.run(fetchLichessGames("Helix487", 20))
