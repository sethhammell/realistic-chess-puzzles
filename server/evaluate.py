# import asyncio
import chess
import chess.engine


async def evaluation(fen):
    _transport, engine = await chess.engine.popen_uci(r"engine\stockfish_15_x64_avx2.exe")
    board = chess.Board(fen)
    analysis = await engine.analyse(board, chess.engine.Limit(depth=20))

    await engine.quit()
    print(analysis)
    print(analysis["score"].white().score())
    print({"evaluation": analysis["score"].white(
    ).score(), "moves": analysis["pv"]})
    return {"evaluation": analysis["score"].white().score(), "moves": analysis["pv"]}

# asyncio.run(evaluation(""))
