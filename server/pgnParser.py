import yaml
from pymongo import MongoClient

# pgn_path = r"lichess_db_standard_rated_2013-01.pgn"
# pgn_path = r"lichess_db_standard_rated_2017-02.pgn"
# pgn_path = r"test.pgn"
config_path = r"config.yaml"

### when linking to lichess game, you can put #50 to make link jump to ply 50 ###

### don't add games that are less than 4 moves
### could use bigger file and just keep counter of 1 million so database
# can be perfectly filled (don't increment if game is skipped)

def parseFile():
    # f = open(pgn_path)
    # pgn_text = f.readlines()
    # f.close()

    # pgns = []
    # curr = {}
    # for l in pgn_text:
    #     s = l.split(' ')
    #     match s[0]:
    #         case "[WhiteElo":
    #             curr["whiteElo"] = s[1][1:-3]
    #         case "[BlackElo":
    #             curr["blackElo"] = s[1][1:-3]
    #         case "[Opening":
    #             curr["opening"] = l[len("[Opening") + 2:-3]
    #         case "1.":
    #             curr["moves"] = l
    #             pgns.append(curr)
    #             curr = {}

    # for p in pgns:
    #     print(p.whiteElo, p.blackElo, p.opening, p.moves)

    with open(config_path, 'r') as stream:
        config = yaml.safe_load(stream)

    # atlas_uri = config["atlas_uri"]
    # db_name = config["db_name"]
    # cluster_name = config["cluster_name"]

    # client = MongoClient(atlas_uri)
    # database = client[db_name]
    # cluster = database[cluster_name]
    # for p in pgns:
    #     cluster.insert_one(p)
    # cluster.delete_many({})


def searchDB():
    with open(config_path, 'r') as stream:
        config = yaml.safe_load(stream)

    atlas_uri = config["atlas_uri"]
    db_name = config["db_name"]
    cluster_name = config["cluster_name"]

    client = MongoClient(atlas_uri)
    database = client[db_name]
    cluster = database[cluster_name]
    size = list(cluster.find({"moves": {"$regex": '1. e4 e6 '}}))
    games = list(cluster.aggregate(
        [{"$match": {"moves": {"$regex": '1. e4 e6 '}}}, {"$sample": {"size": 1}}]))
    print(len(size))
    for game in games:
        print(game)
    # for game in games:
    #     print(game["opening"])


# class pgn(object):
#     whiteElo = str()
#     blackElo = str()
#     opening = str()
#     moves = str()

# parseFile()
searchDB()
