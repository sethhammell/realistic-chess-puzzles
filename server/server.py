import asyncio
from flask import Flask, request
from evaluate import evaluation
from mongoContext import randomFen, gameQuantity

app = Flask(__name__)


@app.route("/api/engineEvaluation/<encodedFen>", methods=["GET"])
async def getEngineEvaluation(encodedFen):
    fen = encodedFen.replace('\\', '/')
    analysis = await evaluation(fen)
    return analysis


@app.route("/api/database/randomFen", methods=["GET"])
async def getRandomFen():
    moveFilter = request.args.get('moveFilter')
    ratingRange = request.args.get('ratingRange')
    print(moveFilter)
    print(ratingRange)
    return {"fen": randomFen(moveFilter, ratingRange)}


@app.route("/api/database/gameQuantity", methods=["GET"])
async def getGameQuantity():
    moveFilter = request.args.get('moveFilter')
    ratingRange = request.args.get('ratingRange')
    return {"quantity": gameQuantity(moveFilter, ratingRange)}

if __name__ == "__main__":
    app.run(debug=True)
