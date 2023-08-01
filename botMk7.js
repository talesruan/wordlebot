const scores = require("./scores");
const gameRender = require("./gameRender");

/**
 * Mk5 bot
 */

let cache = {count: 0};

const getDescription = () => ({
	name: "Mk7",
	description: "Brute force tests all words + multigame support + double word scoring + precalculated values"
});

const execute = (games, dictionary, rules, logger = console) => {


	if (games.every(game => game.isWon() || game.isLost())) {
		logger.log("My job here is done.");
		return;
	}

	// const game = games.find(game => !game.isWon());

	const attemptNumber = games.map(game => game.attempts.length).reduce((a,b) => Math.max(a,b));

	if (attemptNumber === 0) {
		logger.log("Using hardcoded starter");
		return "AUDIO";
	}
	if (attemptNumber === 1 && games.length === 1) {

		logger.log("Using precalculation");
		const precalculation = getPrecalculation(getDescription().name, "AUDIO", games[0].rules.language);
		const score = games[0].scores[0];
		const scoreString = score.join("");
		return precalculation[scoreString];

		// return "TERAS";
	}

	const runningGames = games.filter(game => game.isRunning());

	const dictionaryWithFilters = {
		dictionary,
		filters: []
	}

	const listsOfScoredWords = [];
	for (const game of runningGames) {
		let possibleWords = getPossibleWords(game, dictionaryWithFilters);
		logger.log("Possible words: " + possibleWords.dictionary.length);

		// if (possibleWords.dictionary.length < 50) {
		// 	printWords(possibleWords.dictionary);
		// }
		if (possibleWords.dictionary.length === 0) {
			logger.log("No possible words. Don't know what to do.");
			return "XXXXX";
		} else if (possibleWords.dictionary.length === 1) {
			logger.log("Got it!");
			return possibleWords.dictionary[0];
		}

		if (runningGames.length === 1) {
			const attemptsLeft = game.rules.maxNumberOfAttempts - attemptNumber;

			if (attemptsLeft === 1) {
				logger.log("Last chance, will have to guess the answer");
				return possibleWords.dictionary[0];
			} else if (attemptsLeft >= 2 && possibleWords.dictionary.length === 2) {
				logger.log("2 possible words left. Guessing word.");
				return possibleWords.dictionary[0];
			}
		}
		// Evaluates playable words:
		listsOfScoredWords.push(scoreAllPlayableWords (game, dictionary, possibleWords, logger));
	}

	// chooses best word
	const aggregatedList = aggregateScoredWordLists(listsOfScoredWords);

	if (aggregatedList.length === 0) {
		logger.log("No possible words. Don't know what to do.");
		return "XXXXX";
	}
	// gets best word

	aggregatedList.sort((a, b) => (b.avgScore - a.avgScore));
	// aggregatedList.sort((a, b) => (a.avgAvgPossibleWords - b.avgAvgPossibleWords));

	const topScore = aggregatedList[0].avgScore;

	const topScoringWords = aggregatedList.filter(x => x.avgScore >= topScore * 0.95);
	const numberOfConsideredWords = Math.min(topScoringWords.length + 5, 50);

	const candidateWords = [];
	for (let i = 0; i < numberOfConsideredWords; i++) {
		const x = aggregatedList[i];
		// logger.log(`${x.word}\t${x.avgScore}`);
		candidateWords.push(x);
	}

	const previousPlays = getPreviousPlays(games).map(playWord => playWord.split(""));
	let previousLetters = {}
	for (const previousPlay of previousPlays) {
		for (const previousLetter of previousPlay) {
			previousLetters[previousLetter] = true;
		}
	}

	for (const candidateWord of candidateWords) {
		candidateWord.candidateScore = scoreCandidateWord(candidateWord.word, games, previousPlays, previousLetters);
		candidateWord.compoundScore = candidateWord.candidateScore + candidateWord.avgScore;
	}

	candidateWords.sort((a, b) => (b.compoundScore - a.compoundScore));

	logger.log("WORD\tSCORE\tCD SCORE\tCOMPOUND SCORE");
	for (const x of candidateWords) {
		logger.log(`${x.word}\t${x.avgScore.toFixed(4)}\t${x.candidateScore.toFixed(4)}\t${x.compoundScore.toFixed(4)}`);
	}

	logger.log("Playing", JSON.stringify(candidateWords[0], null, 2));
	
	return candidateWords[0].word;
};

const scoreCandidateWord = (word, games, previousPlays, previousLetters) => {
	const pointsPerUniqueLetter = 2;

	let score = getUniqueLetters(word).length * pointsPerUniqueLetter;
	const runningGames = games.filter(game => game.isRunning());
	let sumOfGameScores = 0;
	for (const game of runningGames) {
		const thisGameScore = scoreCandidateWordByGame(word, game, previousPlays, previousLetters);
		sumOfGameScores += thisGameScore;
	}
	const avgOfGameScores = sumOfGameScores / runningGames.length;
	score += avgOfGameScores;
	return score;
};

