import asyncio
from flask import Flask
from evaluate import evaluation

app = Flask(__name__)


@app.route("/api/engineEvaluation/<encodedFen>")
async def engineEvaluation(encodedFen):
    fen = encodedFen.replace('\\', '/')
    analysis = await evaluation(fen)
    print(analysis)
    return analysis


if __name__ == "__main__":
    app.run(debug=True)
