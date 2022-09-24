def parseFile():
    f = open(r"lichess_db_standard_rated_2013-01.pgn")
    pgn_text = f.readlines()
    f.close()

    pgns = []
    curr = pgn()
    for l in pgn_text:
        s = l.split(' ')
        match s[0]:
            case "[WhiteElo":
                curr.whiteElo = s[1][1:-3]
            case "[BlackElo":
                curr.blackElo = s[1][1:-3]
            case "[Opening":
                curr.opening = l[len("[Opening") + 2:-3]
            case "1.":
                curr.moves = l
                pgns.append(curr)
                curr = pgn()
    
    # for p in pgns:
    #     print(p.whiteElo, p.blackElo, p.opening, p.moves)


class pgn(object):
    whiteElo = str()
    blackElo = str()
    opening = str()
    moves = str()

parseFile()
