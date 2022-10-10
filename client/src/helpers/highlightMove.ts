const white_highlight = "rgba(205,210,106,255)";
const black_highlight = "rgba(170,162,58,255)";

const white = "rgb(240, 217, 181)";
const black = "rgb(181, 136, 99)";

export function highlightMove(square: string): string {
	return isBlack(square) ? black_highlight : white_highlight;
}

export function undoHighlight(square: string): string {
	return isBlack(square) ? black : white;
}

function isBlack(square: string): boolean {
	console.log(square)
	const letter = square[0].charCodeAt(0) - 96;
	const number = +square[1];
	console.log(letter, number)
	return letter % 2 === number % 2;
}
