const scores = require("./scores");

/**
 * Mk5 bot
 */

const cache = {count: 0};

const getDescription = () => ({
	name: "Mk5",
	description: "Brute force tests all words + multigame support"
});

const execute = (games, dictionary, rules) => {

	console.time("Bot execution");

	if (games.every(game => game.isWon() || game.isLost())) {
		console.log("My job here is done.");
		return;
	}

	// const game = games.find(game => !game.isWon());

	if (getNumberOfCurrentAttempts(games) === 0) {
		console.log("Using hardcoded starter");
		return "AUDIO";
	}
	// if (getNumberOfCurrentAttempts(games) === 1) {
	// 	return "MUNDI";
	// }

	const runningGames = games.filter(game => game.isRunning());

	const dictionaryWithFilters = {
		dictionary,
		filters: []
	}

	const listsOfScoredWords = [];
	for (const game of runningGames) {
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

		// Evaluates playable words:
		listsOfScoredWords.push(scoreAllPlayableWords (game, dictionary, possibleWords));
	}

	// chooses best word
	const aggregatedList = aggregateScoredWordLists(listsOfScoredWords);

	if (aggregatedList.length === 0) {
		console.log("No possible words. Don't know what to do.");
		return "XXXXX";
	}



	// gets best word

	// aggregatedList.sort((a, b) => (b.avgScore - a.avgScore));
	aggregatedList.sort((a, b) => (a.avgAvgPossibleWords - b.avgAvgPossibleWords));

	// console.log(`WORD\tSCORE\tPOSSIBLE WORDS`);
	// for (const x of aggregatedList) {
	// 	console.log(`${x.word}\t${x.avgScore}\t${x.avgAvgPossibleWords}`);
	// }

	console.timeEnd("Bot execution");
	return aggregatedList[0].word;
};

const aggregateScoredWordLists = (lists) => {
	const aggregatedList = [];
	for (let wordIndex = 0; wordIndex < lists[0].length; wordIndex++) {
		const aggregatedWord = {
			word: lists[0][wordIndex].word
		}
		aggregatedList.push(aggregatedWord);

		const listElements = [];
		for (let listIndex = 0; listIndex < lists.length; listIndex++) {
			const listElement = lists[listIndex][wordIndex];
			listElements.push(listElement);
		}

		if (listElements.some(x => x.word !== aggregatedWord.word)) throw new Error();

		aggregatedWord.avgScore = listElements.map(x => x.score).reduce((a, b) => (a + b)) / listElements.length;
		aggregatedWord.avgAvgPossibleWords = listElements.map(x => x.avgPossibleWords).reduce((a, b) => (a + b)) / listElements.length;

	}
	return aggregatedList;
}

const scoreAllPlayableWords = (game, dictionary, possibleWords) => {
	// const dictionaryWithFilters = {
	// 	dictionary,
	// 	filters: []
	// }
	// let possibleWords = getPossibleWords(game, dictionaryWithFilters);
	//
	// // printWords(possibleWords);
	// console.log("Possible words: " + possibleWords.dictionary.length);
	// if (possibleWords.length === 0) {
	// 	console.log("No possible words. Don't know what to do.");
	// 	return "XXXXX"; // TODO
	// } else if (possibleWords.dictionary.length === 1) {
	// 	console.log("Got it!");
	// 	return possibleWords.dictionary[0]; // TODO
	// }

	console.log("Testing all playable words...");
	// console.time("Time");
	let n = 0;
	let highScore = 0;
	let highScoreWords = [];
	const scoredWords = [];
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

		scoredWords.push({
			word: playWord,
			score: wordScore, // lower = better -> 1 = must play
			avgPossibleWords,
		})

		// if (wordScore === highScore) {
		// 	highScoreWords.push(playWord);
		// } else {
		// 	if (wordScore > highScore) {
		// 		// console.log(`'${playWord}' got new Highscore of `, wordScore);
		// 		highScore = wordScore;
		// 		highScoreWords = [playWord]
		// 	}
		// }
	}
	return scoredWords;
}

const getNumberOfCurrentAttempts = (games) => {
	return games[0].attempts.length;
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
			if (letterScore === scores.SCORE_GRAY) {
				// Cannot have that letter
				addFilter(newFilters, `gray,${letter}`);
			} else if (letterScore === scores.SCORE_YELLOW) {
				// has letter in the word, but NOT in this position
				addFilter(newFilters, `yellow,${letter},${pos}`);
			} else if (letterScore === scores.SCORE_GREEN) {
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
	execute,
	getDescription
};