# pgn_path = r"pgns\lichess_db_standard_rated_2013-01.pgn"
pgn_path = r"pgns\lichess_db_standard_rated_2017-02.pgn"

opening = "1. e4 d5 2. d4"


def explore(opening, color):
    responses = {}
    t = 0

    f = open(pgn_path)
    pgn_text = f.readlines()
    f.close()

    with open(pgn_path) as f:
        while l := f.readline():
            s = l.split(' ')

            if s[0] == "1.":
                if l[:len(opening)] == opening:
                    next_move = s[opening.count(
                        ' ') + 1 + (1 if color == 'W' else 0)]

                    if next_move not in responses:
                        responses[next_move] = [0, 0, 0]

                    t += 1
                    if s[-1].strip() == "1-0":
                        responses[next_move][0] += 1
                    elif s[-1].strip() == "0-1":
                        responses[next_move][2] += 1
                    elif s[-1].strip() == "1/2-1/2":
                        responses[next_move][1] += 1
                    else:
                        print("ERROR: " + s[-1].strip())

    for i in responses:
        print(i, sum(responses[i]) / t, responses[i][0] / sum(responses[i]),
              responses[i][1] / sum(responses[i]), responses[i][2] / sum(responses[i]))

    return responses


responses = explore(opening, 'B')
print(responses)
