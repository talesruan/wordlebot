const rules = require("./rules").termoRules;
const gameRunner = require("./gameRunner");
const bot = require("./botMk2");
const fs = require("fs");

let dictionary;
const run = () => {
	const list = [
		// "XXXXA", // lost
		// "XXXXB", // lost
		// "AUDIO", // instant win
		"TREMA", // win 1 turn left
		// "TREME", // win 3 turns left
		// "LIMPA", // win 0 turns left
		// "LIMPO" // win 1 turn left
	];

	let runs = 0;
	const stats = {
		runs: 0,
		wins: 0,
		losses: 0,
		winsByTurnsLeft: {}
	}
	// for (const word of getDictionary()) {
	for (const word of list) {
		stats.runs++;
		if (stats.runs % 100 === 0) console.log("Progress: ", `(${(stats.runs / getDictionary().length * 100).toFixed(2)}%)`, stats.runs);
		const gameData = gameRunner.run(rules, word, bot, getDictionary());
		// console.log("Game Results:");
		// console.log("result", JSON.stringify(gameData, null, 2));

		if (gameData.result === "loss") {
			stats.losses++;
		} else if (gameData.result === "win") {
			stats.wins++;
			stats.winsByTurnsLeft[gameData.turnsLeft] = (stats.winsByTurnsLeft[gameData.turnsLeft] || 0) + 1;
		}

	}
	console.log("");
	console.log("FINISHED");
	console.log("========================================");
	console.log("stats", JSON.stringify(stats, null, 2));
	console.log("");
	displayStats(stats);
};

const displayStats = (stats) => {
	console.log("RUNS...: ", stats.runs);
	console.log("LOSSES.: ", stats.losses, `(${(stats.losses / stats.runs * 100).toFixed(2)}%)`);
	console.log("WINS...: ", stats.wins, `(${(stats.wins / stats.runs * 100).toFixed(2)}%)`);
	console.log("WINS BY TURNS LEFT");
	for (let i = rules.maxNumberOfAttempts - 1; i >= 0; i--) {
		console.log(i + " TURNS: ", stats.winsByTurnsLeft[i] || 0, `(${((stats.winsByTurnsLeft[i] || 0) / stats.runs * 100).toFixed(2)}%)`);
	}
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


run();