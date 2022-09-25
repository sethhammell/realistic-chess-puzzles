import chess
import chess.engine

engine_path = r"engine\stockfish_15_x64_avx2.exe"

async def evaluation(fen):
    _transport, engine = await chess.engine.popen_uci(engine_path)
    board = chess.Board(fen)
    analysis = await engine.analyse(board, chess.engine.Limit(time=1))

    await engine.quit()
    return {"evaluation": analysis["score"].white().score(), "moves": analysis["pv"]}
