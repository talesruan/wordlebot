const fs = require("fs");
const readline = require('readline').createInterface({input: process.stdin, output: process.stdout,});
const keypress = require('keypress');
keypress(process.stdin);
// const bot = require("./basicBot");
const bot = require("./botMk7");
const Game = require("./Game");
const gameRender = require("./gameRender");

const allRules = require("./rules").allRules;

let dictionary;

const SCORE_GREEN = 3;
const SCORE_YELLOW = 2;
const SCORE_GRAY = 1; // Attempted
const SCORE_NONE = 0; // Not attempted

let scoringRow = 0;
let scoringCol = 0;
const currentScores = [];

let autoScoreWords = [];
let isAutoScore = false;

let uiState = "botLog"; // botLog, config

let rules;
let games = [];
let numberOfGames;

const init = async () => {
	for (let index = 0; index < allRules.length; index++) {
		const rules = allRules[index];
		console.log(`${index} - ${rules.name} \t- ${rules.rules.numberOfGames} game(s) of ${rules.rules.numberOfLetters} X ${rules.rules.maxNumberOfAttempts} `);
	}
	readline.question(`Choose game: `, input => {
		const chosenRules = allRules[parseInt(input)];
		if (!chosenRules) {
			console.log("Invalid game");
			process.exit();
			return;
		} else {
			rules = chosenRules.rules;
			numberOfGames = rules.numberOfGames;
			for (let i = 0; i < numberOfGames; i++) {
				games.push(new Game(rules));
			}
			run();
		}
	});
};

const run = async () => {
	process.stdin.on('keypress', function (ch, key) {
		if (key) processKeypress(key.name);
	});
	process.stdin.setRawMode(true);
	await runTurn();
	console.log("Dictionary has " + getDictionary().length + " words");
	console.log("Press <TAB> for autoscore");
};

const isAllGamesWon = () => {
	return games.every(game => game.isWon());
}

const runTurn = async () => {
	scoringCol = 0;
	if (games.every(game => game.isLost() || game.isWon())) {
		drawBoard()
		process.exit();
		return;
	}
	uiState = "botLog";
	drawBoard()
	console.log("Running bot...");

	const rawBotGuess = (await bot.execute(games, getDictionary(), rules));
	if (!rawBotGuess) throw new Error("Bot refused to play.");
	const botGuess = rawBotGuess.toUpperCase();
	console.log("Bot guess: " + getColoredString(botGuess, "blue"));

	games.filter(game => !game.isWon() && !game.isLost()).forEach(game => registerBotGuess(game, botGuess));

	if (isAutoScore) {
		for (let i = 0; i < numberOfGames; i++) {
			const game = games[i];
			if (game.isWon()) continue;
			game.scores.pop();
			game.addScore(botGuess, autoScoreWords[i]);
		}
	}
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

const getGameByCol = (col) => {
	return games[Math.floor(col / rules.numberOfLetters)];
};

const processKeypress = (keyName) => {
	if (uiState === "scoring") {
		if (keyName === "return") {
			scoringRow++;
			runTurn();
		} else if (keyName === "up") {
			getGameByCol(scoringCol).scores[scoringRow][scoringCol % rules.numberOfLetters] = Math.min(SCORE_GREEN, getGameByCol(scoringCol).scores[scoringRow][scoringCol % rules.numberOfLetters] + 1);
			drawBoard();
		} else if (keyName === "down") {
			getGameByCol(scoringCol).scores[scoringRow][scoringCol % rules.numberOfLetters] = Math.max(SCORE_GRAY, getGameByCol(scoringCol).scores[scoringRow][scoringCol % rules.numberOfLetters] - 1);
			drawBoard();
		} else if (keyName === "left") {
			scoringCol = Math.max(0, scoringCol - 1);
			drawBoard();
		} else if (keyName === "right") {
			scoringCol = Math.min((rules.numberOfLetters * rules.numberOfGames) - 1, scoringCol + 1);
			drawBoard();
		}
	} else if (uiState === "botLog") {
		if (keyName === "return") {
			if (isAutoScore) {
				runTurn();
			} else {
				uiState = "scoring";
				drawBoard();
			}
		} else if (keyName === "tab") {
			uiState = "config";
			// console.log("Received " + keyName);
			readline.question(`Enter words for autoscore separated with space: `, word => {
				isAutoScore = false;
				autoScoreWords = [];
				const words = word.split(" ");
				if (words.length !== games.length) return;
				for (let i = 0; i < numberOfGames; i++) {
					autoScoreWords[i] = words[i].toUpperCase().substring(0, rules.numberOfLetters);
					const game = games[i];
					if (game.attempts.length > 0) {
						const lastGuess = game.attempts[game.attempts.length - 1];
						game.scores.pop();
						game.addScore(lastGuess, autoScoreWords[i]);
					}
				}
				isAutoScore = true;
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
	const dictionaryFile = fs.readFileSync("./dictionaries/termo.json", "utf8");
	dictionary = JSON.parse(dictionaryFile).map(w => normalizeDictionaryWord(w)).filter(w => w.length === 5);

	// const dictionaryFile = fs.readFileSync("./dictionaries/portuguese.txt", "utf8");
	// dictionary = dictionaryFile.split("\n").filter(word => word.length === 5).map(w => normalizeDictionaryWord(w));

	// const dictionaryFile = fs.readFileSync("./dictionaries/english.txt", "utf8");
	// dictionary = dictionaryFile.split("\n").filter(word => word.length === 5).map(w => normalizeDictionaryWord(w));

	if (dictionary.length === 0) throw new Error("Dictionary is empty.");
	return dictionary;
};

const normalizeDictionaryWord = (word) => {
	return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

const drawBoard = () => {
	gameRender.render({
		rules, autoScoreWords, scoringRow, scoringCol, games, uiState, bot
	});
};

const drawBoardOld = () => {

	const boardMargin = 8;
	const spaceBetweenBoards = 8;
	const boardWidth = 21;

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

	const scoringGame = getGameByCol(scoringCol);
	const separator = " ".repeat(boardMargin) + ("+---".repeat(rules.numberOfLetters) + "+" + " ".repeat(spaceBetweenBoards)).repeat(numberOfGames);
	for (let row = 0; row < rules.maxNumberOfAttempts; row++) {
		console.log(separator);
		let wordString = " ".repeat(boardMargin);

		for (const game of games) {
			for (let col = 0; col < rules.numberOfLetters; col++) {
				const letter = game.attempts[row] ? game.attempts[row][col] : " ";
				const score = game.scores[row] ? game.scores[row][col] : SCORE_NONE;
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
	console.log(getColoredString((`Bot: ${bot.getDescription().name} - ${bot.getDescription().description}`).padEnd(100, " "), "blue"));
	console.log("");
	if (isAllGamesWon()) {
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
];

init();
// process.exit();