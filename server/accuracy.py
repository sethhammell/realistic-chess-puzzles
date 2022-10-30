from math import exp

# formulas taken from: https://lichess.org/page/accuracy
def computeAccuracy(evalBefore, evalAfter, isWhite):
    winPercentBefore = computeWinPercent(evalBefore, isWhite)
    winPercentAfter = computeWinPercent(evalAfter, isWhite)

    accuracyPercent = 103.1668 * exp(-0.04354 * (winPercentBefore - winPercentAfter)) - 3.1669
    
    return accuracyPercent

def computeWinPercent(eval, isWhite):
    if isinstance(eval, str) and eval[0] == '#':
        if eval[1] == '-':
            return 0 if isWhite else 100
        else:
            return 100 if isWhite else 0
    else:
        if not isWhite:
            eval = eval * -1
        return 50 + 50 * (2 / (1 + exp(-0.00368208 * eval)) - 1)