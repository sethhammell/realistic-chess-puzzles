import chess
import chess.engine

engine_path = r"engine\stockfish_15_x64_avx2.exe"

async def evaluation(fen, time=1):
    _transport, engine = await chess.engine.popen_uci(engine_path)
    board = chess.Board(fen)
    analysis = await engine.analyse(board, chess.engine.Limit(time))

    moves = []
    # print(analysis)
    if "pv" in analysis:
        moves = list(map(lambda m: m.uci(), analysis["pv"]))
    score = analysis["score"].white()

    await engine.quit()

    if score.is_mate():
        score = '#' + str(score.mate())
    else:
        score = score.score()
    
    return {"evaluation": score, "moves": moves}
