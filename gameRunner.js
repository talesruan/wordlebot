const Game = require("./Game");

/**
 * Runs a single game
 */
const run = function (rules, chosenWord, bot, dictionary) {
	const game = new Game(rules);
	do {
		const botGuess = bot.execute(game, dictionary).toUpperCase();
		game.attempts.push(botGuess);
		game.addScore(botGuess, chosenWord);
	} while (game.isRunning());
	// console.log(game.attempts);
	// console.log(game.scores);

	return {
		result: game.isWon() ? "win" : "loss",
		turnsLeft: rules.maxNumberOfAttempts - game.attempts.length
	}
};

module.exports = {
	run
};