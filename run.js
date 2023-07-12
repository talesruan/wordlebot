const fs = require("fs");
const readline = require('readline').createInterface({input: process.stdin, output: process.stdout,});
const keypress = require('keypress');

const run = () => {
	keypress(process.stdin);
	process.stdin.on('keypress', function (ch, key) {
		// console.log('got "keypress"', key);
	});
	process.stdin.setRawMode(true);

};

run();
// process.exit();