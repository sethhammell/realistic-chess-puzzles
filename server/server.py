from flask import Flask
import asyncio
from engine import evaluation

app = Flask(__name__)


@app.route("/api/engineEvaluation/<encodedFen>")
async def engineEvaluation(encodedFen):

    move = await asyncio.run(evaluation())
    return {"evaluation": 2}


if __name__ == "__main__":
    app.run(debug=True)
