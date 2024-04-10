const bot = require("./botMk6");
const scores = require("./scores");
const gameRender = require("./gameRender");
const Game = require("./Game");
const rules = require("./rules").termoRules;
const fs = require("fs");

const numberOfLetters = rules.numberOfLetters;
const starterWord = "SERIA";

let dictionary;

run = async () => {
	getDictionary();

	const allScorings = getAllScorings();
	// console.log("getAllScorings()", JSON.stringify(allScorings.map(a => a.join("")), null, 2));

	const sample = [
		allScorings[0],
		allScorings[10],
		allScorings[50],
		allScorings[100],
		allScorings[150],
		allScorings[200],
		allScorings[82],
	];

	const calculatedPlays = {};

	let runs = 0;
	// for (const score of sample) {
	for (const score of allScorings) {
		if (score.every(point => point === scores.SCORE_GREEN)) continue;
		if (runs % 10 === 0) {
			console.log(" ".repeat(60)+ `>> Clearing cache`);
			bot.clearCache();
		}
		if (runs % 1 === 0) console.log(" ".repeat(60)+ ">> Precalc Progress: ", `(${(runs / allScorings.length * 100).toFixed(2)}%)`, runs);
		console.log("Testing score:", score.join(""));
		const game = newGame();
		game.scores.push(score);
		const guess = await getBotGuess(game);
		game.attempts.push(guess);
		// gameRender.render({rules, games: [game], bot, noClear: true, drawBoardOnly: true});
		calculatedPlays[score.join("")] = guess;
		runs++;
	}

	console.log("");
	console.log("RESULTS");
	console.log("");
	console.log(JSON.stringify(calculatedPlays, null, 2));




};

const getBotGuess = async (game) => {
	const rawBotGuess = (await bot.execute([game], dictionary, rules));
	if (!rawBotGuess) throw new Error("Bot refused to play.");
	return rawBotGuess.toUpperCase()
}

const newGame = () => {
	const game = new Game(rules);
	game.attempts.push(starterWord);
	return game;
}

const points = [
	scores.SCORE_GRAY,
	scores.SCORE_YELLOW,
	scores.SCORE_GREEN
];

const getAllScorings = () => {
	const scores = [];
	for (const p1 of points) {
		for (const p2 of points) {
			for (const p3 of points) {
				for (const p4 of points) {
					for (const p5 of points) {
						scores.push([p1, p2, p3, p4, p5]);
					}
				}
			}
		}
	}
	return scores;
};

const getDictionary = () => {
	if (dictionary) return dictionary;
	const dictionaryFile = fs.readFileSync("./dictionaries/termo.json", "utf8");
	dictionary = JSON.parse(dictionaryFile).map(w => normalizeDictionaryWord(w)).filter(w => w.length === 5);

	// const dictionaryFile = fs.readFileSync("./dictionaries/portuguese.txt", "utf8");
	// dictionary = dictionaryFile.split("\n").filter(word => word.length === numberOfLetters).map(w => normalizeDictionaryWord(w));

	if (dictionary.length === 0) throw new Error("Dictionary is empty.");
	return dictionary;
};

const normalizeDictionaryWord = (word) => {
	return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

run().then(r => console.log("Done.")).catch(error => console.error(error));