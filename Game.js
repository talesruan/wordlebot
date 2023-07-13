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

};