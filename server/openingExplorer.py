# pgn_path = r"pgns\lichess_db_standard_rated_2013-01.pgn"
pgn_path = r"pgns\lichess_db_standard_rated_2017-02.pgn"

# opening = "1. e4 d5 2. d4"
# opening = "1. e4 e5 2. Bc4 Nc6 3. Nf3"
# opening = "1. e4 e5 2. Nf3 Nc6 3. Bc4"
# opening = "1. e4 Nf6 2. Nc3 d5 3. d4"
opening = "1. e4 Nf6 2. Nc3 d6 3. d4"

lines = 500000000


def explore(opening, color):
    global lines
    responses = {}
    t = 0
    w = 0

    # f = open(pgn_path)
    # pgn_text = f.readlines()
    # f.close()

    avg_elo = "?"
    white_elo = 0
    time_format = ""

    with open(pgn_path) as f:
        while l := f.readline():
            lines -= 1
            if lines == 0:
                break
            s = l.split(" ")

            match s[0]:
                case "1.":
                    if (
                        avg_elo != "?"
                        and (2000 <= avg_elo and avg_elo <= 2500)
                        and l[: len(opening)] == opening
                        and ("Blitz" in time_format or "Rapid" in time_format)
                        and ("Rated" in time_format)
                    ):
                        next_move = s[
                            opening.count(" ") + 1 + (1 if color == "W" else 0)
                        ]

                        if next_move not in responses:
                            responses[next_move] = [0, 0, 0]

                        t += 1
                        if s[-1].strip() == "1-0":
                            w += 1
                            responses[next_move][0] += 1
                        elif s[-1].strip() == "0-1":
                            responses[next_move][2] += 1
                        elif s[-1].strip() == "1/2-1/2":
                            w += 0.5
                            responses[next_move][1] += 1
                        else:
                            print("ERROR: " + s[-1].strip())
                    avg_elo = "?"
                case "[WhiteElo":
                    if s[1][1:-3] == "?":
                        white_elo = s[1][1:-3]
                    else:
                        white_elo = int(s[1][1:-3])
                case "[BlackElo":
                    black_elo = s[1][1:-3]
                    if black_elo == "?" and white_elo == "?":
                        avg_elo = "?"
                    elif black_elo == "?":
                        avg_elo = white_elo
                    elif white_elo == "?":
                        avg_elo = black_elo
                    else:
                        avg_elo = (int(s[1][1:-3]) + white_elo) / 2
                case "[Event":
                    time_format = l[8:-3]

    print(f"Total Games: {t}")
    print(f"Winrate (white): {round(w / t, 2)}")
    responses = {
        k: v
        for k, v in sorted(responses.items(), key=lambda r: sum(r[1]), reverse=True)
    }
    for i in responses:
        print(
            i,
            sum(responses[i]),
            round(sum(responses[i]) / t, 2),
            round(responses[i][0] / sum(responses[i]), 2),
            round(responses[i][1] / sum(responses[i]), 2),
            round(responses[i][2] / sum(responses[i]), 2),
        )

    return responses


responses = explore(opening, "B")
print(responses)
