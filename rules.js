const termoRules = {
	numberOfLetters: 5,
	maxNumberOfAttempts: 6,
	numberOfGames: 1,
	language: "ptbr"
};

const duetoRules = {
	numberOfLetters: 5,
	maxNumberOfAttempts: 7,
	numberOfGames: 2,
	language: "ptbr"
};

const quartetoRules = {
	numberOfLetters: 5,
	maxNumberOfAttempts: 9,
	numberOfGames: 4,
	language: "ptbr"
};

const allRules = [
	{name: "Termo", rules: termoRules},
	{name: "Dueto", rules: duetoRules},
	{name: "Quarteto", rules: quartetoRules},
	{name: "Sexteto", rules: {
			numberOfLetters: 5,
			maxNumberOfAttempts: 11,
			numberOfGames: 6
		}}
]

module.exports = {
	termoRules,
	wordleRules: termoRules,
	duetoRules,
	quartetoRules,
	allRules
};