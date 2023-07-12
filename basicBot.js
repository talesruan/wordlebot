/**
 * Simple bot, eliminates words it knows do not match
 */


const numberOfLetters = 5;
const SCORE_GREEN = 3;
const SCORE_YELLOW = 2;
const SCORE_GRAY = 1; // Attempted
const SCORE_NONE = 0; // Not attempted
const execute = (gameState, dictionary) => {
	if (gameState.attempts.length === 0) {
		console.log("First attempt, so using hardcoded starter");
		return "audio";
	}
	if (gameState.attempts.length === 1) {
		console.log("Second attempt, using hardcoded starter");
		return "teras";

	}

	let possibleWords = dictionary;
	for (let attemptIndex = 0; attemptIndex < gameState.attempts.length; attemptIndex++) {
		const attemptedWord = gameState.attempts[attemptIndex];
		for (let pos = 0; pos < numberOfLetters; pos++) {
			const letter = attemptedWord[pos];
			const letterScore = gameState.scores[attemptIndex][pos];
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

	printWords(possibleWords);
	console.log("Possible words: " + possibleWords.length);

	if (possibleWords.length === 0) {
		console.log("No possible words. Don't know what to do.");
		return "XXXXX";
	}
	return possibleWords[0];
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