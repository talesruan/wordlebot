const scores = require("./scores");

const keyboardLayout = [
	"QWERTYUIOP",
	" ASDFGHJKL",
	"  ZXCVBNM"
];
const render = function ({rules, autoScoreWords, scoringRow, scoringCol, games, uiState, bot}) {
	const numberOfGames = rules.numberOfGames;
	const boardMargin = 8;
	const spaceBetweenBoards = 8;
	const boardWidth = 21;
	const isAutoScore = autoScoreWords && autoScoreWords.length > 0;
	console.clear();
	console.log("");
	console.log("");

	if (isAutoScore) {
		let autoScoreString = "Autoscore: " + " ".repeat(boardMargin - 2);
		for (let i = 0; i < numberOfGames; i++) {
			autoScoreString += autoScoreWords[i] + " ".repeat(spaceBetweenBoards + (boardWidth - autoScoreWords[i].length));
		}
		console.log(getColoredString(autoScoreString, "blue"));
	}

	console.log("");

	const scoringGame = getGameByCol(games, rules, scoringCol);
	const separator = " ".repeat(boardMargin) + ("+---".repeat(rules.numberOfLetters) + "+" + " ".repeat(spaceBetweenBoards)).repeat(numberOfGames);
	for (let row = 0; row < rules.maxNumberOfAttempts; row++) {
		console.log(separator);
		let wordString = " ".repeat(boardMargin);

		for (const game of games) {
			for (let col = 0; col < rules.numberOfLetters; col++) {
				const letter = game.attempts[row] ? game.attempts[row][col] : " ";
				const score = game.scores[row] ? game.scores[row][col] : scores.SCORE_NONE;
				let letterString = ` ${letter} `;
				if (!isAutoScore && scoringGame === game && col === (scoringCol % rules.numberOfLetters) && row === scoringRow) letterString = `[${letter}]`;
				wordString += "|" + getColoredString(letterString, getColorByScore(score));
			}
			wordString += "|" + " ".repeat(spaceBetweenBoards)
		}

		if (row === scoringRow && uiState === "scoring") {
			wordString += " <=== Register score for this attempt"
		}
		console.log(wordString);
	}
	console.log(separator);
	console.log("");

	const scoresByLetter = getScoresByLetter();
	for (const keyboardRow of keyboardLayout) {
		let keyboardString = ""
		for (const char of keyboardRow) {
			if (char === " ") keyboardString += "   ";
			else keyboardString += getColoredString(" " +char + " ", getKeyboardColorByScore(scoresByLetter[char]));
		}
		console.log(keyboardString);
	}
	if (bot) {
		console.log(getColoredString((`Bot: ${bot.getDescription().name} - ${bot.getDescription().description}`).padEnd(100, " "), "blue"));
		console.log("");
	}
	if (games.every(game => game.isWon())) {
		console.log("GAME WON");
	} else if (games.every(game => game.isLost())) {
		console.log("GAME LOST");
	}
};

const getScoresByLetter = (game) => {
	return []; // TODO: Implement
}

const getColoredString = (string, color) => {
	const Reset = "\x1b[0m";
	const FgBrightWhite = "\x1b[97m";
	const BgBlue = "\x1b[44m";
	const BgGreen = "\x1b[42m";
	const BgYellow = "\x1b[43m"
	const BgWhite = "\x1b[47m"
	const BgGray = "\x1b[100m"
	if (color === "green") return FgBrightWhite + BgGreen + string + Reset;
	if (color === "yellow") return FgBrightWhite + BgYellow + string + Reset;
	if (color === "gray") return FgBrightWhite + BgGray + string + Reset;
	if (color === "blue") return FgBrightWhite + BgBlue + string + Reset;
	return string;
};

const getColorByScore = (score) => {
	if (score === scores.SCORE_GREEN) return "green";
	if (score === scores.SCORE_YELLOW) return "yellow";
	if (score === scores.SCORE_GRAY) return "gray";
	if (score === scores.SCORE_NONE) return "black";
};

const getKeyboardColorByScore = (score) => {
	if (score === scores.SCORE_GREEN) return "green";
	if (score === scores.SCORE_YELLOW) return "yellow";
	if (score === scores.SCORE_GRAY) return "black";
	return "gray";
};

const getGameByCol = (games, rules, col) => {
	return games[Math.floor(col / rules.numberOfLetters)];
};

const printWords = (dict) => {
	const wordsByLine = 20;
	let string = "";
	for (let i = 0; i < dict.length; i++) {
		string += dict[i] + ((i + 1) % wordsByLine === 0 ? "\n" : " ");
	}
	console.log(string);
}

module.exports = {
	render,
	printWords
};