/**
 * Mk3 bot
 */


const SCORE_GREEN = 3;
const SCORE_YELLOW = 2;
const SCORE_GRAY = 1; // Attempted
const SCORE_NONE = 0; // Not attempted

const cache = {count: 0};
const execute = (game, dictionary) => {
	if (game.attempts.length === 0) {
		console.log("First attempt, so using hardcoded starter");
		return "AUDIO";
	}
	// if (game.attempts.length === 1) {
	// 	console.log("Second attempt, so using hardcoded starter");
	// 	return "TERAS";
	// }
	const dictionaryWithFilters = {
		dictionary,
		filters: []
	}
	let possibleWords = getPossibleWords(game, dictionaryWithFilters);

	// printWords(possibleWords);
	console.log("Possible words: " + possibleWords.dictionary.length);
	if (possibleWords.length === 0) {
		console.log("No possible words. Don't know what to do.");
		return "XXXXX";
	} else if (possibleWords.dictionary.length === 1) {
		console.log("Got it!");
		return possibleWords.dictionary[0];
	}

	console.log("Testing all playable words...");
	console.time("Time");
	let n = 0;
	let highScore = 0;
	let highScoreWords = [];
	for (const playWord of dictionary) {
		n++;
		if (n % 1000 === 0) console.log("Progress: ", `(${(n / dictionary.length * 100).toFixed(2)}%)`);
		let totalPossibleWords = 0;
		// console.time(`Test ${playWord} against ${possibleWords.dictionary.length} possible words`);
		for (const possibleWord of possibleWords.dictionary) {
			totalPossibleWords += testHypothesis(game, playWord, possibleWord, possibleWords)
		}
		// console.timeEnd(`Test ${playWord} against ${possibleWords.dictionary.length} possible words`);
		const avgPossibleWords = totalPossibleWords / possibleWords.dictionary.length;
		const reduction = possibleWords.dictionary.length - avgPossibleWords;
		// console.log(`If I play ${playWord}, the number of possible words will reduce by ${reduction}, remaining ${avgPossibleWords} words on average.`);

		const wordScore = reduction;
		if (wordScore === highScore) {
			highScoreWords.push(playWord);
		} else {
			if (wordScore > highScore) {
				// console.log(`'${playWord}' got new Highscore of `, wordScore);
				highScore = wordScore;
				highScoreWords = [playWord]
			}
		}
	}
	console.timeEnd("Time");

	console.log("These words got a score of ", highScore);
	printWords(highScoreWords)

	if (highScoreWords.length === 0) {
		console.log("No possible words. Don't know what to do.");
		return "XXXXX";
	}

	return highScoreWords[0];
};

const testHypothesis = (game, nextWord, chosenWord, dictionary) => {
	// const testGame = game.clone();
	const testGame = game;
	testGame.attempts.push(nextWord);
	testGame.addScore(nextWord, chosenWord);
	const numberOfPossibleWords = getPossibleWords(testGame, dictionary, true).dictionary.length
	testGame.undo();
	return numberOfPossibleWords;
}

const getPossibleWords = (game, dictionaryWithFilters, onlyLastFilter) => {

	if (!(dictionaryWithFilters instanceof Object)) throw new Error("Expect dictionary with filters");
	if (!(dictionaryWithFilters.filters instanceof Array)) throw new Error("Missing filters");
	if (!(dictionaryWithFilters.dictionary instanceof Array)) throw new Error("Missing dictionary");

	// const filters = [...dictionaryWithFilters.filters];
	const newFilters = []

	const startIndex = onlyLastFilter ? game.attempts.length - 1 : 0;

	for (let attemptIndex = startIndex; attemptIndex < game.attempts.length; attemptIndex++) {
		const attemptedWord = game.attempts[attemptIndex];
		for (let pos = 0; pos < game.rules.numberOfLetters; pos++) {
			const letter = attemptedWord[pos];
			const letterScore = game.scores[attemptIndex][pos];
			if (letterScore === SCORE_GRAY) {
				// Cannot have that letter
				addFilter(newFilters, `gray,${letter}`);
			} else if (letterScore === SCORE_YELLOW) {
				// has letter in the word, but NOT in this position
				addFilter(newFilters, `yellow,${letter},${pos}`);
			} else if (letterScore === SCORE_GREEN) {
				// letter in the position
				addFilter(newFilters, `green,${letter},${pos}`);
			}
		}
	}

	// filters.sort();

	const possibleWords = applyFilters(dictionaryWithFilters, newFilters);
	return possibleWords;
};

const addFilter = (filters, newFilter) => {
	if (filters.includes(newFilter)) return;
	filters.push(newFilter);
};

const applyFilters = (dictionaryWithFilters, newFilters) => {
	const onlyNewFilters = newFilters.filter(f => !dictionaryWithFilters.filters.includes(f));
	const combinedFilters = [...dictionaryWithFilters.filters, ...onlyNewFilters];
	combinedFilters.sort();

	const cacheKey = combinedFilters.join("-");

	if (cache[cacheKey]) {
		// console.log("cache hit");
		return cache[cacheKey];
	}

	let filteredList = dictionaryWithFilters.dictionary;
	for (const filter of onlyNewFilters) {
		const parts = filter.split(",");
		const filterName = parts[0];
		const letter = parts[1];
		const pos = parts[2];
		if (filterName === "gray" ) {
			filteredList = filteredList.filter(word => !word.includes(letter));
		} else if (filterName === "yellow" ) {
			filteredList = filteredList.filter(word => word.includes(letter) && word[pos] !== letter);
		} else if (filterName === "green" ) {
			filteredList = filteredList.filter(word => word[pos] === letter);
		}
	}

	const data = {
		dictionary: filteredList,
		filters: combinedFilters
	};
	cache[cacheKey] = data;
	return data;
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