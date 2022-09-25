from math import ceil
import yaml
import io
import random
import chess.pgn
from pymongo import MongoClient

config_path = r"config.yaml"


def randomFen(moveFilter = "", ratingRange = [0, 4000]):
    with open(config_path, 'r') as stream:
        config = yaml.safe_load(stream)

    atlas_uri = config["atlas_uri"]
    db_name = config["db_name"]
    cluster_name = config["cluster_name"]

    client = MongoClient(atlas_uri)
    database = client[db_name]
    cluster = database[cluster_name]
    game_data = list(cluster.aggregate(
        [{"$match": {"moves": {"$regex": moveFilter}}}, {"$sample": {"size": 1}}]))[0]

    moves = game_data["moves"].split(' ')

    # remove result and last move
    moves = moves[:-2]

    # if last "move" is a number e.g. 26. remove it
    lastChar = moves[-1][-1]
    if lastChar == '.':
        moves = moves[:-1]

    maxMove = round(len(moves) * 2 / 3)
    startMove = random.randint(8, maxMove)
    startingMoves = moves[:ceil(startMove * 1.5)]

    if (len(startingMoves) % 3 != 0):
        startingMoves.append('*')

    startingPgn = io.StringIO(' '.join(m for m in startingMoves))
    game = chess.pgn.read_game(startingPgn)
    return game.end().board().fen()


def gameQuantity(moveFilter = "", ratingRange = [0, 4000]):
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
