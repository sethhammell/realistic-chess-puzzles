from flask import Flask

app = Flask(__name__)


@app.route("/api/engineEvaluation/<encodedFen>")
def engineEvaluation(encodedFen):
    return {"evaluation": 2}


if __name__ == "__main__":
    app.run(debug=True)
