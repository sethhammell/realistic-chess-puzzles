import chess
import chess.engine

engine_path = r"engine\stockfish_15_x64_avx2.exe"

async def evaluation(fen):
    _transport, engine = await chess.engine.popen_uci(engine_path)
    board = chess.Board(fen)
    analysis = await engine.analyse(board, chess.engine.Limit(depth=20))

    await engine.quit()
    print(analysis)
    print(analysis["score"].white().score())
    print({"evaluation": analysis["score"].white(
    ).score(), "moves": analysis["pv"]})
    return {"evaluation": analysis["score"].white().score(), "moves": analysis["pv"]}
