const fs = require("fs");
const readline = require('readline').createInterface({input: process.stdin, output: process.stdout,});
const keypress = require('keypress');
keypress(process.stdin);
// const bot = require("./randomBot");
const bot = require("./botMk3");
const Game = require("./Game");
const rules = require("./rules").termoRules;

let dictionary;

const SCORE_GREEN = 3;
const SCORE_YELLOW = 2;
const SCORE_GRAY = 1; // Attempted
const SCORE_NONE = 0; // Not attempted

let scoringRow = 0;
let scoringCol = 0;
const currentScores = [];

let autoScoreWord = "";
// let autoScoreWord = "";

let uiState = "botLog"; // botLog, config

const game = new Game(rules);

const games = [game];

const numberOfGames = games.length;

const run = () => {
	process.stdin.on('keypress', function (ch, key) {
		if (key) processKeypress(key.name);
	});
	process.stdin.setRawMode(true);
	runTurn();
	console.log("Dictionary has " + getDictionary().length + " words");
	console.log("Press <TAB> for autoscore");
};

const runTurn = () => {
	scoringCol = 0;
	if (game.isWon()) {
		drawBoard()
		process.exit();
		return;
	}
	uiState = "botLog";
	drawBoard()
	console.log("Running bot...");
	const botGuess = bot.execute(game, getDictionary()).toUpperCase();
	console.log("Bot guess: " + getColoredString(botGuess, "blue"));

	registerBotGuess(game, botGuess);
	// registerBotGuess(games[1], botGuess);

	if (autoScoreWord) {
		game.scores.pop();
		game.addScore(botGuess, autoScoreWord);
	}

	// drawBoard()

	console.log("<ENTER> to continue");
};
const registerBotGuess = (game, word) => {
	game.attempts.push(word.toUpperCase());
	const wordScores = [];
	for (let pos = 0; pos < game.rules.numberOfLetters; pos++) {
		wordScores.push(SCORE_GRAY);
	}
	game.scores.push(wordScores)
};

const validateUserScoring = (game) => {
	// TODO: Implement
}

const processKeypress = (keyName) => {
	if (uiState === "scoring") {
		if (keyName === "return") {
			scoringRow++;
			runTurn();
		} else if (keyName === "up") {
			game.scores[scoringRow][scoringCol] = Math.min(SCORE_GREEN, game.scores[scoringRow][scoringCol] + 1);
			drawBoard()
		} else if (keyName === "down") {
			game.scores[scoringRow][scoringCol] = Math.max(SCORE_GRAY, game.scores[scoringRow][scoringCol] - 1);
			drawBoard()
		} else if (keyName === "left") {
			scoringCol = Math.max(0, scoringCol - 1);
		} else if (keyName === "right") {
			scoringCol = Math.min(rules.numberOfLetters - 1, scoringCol + 1);
		}
	} else if (uiState === "botLog") {
		if (keyName === "return") {
			if (autoScoreWord) {
				runTurn();
			} else {
				uiState = "scoring";
				drawBoard();
			}
		} else if (keyName === "tab") {
			uiState = "config";
			// console.log("Received " + keyName);
			readline.question(`Enter word for autoscore: `, word => {
				autoScoreWord = word.toUpperCase().substring(0, rules.numberOfLetters);
				if (game.attempts.length > 0) {
					const lastGuess = game.attempts[game.attempts.length - 1];
					game.scores.pop();
					game.addScore(lastGuess, autoScoreWord);
				}
			});
		}
	} else if (uiState === "config") {
		if (keyName === "return") {
			uiState = "botLog";
			drawBoard();
			console.log("Config done.");
		}
	}
};

const getDictionary = () => {
	if (dictionary) return dictionary;
	// const dictionaryFile = fs.readFileSync("./dictionaries/termo.json", "utf8");
	// dictionary = JSON.parse(dictionaryFile).map(w => normalizeDictionaryWord(w)).filter(w => w.length === 5);

	// const dictionaryFile = fs.readFileSync("./dictionaries/portuguese.txt", "utf8");
	// dictionary = dictionaryFile.split("\n").filter(word => word.length === 5).map(w => normalizeDictionaryWord(w));

	const dictionaryFile = fs.readFileSync("./dictionaries/english.txt", "utf8");
	dictionary = dictionaryFile.split("\n").filter(word => word.length === 5).map(w => normalizeDictionaryWord(w));

	if (dictionary.length === 0) throw new Error("Dictionary is empty.");
	return dictionary;
};

const normalizeDictionaryWord = (word) => {
	return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

const drawBoard = () => {

	const boardMargin = 4;
	const spaceBetweenBoards = 8;

	console.clear();
	console.log("");
	console.log("UI STATE: " + uiState);
	console.log("");
	if (autoScoreWord) {
		console.log(" ".repeat(boardMargin)+"AutoScore: " + autoScoreWord	);
	}
	const separator = " ".repeat(boardMargin) + ("+---".repeat(rules.numberOfLetters) + "+" + " ".repeat(spaceBetweenBoards)).repeat(numberOfGames);
	for (let row = 0; row < rules.maxNumberOfAttempts; row++) {
		console.log(separator);
		let wordString = " ".repeat(boardMargin);

		for (const game of games) {
			for (let col = 0; col < rules.numberOfLetters; col++) {
				const letter = game.attempts[row] ? game.attempts[row][col] : " ";
				const score = game.scores[row] ? game.scores[row][col] : SCORE_NONE;
				wordString += "|" + getColoredString(" " +letter + " ", getColorByScore(score));
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
	console.log("");
	if (game.isWon()) {
		console.log("GAME WON");
	} else if (game.isLost()) {
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