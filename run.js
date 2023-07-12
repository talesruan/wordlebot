const fs = require("fs");
const readline = require('readline').createInterface({input: process.stdin, output: process.stdout,});
const keypress = require('keypress');
keypress(process.stdin);
const bot = require("./randomBot");

let dictionary;

const numberOfLetters = 5;
const maxNumberOfAttempts = 6;
const SCORE_GREEN = 3;
const SCORE_YELLOW = 2;
const SCORE_GRAY = 1; // Attempted
const SCORE_NONE = 0; // Not attempted
const boardMargin = 4;

let scoringRow = 0;
let scoringCol = 0;
const currentScores = [];

let uiState = "botLog"; // botLog

const gameState = {
	attempts: [],
	scores: []
}
const run = () => {
	console.log("Startup:");
	console.log("Dictionary has " + getDictionary().length + " words");
	process.stdin.on('keypress', function (ch, key) {
		if (key) processKeypress(key.name);
	});
	process.stdin.setRawMode(true);
	runTurn();
};

const runTurn = () => {
	scoringCol = 0;
	if (isGameWon(gameState)) {
		drawBoard(gameState)
		process.exit();
		return;
	}
	uiState = "botLog";
	drawBoard(gameState)
	console.log("Running bot...");
	const botGuess = bot.execute(gameState, getDictionary());
	console.log("Bot guess: " + getColoredString(botGuess, "blue"));

	registerBotGuess(gameState, botGuess);

	// drawBoard(gameState)

	console.log("Register score and press <ENTER>");
};

const registerBotGuess = (gameState, word) => {
	gameState.attempts.push(word);
	const wordScores = [];
	for (let pos = 0; pos < numberOfLetters; pos++) {
		wordScores.push(SCORE_GRAY);
	}
	gameState.scores.push(wordScores)
};

const processKeypress = (keyName) => {
	if (uiState === "scoring") {
		if (keyName === "return") {
			scoringRow++;
			runTurn();
		} else if (keyName === "up") {
			gameState.scores[scoringRow][scoringCol] = Math.min(SCORE_GREEN, gameState.scores[scoringRow][scoringCol] + 1);
			drawBoard(gameState)
		} else if (keyName === "down") {
			gameState.scores[scoringRow][scoringCol] = Math.max(SCORE_GRAY, gameState.scores[scoringRow][scoringCol] - 1);
			drawBoard(gameState)
		} else if (keyName === "left") {
			scoringCol = Math.max(0, scoringCol - 1);
		} else if (keyName === "right") {
			scoringCol = Math.min(numberOfLetters - 1, scoringCol + 1);
		}
	} else if (uiState === "botLog") {
		if (keyName === "return") {
			uiState = "scoring";
			drawBoard(gameState);
		}
	}
};

const getDictionary = () => {
	if (dictionary) return dictionary;
	const dictionaryFile = fs.readFileSync("./dictionaries/termo.json", "utf8");
	dictionary = JSON.parse(dictionaryFile).map(w => normalizeDictionaryWord(w)).filter(w => w.length === 5);
	if (dictionary.length === 0) throw new Error("Dictionary is empty.");
	return dictionary;
};

const normalizeDictionaryWord = (word) => {
	return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

const drawBoard = (gameState) => {
	console.clear();
	console.log("");
	console.log("");
	const separator = " ".repeat(boardMargin) + "+---".repeat(numberOfLetters) + "+";
	for (let row = 0; row < maxNumberOfAttempts; row++) {
		console.log(separator);
		let wordString = " ".repeat(boardMargin);
		for (let col = 0; col < numberOfLetters; col++) {
			const letter = gameState.attempts[row] ? gameState.attempts[row][col] : " ";
			const score = gameState.scores[row] ? gameState.scores[row][col] : SCORE_NONE;
			wordString += "|" + getColoredString(" " +letter + " ", getColorByScore(score));
		}
		wordString += "|"

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
	console.log("");
	if (isGameWon(gameState)) {
		console.log("GAME WON");
	} else if (isGameLost(gameState)) {
		console.log("GAME LOST");
	}
};

const getScoresByLetter = (gameState) => {
	return []; // TODO: Implement
}

const isGameWon = (gameState) => {
	return gameState.scores.some(score => score.every(letterScore => letterScore === SCORE_GREEN));
}

const isGameLost = (gameState) => {
	return gameState.attempts.length >= maxNumberOfAttempts;
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
	if (score === SCORE_GREEN) return "green";
	if (score === SCORE_YELLOW) return "yellow";
	if (score === SCORE_GRAY) return "gray";
	if (score === SCORE_NONE) return "black";
};

const getKeyboardColorByScore = (score) => {
	if (score === SCORE_GREEN) return "green";
	if (score === SCORE_YELLOW) return "yellow";
	if (score === SCORE_GRAY) return "black";
	return "gray";
};

const keyboardLayout = [
	"QWERTYUIOP",
	" ASDFGHJKL",
	"  ZXCVBNM"
]

run();
// process.exit();