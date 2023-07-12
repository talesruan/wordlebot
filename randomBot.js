const execute = (gameState, dictionary) => {
	console.log("executing");
	const index = Math.trunc(Math.random() * dictionary.length);
	console.log("word index " + index);
	return dictionary[index];
}

module.exports = {
	execute
};