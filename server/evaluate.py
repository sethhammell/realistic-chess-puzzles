import chess
import chess.engine


async def evaluation(fen):
    _transport, engine = await chess.engine.popen_uci(r"server\engine\stockfish_15_x64_avx2.exe")

    board = chess.Board()
    analysis = engine.analysis(board, chess.engine.Limit(depth=20))
    
    print(analysis)
    await engine.quit()
