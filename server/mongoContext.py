from math import ceil
from evaluate import evaluation
import yaml
import io
import random
import chess.pgn
from pymongo import MongoClient

config_path = r"config.yaml"

piece_values = dict(zip('pbnrqPBNRQ', [1, 3, 3, 5, 9]*2))
losing_threshold = 300
score_threshold = 5

# random fen plus next move, so en passant is known


async def randomFen(moveFilter="", ratingRange=[0, 4000]):
    with open(config_path, 'r') as stream:
        config = yaml.safe_load(stream)

    atlas_uri = config["atlas_uri"]
    db_name = config["db_name"]
    cluster_name = config["cluster_name"]

    client = MongoClient(atlas_uri)
    database = client[db_name]
    cluster = database[cluster_name]

    turn = chess.WHITE
    eval = 0
    score = 10
    fen = ""
    mate_for_white = False
    mate_for_black = False

    # if eval for pov player < -1.5 reroll
    # if score for pov player > 5 (3?) points? reroll
    while ((turn == chess.WHITE and (mate_for_black or score > score_threshold or eval < -1 * losing_threshold)) or
           (turn == chess.BLACK and (mate_for_white or score < -1 * score_threshold or eval > losing_threshold))):
        game_data = list(cluster.aggregate(
            [{"$match": {"moves": {"$regex": moveFilter}}}, {"$sample": {"size": 1}}]))[0]

        moves = game_data["moves"].split(' ')

        # remove result and last move
        moves = moves[:-2]

        # if last "move" is a number e.g. 26. remove it
        lastChar = moves[-1][-1]
        if lastChar == '.':
            moves = moves[:-1]

        # to account for 1/3 of moves being 1. 2. etc.
        maxMove = round(len(moves) * 2 / 3)
        minMove = 0 if maxMove <= 8 else 8

        # don't take positions before move 8 / 2 = 4
        
        startMove = random.randint(minMove, maxMove)
        startingMoves = moves[:ceil(startMove * 1.5)]

        if (len(startingMoves) % 3 != 0):
            startingMoves.append('*')

        startingPgn = io.StringIO(' '.join(m for m in startingMoves))
        game = chess.pgn.read_game(startingPgn)

        print(startingMoves)
        fen = game.end().board().fen()
        for c in reversed(fen):
            if c == 'w':
                turn = chess.WHITE
                break
            if c == 'b':
                turn = chess.BLACK
                break

        score = sum(piece_values.get(c, 0)*(-1)**(c > 'Z')for c in fen)

        if not ((turn == chess.WHITE and score > 5) or (turn == chess.BLACK and score < -5)):
            eval_result = await evaluation(fen, 0.1)
            eval = eval_result["evaluation"]
            mate_for_white = False
            mate_for_black = False
            if isinstance(eval, str) and eval[0] == '#':
                if eval[1] == '-':
                    mate_for_black = True
                else:
                    mate_for_white = True
        print(turn, turn == chess.WHITE, turn == chess.BLACK, score, eval, fen)
    return {"fen": fen, "next_move": None, "url": game_data["url"] + '/#' + str(startMove)}


def gameQuantity(moveFilter="", ratingRange=[0, 4000]):
    with open(config_path, 'r') as stream:
        config = yaml.safe_load(stream)

    atlas_uri = config["atlas_uri"]
    db_name = config["db_name"]
    cluster_name = config["cluster_name"]

    client = MongoClient(atlas_uri)
    database = client[db_name]
    cluster = database[cluster_name]
    size = list(cluster.find({"moves": {"$regex": moveFilter}}))
    return len(size)
