/**
 * Mk2 bot
 */


const SCORE_GREEN = 3;
const SCORE_YELLOW = 2;
const SCORE_GRAY = 1; // Attempted
const SCORE_NONE = 0; // Not attempted
const execute = (game, dictionary) => {
	if (game.attempts.length === 0) {
		console.log("First attempt, so using hardcoded starter");
		return "AUDIO";
	}
	// if (game.attempts.length === 1) {
	// 	console.log("Second attempt, so using hardcoded starter");
	// 	return "TERAS";
	// }
	let possibleWords = getPossibleWords(game, dictionary);

	// printWords(possibleWords);
	console.log("Possible words: " + possibleWords.length);
	if (possibleWords.length === 0) {
		console.log("No possible words. Don't know what to do.");
		return "XXXXX";
	} else if (possibleWords.length === 1) {
		console.log("Got it!");
		return possibleWords[0];
	}

	console.log("Testing all playable words...");
	console.time("Time");
	let n = 0;
	let highScore = 0;
	let highScoreWords = [];
	for (const playWord of dictionary) {
		n++;
		if (n % 100 === 0) console.log("Progress: ", `(${(n / dictionary.length * 100).toFixed(2)}%)`);
		let totalPossibleWords = 0;
		for (const possibleWord of possibleWords) {
			const test = testHypothesis(game, playWord, possibleWord, possibleWords);
			totalPossibleWords += test.numberOfPossibleWords;
			// console.log(`If I play ${playWord} and the chosen word is ${possibleWord} there will be ${test.numberOfPossibleWords} possible words.`);
		}
		const avgPossibleWords = totalPossibleWords / possibleWords.length;
		const reduction = possibleWords.length - avgPossibleWords;
		// console.log(`If I play ${playWord}, the number of possible words will reduce by ${reduction}, remaining ${avgPossibleWords} words on average.`);

		const wordScore = reduction;
		if (wordScore === highScore) {
			highScoreWords.push(playWord);
		} else {
			if (wordScore > highScore) {
				console.log(`'${playWord}' got new Highscore of `, wordScore);
				highScore = wordScore;
				highScoreWords = [playWord]
			}
		}
	}
	console.timeEnd("Time");

	console.log("These words got a score of ", highScore);
	printWords(highScoreWords)

	// TODO: FIX
	return highScoreWords[0];
};

const testHypothesis = (game, nextWord, chosenWord, dictionary) => {
	// const testGame = game.clone();
	const testGame = game;
	testGame.attempts.push(nextWord);
	testGame.addScore(nextWord, chosenWord);
	const numberOfPossibleWords = getPossibleWords(testGame, dictionary).length
	testGame.undo();
	return {
		numberOfPossibleWords
	}
}

const getPossibleWords = (game, dictionary) => {
	let possibleWords = dictionary;
	for (let attemptIndex = 0; attemptIndex < game.attempts.length; attemptIndex++) {
		const attemptedWord = game.attempts[attemptIndex];
		for (let pos = 0; pos < game.rules.numberOfLetters; pos++) {
			const letter = attemptedWord[pos];
			const letterScore = game.scores[attemptIndex][pos];
			if (letterScore === SCORE_GRAY) {
				// Cannot have that letter
				possibleWords = possibleWords.filter(word => !word.includes(letter));
			} else if (letterScore === SCORE_YELLOW) {
				// has letter in the word, but NOT in this position
				possibleWords = possibleWords.filter(word => word.includes(letter) && word[pos] !== letter);
			} else if (letterScore === SCORE_GREEN) {
				// letter in the position
				possibleWords = possibleWords.filter(word => word[pos] === letter);
			}
		}
	}
	return possibleWords;
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
	execute
};