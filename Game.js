const SCORE_GREEN = 3;
const SCORE_YELLOW = 2;
const SCORE_GRAY = 1; // Attempted
const SCORE_NONE = 0; // Not attempted

module.exports = class Game {

	attempts = [];
	scores = [];
	rules;

	constructor(rules) {
		this.rules = rules;
	}

	isWon () {
		return this.scores.some(score => score.every(letterScore => letterScore === SCORE_GREEN));
	}

	isLost () {
		return this.attempts.length >= this.rules.maxNumberOfAttempts;
	}

	isRunning () {
		return !this.isLost() && !this.isWon();
	}

	addScore(word, chosenWord) {
		this.scores.push(getWordScore(word, chosenWord, this.rules));
	}

};

const getWordScore = (attemptedWord, chosenWord, rules) => {
	const wordScores = [];
	for (let pos = 0; pos < rules.numberOfLetters; pos++) {
		const letter = attemptedWord[pos];
		const letterScore = getLetterScore(chosenWord, letter, pos);
		wordScores.push(letterScore)
	}
	return wordScores;
};

const getLetterScore = (chosenWord, letter, position) => {
	if (chosenWord[position] === letter) return SCORE_GREEN;
	if (chosenWord.split("").includes(letter)) return SCORE_YELLOW;
	return SCORE_GRAY;
};