const gameRunner = require("./gameRunner");
// const bot = require("./basicBot");
// const bot = require("./botMk6");
const bot = require("./botMk7");
const fs = require("fs");
const gameRender = require("./gameRender");
const ruleDefinitions = require("./rules");

let rules;
let dictionary;

// const preset = "termo-pizza";
// const preset = "termo-all";
const preset = "termo-all";
// const preset = "hard-quarteto";
const silent = true;

const normalizeDictionaryWord = (word) => {
	return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
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


const presets = {
	"termo-pizza": {
		rules: ruleDefinitions.termoRules,
		words: [["PIZZA"]]
	},
	"single-quarteto": {
		rules: ruleDefinitions.quartetoRules,
		// words: [["ARROZ", "ORGAO", "SUADO", "LARES"]]
		words: [["DOBRO", "IMPOR", "FILHA", "FRASE"]]
	},
	"hard-quarteto": {
		rules: ruleDefinitions.quartetoRules,
		words: [["ZEBRA", "PINTO", "ACHAR", "LUCRO"]]
	},
	// "termo-100": {
	// 	rules: ruleDefinitions.termoRules,
	// 	words: [
	// 		["TODO"]
	// 	]
	// },
	"termo-all": {
		rules: ruleDefinitions.termoRules,
		words: getDictionary().map(word => [word])
	},
	"termo-loserwords": {
		rules: ruleDefinitions.termoRules,
		words: [
			["BABES"],
			["BAJAR"],
			["FOCAR"],
			["GANGO"],
			["HABES"],
			["JANGO"],
			["JARRO"],
			["JAZES"],
			["JINGA"],
			["JORRA"],
			["MARMA"],
			["MARRA"],
			["NINHO"],
			["PALAR"],
			["PANGA"],
			["PAPES"],
			["PAPAO"],
			["PARRO"],
			["PAVAO"],
			["PAVES"],
			["PELAS"],
			["PINHO"],
			["RAJAR"],
			["RALAR"],
			["VAZES"],
			["VELAS"],
			["XANGO"],
			["XINGA"],
			["XOCAR"],
			["ZANGA"],
			["ZARRA"],
			["ZARZA"],
			["ZINHO"],
			["ZORRA"],
		]
	},
};

const run = async () => {
	// const list = [
	// 	// "XXXXA", // lost
	// 	// "XXXXB", // lost
	// 	"AUDIO", // instant win
	// 	"PIZZA", // win 1 turn left
	// 	"DRENO", // win 1 turn left
	// 	"TREME", // win 3 turns left
	// 	"LIMPA", // win 0 turns left
	// 	"LIMPO" // win 1 turn left
	// ];

	let gameWords = [
		// ["NOTAR", "TESAO", "NULOS", "PARAR"], // real game
		// ["PARAR", "NULOS", "TESAO", "NOTAR"],
		// ["ZEBRA", "PINTO", "ACHAR", "LUCRO"], // hard game
		// ["RUBOR", "COURO", "DETER", "OUVIR"], // real game
		// ["PENIS"],
		// ["PIZZA"],
		["ARROZ", "ORGAO", "SUADO", "LARES"] // real game
	];

	if (preset && presets[preset]) {
		console.log(`Loading preset ${preset}`);
		const presetConfig = presets[preset];
		rules = presetConfig.rules;
		gameWords = presetConfig.words.map(line => line.map(w => normalizeDictionaryWord(w)).filter(w => w.length === rules.numberOfLetters));
	}

	let runs = 0;
	const stats = {
		runs: 0,
		wins: 0,
		losses: 0,
		winsByTurnsLeft: {}
	}

	const losses = [];
	console.time(`Total time`);

	const voidLogger = {
		log: () => {}
	}

	const logger = silent ? voidLogger: console;

	// for (const word of getDictionary().slice(8000, 8001)) {
	// for (const words of getDictionary().map(word => [word])) {
	for(const words of gameWords) {
		console.time(`>>> Words ${words.join(",")}`);

		if (stats.runs % 10 === 0) bot.trimCache();
		stats.runs++;
		if (stats.runs % 1 === 0) console.log("-".repeat(50) + "Bot analyzer Progress: ", `(${(stats.runs / getDictionary().length * 100).toFixed(2)}%)`, stats.runs);
		const gameData = await gameRunner.run(rules, words, bot, getDictionary(), !silent, logger);
		// console.log("Game Results:");
		// console.log("result", JSON.stringify(gameData, null, 2));

		console.log(`${words.join(",")} - ${gameData.result} - ${gameData.turnsLeft} turns left`);
		if (gameData.result === "loss") {
			stats.losses++;
			losses.push(words.join(","));
		} else if (gameData.result === "win") {
			stats.wins++;
			stats.winsByTurnsLeft[gameData.turnsLeft] = (stats.winsByTurnsLeft[gameData.turnsLeft] || 0) + 1;
		}
		console.timeEnd(`>>> Words ${words.join(",")}`);
	}
	console.log("");
	console.log("FINISHED");
	console.log("========================================");
	console.log("");
	console.log("> Losses: ");
	for (const loss of losses) {
		console.log("- " + loss);
	}
	console.log("");
	console.timeEnd(`Total time`);
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

run().then(() => {
	console.log("Done.");
});