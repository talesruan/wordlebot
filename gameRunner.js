const Game = require("./Game");
const gameRender = require("./gameRender");

/**
 * Runs a single game
 */
const run = async function (rules, words, bot, dictionary, renderEachGame = false, logger = console) {
	const games = []
	for (let i = 0; i < rules.numberOfGames; i++) {
		games.push(new Game(rules));
	}

	do {
		// console.time("Bot execution");
		const rawBotGuess = (await bot.execute(games, dictionary, rules, logger)).toUpperCase();
		// console.timeEnd("Bot execution");
		if (!rawBotGuess) throw new Error("Bot refused to play.");
		const botGuess = rawBotGuess.toUpperCase();
		console.log("> " + botGuess);

		for (let i = 0; i < rules.numberOfGames; i++) {
			const game = games[i];
			const chosenWord = words[i];
			if (!game.isRunning()) continue;
			game.attempts.push(botGuess);
			game.addScore(botGuess, chosenWord);
		}

	} while (games.some(game => game.isRunning()));
	// console.log(game.attempts);
	// console.log(game.scores);
	if (renderEachGame) gameRender.render({rules, autoScoreWords: words, games, bot});
	const turnsTaken = games.map(game => game.attempts.length).reduce((a,b) => Math.max(a,b));

	return {
		result: games.every(game => game.isWon()) ? "win" : "loss",
		turnsLeft: rules.maxNumberOfAttempts - turnsTaken
	}
};

module.exports = {
	run
};