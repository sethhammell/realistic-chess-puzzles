import chess.pgn
import requests
import json

formats = ["rapid", "blitz"]
ratings = ["2000", "2200"]

format_filter = "%2C".join(formats)
rating_filter = "%2C".join(ratings)

min_moves = 3000
distribution_filter = 0.075
lower_wr_prune = 0.01
total_lines = 0

top_moves = 3

tablebase = {}
with open('tablebase.json', 'r') as file:
    tablebase = json.load(file)


def swap_turn(turn):
    return "W" if turn == "B" else "B"


def wr(move, color):
    move_wins = (move["white"] if color ==
                 "W" else move["black"]) + (move["draws"] / 2)
    move_total = move["white"] + move["draws"] + move["black"]
    return (move_wins / move_total)


def tg(move):
    move_total = move["white"] + move["draws"] + move["black"]
    return move_total


def explore(board, color, turn, main=False):
    global total_lines
    wt_poses = []
    fen = ' '.join(board.fen().split(' ')[:-2])
    response = None
    opening_data = {}
    tries = 1

    if fen in tablebase:
        opening_data = tablebase[fen]
    else:
        while tries:
            try:
                response = requests.get(
                    f"https://explorer.lichess.ovh/lichess?variant=standard&fen={fen}&speeds={format_filter}&ratings={rating_filter}")
                raw_data = response.json()

                opening_data["white"] = raw_data["white"]
                opening_data["draws"] = raw_data["draws"]
                opening_data["black"] = raw_data["black"]
                opening_data["moves"] = []

                for move in raw_data["moves"]:
                    new_move = {}
                    new_move["white"] = move["white"]
                    new_move["draws"] = move["draws"]
                    new_move["black"] = move["black"]
                    new_move["san"] = move["san"]
                    opening_data["moves"].append(new_move)

                tablebase[fen] = opening_data
                tries = 0
            except:
                print(f"ERROR {tries}\n", board, "\nfen:", board.fen(), "\nrequest:",
                      f"https://explorer.lichess.ovh/lichess?variant=standard&fen={fen}&speeds={format_filter}&ratings={rating_filter}", "\nturn: ", turn)
                tries += 1

    wins = (opening_data["white"] if color ==
            "W" else opening_data["black"]) + (opening_data["draws"] / 2)
    total = opening_data["white"] + \
        opening_data["draws"] + opening_data["black"]
    pgn = ""

    total_lines += 1
    print(wins / total, total, opening_data["moves"][0]
          ["san"], len(tablebase), total_lines, fen)

    if (total < min_moves):
        return [wins, total, pgn]

    new_wins = 0

    if (turn == color):
        new_wins = wins
        best_move = None
        best_wr = 0

        moves = sorted(filter(lambda m: tg(m) > min_moves, opening_data["moves"]),
                       key=lambda m: wr(m, color), reverse=True)

        consider_moves = len(moves) if main else min(top_moves, len(moves))
        for i in range(consider_moves):
            move_wins = (moves[i]["white"] if color ==
                         "W" else moves[i]["black"]) + (moves[i]["draws"] / 2)
            move_total = moves[i]["white"] + \
                moves[i]["draws"] + moves[i]["black"]

            if ((wins / total) - (move_wins / move_total) > lower_wr_prune):
                continue

            new_board = chess.Board(board.fen())
            new_board.push_san(moves[i]["san"])

            wtp_pos = explore(new_board, color, swap_turn(turn))
            if main:
                wtp_pos[2] = ' ' + moves[i]["san"] + wtp_pos[2]
                wt_poses.append(wtp_pos)
            # print(moves[i]["san"], wtp_pos[0] / wtp_pos[1], wtp_pos)

            if (wtp_pos[0] / wtp_pos[1] > best_wr):
                best_wr = wtp_pos[0] / wtp_pos[1]
                best_move = ' ' + moves[i]["san"]
                pgn = best_move + wtp_pos[2]

        if best_wr != 0:
            new_wins = best_wr * total
            # print(new_wins, best_wr, total)
    else:
        first_move = ""

        for move in opening_data["moves"]:
            move_wins = (move["white"] if color ==
                         "W" else move["black"]) + (move["draws"] / 2)
            move_total = move["white"] + move["draws"] + move["black"]

            new_board = chess.Board(board.fen())
            new_board.push_san(move["san"])

            if (move_total / total > distribution_filter and move_total > min_moves):
                wtp_pos = explore(new_board, color, swap_turn(turn))
                new_wins += move_total * (wtp_pos[0] / wtp_pos[1])

                if (wtp_pos[2] != ""):
                    if first_move == "":
                        first_move = wtp_pos[2]
                        pgn += ' ' + move["san"]
                    else:
                        pgn += '(' + ' ' + move["san"] + wtp_pos[2] + ')'
            else:
                new_wins += move_wins

        pgn += first_move

    # print([new_wins, total, pgn, turn])
    if main and turn == color:
        return wt_poses
    elif main:
        return [[new_wins, total, pgn]]
    else:
        return [new_wins, total, pgn]


# opening_pgn = ["d4 Nf6 Nc3", "B", "B"]
# opening_pgn = "c4 c6"
# opening_pgn = "e4 d5"
# opening_pgn = "1. e4 Nf6 2. e5 Nd5 3. d4 b5 Bxb5"
# opening_pgn = ["e4 c5 Nf3 e6 d4 cxd4 Bg5", "W", "B"]
# opening_pgn = ["e4 c5 Nf3 e6 d4 d5", "W", "W"]
opening_pgn = ["e4 c5 Nf3 d6", "W", "W"]
# opening_pgn = ["e4 e5 Nf3 d5", "B", "W"]

str_moves = [m for m in opening_pgn[0].split(' ') if '.' not in m]
board = chess.Board()

for m in str_moves:
    board.push_san(m)

wtps = explore(chess.Board(board.fen()), opening_pgn[1], opening_pgn[2], True)
num = 1
# print(wtps[0] / wtps[1], wtps[2].count('(') + 1, opening_pgn + wtps[2])

with open('tablebase.json', 'w') as file:
    json.dump(tablebase, file)

sorted_wtps = sorted(wtps, key=lambda x: x[0], reverse=True)
with open(f'openings/{opening_pgn[0]}-{min_moves}.txt', 'w') as file:
    for wtp in sorted_wtps:
        print(f'#{num}')
        full_pgn = opening_pgn[0] + wtp[2]
        print(wtp[0] / wtp[1], full_pgn.count('(') + 1, full_pgn)
        file.write(f'#{num}\n')
        file.write(f"Winrate: {wtp[0] / wtp[1]}\n")
        file.write(f"Number of lines: {full_pgn.count('(') + 1}\n")
        file.write(f"PGN:\n" + full_pgn + "\n\n")
        num += 1


print(f"Positions in tablebase: {len(tablebase)}")