const getUniqueLetters = (word) => {
	let uniqueLetters = ""
	for (const letter of word.split("")) {
		if (uniqueLetters.includes(letter)) continue;
		uniqueLetters += letter;
	}
	return uniqueLetters;
};

const scoreCandidateWordByGame = (word, game, previousPlays, previousLetters) => {
	const newLetterBlankPos = 2; // new letter, no green letter at pos
	const newLetter = 1; // new letter but has green letter at pos
	const sameLetterNewPos = 1;
	const sameLetterSamePos = -1;
	const useGrayLetter = -3;
	const useYellowLetter = 2;
	const useGreenLetter = -1;
	const scoresByLetter = game.getScoresByLetter();

	const topScoreByColumn = getTopScoreByColumn(game);
	let score = 0;
	for (let iLetter = 0; iLetter < word.length; iLetter++) {
		const hasPreviousGreenLetterInThisColumn = topScoreByColumn[iLetter] === scores.SCORE_GREEN;
		const letter = word[iLetter];
		const isLetterNotPresent = scoresByLetter[letter] === scores.SCORE_GRAY;
		const usedYellowLetter = scoresByLetter[letter] === scores.SCORE_YELLOW;
		const usedGreenLetter = scoresByLetter[letter] === scores.SCORE_GREEN;
		const isNewLetter = !previousLetters[letter];
		if (isNewLetter) {
			if (hasPreviousGreenLetterInThisColumn) {
				score += newLetter;
			} else {
				score += newLetterBlankPos;
			}
		} else {
			const hasSameLetterInThisColumn = getLettersInColumn(game, iLetter).includes(letter)
			if (hasSameLetterInThisColumn) {
				score += sameLetterSamePos;
			} else {
				score += sameLetterNewPos;
			}
		}

		if (isLetterNotPresent) score += useGrayLetter;
		if (usedYellowLetter) score += useYellowLetter;
		if (usedGreenLetter) score += useGreenLetter;
	}
	return score;
};

const getLettersInColumn = (game, column) => {
	return game.attempts.map(word => word[column]);
};

const getTopScoreByColumn = (game) => {
	const topScores = [];
	for (let col = 0; col < game.rules.numberOfLetters; col++) {
		let topScore = 0;
		for (const wordScore of game.scores) {
			const colScore = wordScore[col];
			if (colScore > topScore) topScore = colScore;
		}
		topScores[col] = topScore;
	}
	return topScores;
};

const getPreviousPlays = (games) => {
	const turnsTaken = games.map(game => game.attempts.length).reduce((a,b) => Math.max(a,b));
	return games.find(game => game.attempts.length === turnsTaken).attempts;
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

const scoreAllPlayableWords = (game, dictionary, possibleWords, logger) => {
	logger.log("Testing all playable words...");
	let n = 0;
	const scoredWords = [];
	for (const playWord of dictionary) {
		n++;
		if (n % 1000 === 0) logger.log("Progress: ", `(${(n / dictionary.length * 100).toFixed(2)}%)`);
		let totalPossibleWords = 0;
		for (const possibleWord of possibleWords.dictionary) {
			totalPossibleWords += testHypothesis(game, playWord, possibleWord, possibleWords)
		}
		const avgPossibleWords = totalPossibleWords / possibleWords.dictionary.length;
		const reduction = possibleWords.dictionary.length - avgPossibleWords;
		const x = reduction / (possibleWords.dictionary.length - 1) * 100;
		// logger.log(`If I play ${playWord}, the number of possible words will reduce by ${reduction}, remaining ${avgPossibleWords} words on average, reduction of ${x}%`);
		const wordScore = reduction;
		scoredWords.push({
			word: playWord,
			// score: wordScore, // lower = better -> 1 = must play
			score: x,
			avgPossibleWords,
		})
	}
	return scoredWords;
}

const getNumberOfCurrentAttempts = (games) => {
	return games[0].attempts.length;
};

const testHypothesis = (game, nextWord, chosenWord, dictionary) => {
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
	if (cache[cacheKey]) return cache[cacheKey];

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

const clearCache = () => {
	cache = {count: 0};
};

const trimCache = (logger = console) => {
	const limit = 200000;
	const cacheEntries = Object.keys(cache).length;
	if (cacheEntries > limit) {
		logger.log(`${" ".repeat(60)}Clearing cache entries: ${Object.keys(cache).length}/${limit}`);
		cache = {count: 0};
	} else {
		logger.log(`${" ".repeat(60)}Cache is fine: ${Object.keys(cache).length}/${limit}`);
	}
};

const getPrecalculation = (botName, starter, language) => {
	const fs = require("fs");
	const fileName = `${botName}-${starter}-${language}`.toLowerCase();
	const file = fs.readFileSync(`./precalculated/${fileName}.json`, "utf8");
	return JSON.parse(file);
}

const printWords = (dict, logger) => {
	const wordsByLine = 20;
	let string = "";
	for (let i = 0; i < dict.length; i++) {
		string += dict[i] + ((i + 1) % wordsByLine === 0 ? "\n" : " ");
	}
	logger.log(string);
}

module.exports = {
	execute,
	getDescription,
	clearCache,
	trimCache
};