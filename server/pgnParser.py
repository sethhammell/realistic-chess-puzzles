import yaml
from pymongo import MongoClient

pgn_path = r"pgns\lichess_db_standard_rated_2013-01.pgn"
# pgn_path = r"pgns\lichess_db_standard_rated_2017-02.pgn"
# pgn_path = r"pgns\test.pgn"
config_path = r"config.yaml"

### when linking to lichess game, you can put #50 to make link jump to ply 50 ###
### could use bigger file and just keep counter of 1 million so database
# can be perfectly filled (don't increment if game is skipped)

def loadDB():
    f = open(pgn_path)
    pgn_text = f.readlines()
    f.close()

    pgns = []
    whiteElo = 0
    curr = {}
    for l in pgn_text:
        s = l.split(' ')
        match s[0]:
            case "[Site":
                curr["url"] = s[1][1:-3]
            case "[WhiteElo":
                if s[1][1:-3] == '?':
                    whiteElo = s[1][1:-3]
                else:
                    whiteElo = int(s[1][1:-3])
            case "[BlackElo":
                blackElo = s[1][1:-3]
                if blackElo == '?' and whiteElo == '?':
                    curr["avgElo"] = '?'
                elif blackElo == '?':
                    curr["avgElo"] = whiteElo
                elif whiteElo == '?':
                    curr["avgElo"] = blackElo
                else:
                    curr["avgElo"] = (int(s[1][1:-3]) + whiteElo) / 2
            case "[Opening":
                curr["opening"] = l[len("[Opening") + 2:-3]
            case "1.":
                curr["moves"] = l
                
                moves = curr["moves"].split(' ')
                moves = moves[:-2]
                lastChar = moves[-1][-1]
                if lastChar == '.':
                    moves = moves[:-1]
                totalMoves = round(len(moves) * 2 / 3)

                if totalMoves > 8 and curr["avgElo"] != '?':
                    pgns.append(curr)
                # else:
                #     print(totalMoves, curr["avgElo"] != '?', curr["url"], curr["avgElo"], curr["opening"], curr["moves"])
                curr = {}

    # for p in pgns:
    #     print(p["url"], p["avgElo"], p["opening"], p["moves"])

    with open(config_path, 'r') as stream:
        config = yaml.safe_load(stream)

    atlas_uri = config["atlas_uri"]
    db_name = config["db_name"]
    cluster_name = config["cluster_name"]

    client = MongoClient(atlas_uri)
    database = client[db_name]
    cluster = database[cluster_name]
    for p in pgns:
        cluster.insert_one(p)

def clearDB():
    with open(config_path, 'r') as stream:
        config = yaml.safe_load(stream)

    atlas_uri = config["atlas_uri"]
    db_name = config["db_name"]
    cluster_name = config["cluster_name"]

    client = MongoClient(atlas_uri)
    database = client[db_name]
    cluster = database[cluster_name]

    cluster.delete_many({})

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

loadDB()
# clearDB()
# searchDB()
