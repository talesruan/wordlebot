const gameRunner = require("./gameRunner");
const fs = require("fs");
const database = require("./database");

let dictionary;
const run = async () => {

	await database.none("drop table words");

	await database.none(`
			create table words (
				id serial not null primary key,
				word text
			);`);

	const params = getDictionary().map(word => `('${word}')`).join(",");
	// console.log("params", JSON.stringify(params, null, 2));

	console.log("Inserting words...");
	await database.none(`insert into words (word) values ${params};`);

	const lettersStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	console.log("Creating calculation columns");

	const calculationColumns = [];

	for (const letter of lettersStr.split("")) {
		const hasColumn = "has" + letter;
		await database.none(`alter table words add column ${hasColumn} boolean not null default false`);
		calculationColumns.push(hasColumn);
		for (let i = 0; i < 5; i++) {
			const letterAtPos = `${letter}${i}`
			await database.none(`alter table words add column ${letterAtPos} boolean not null default false`);
			calculationColumns.push(letterAtPos);
		}
	}

	const words = await database.query("select id, word from words");

	console.log("Inserting calculations");

	for (const wordRow of words) {
		const updates = [];
		const letters = wordRow.word.split("");
		for (let i = 0; i < 5; i++) {
			const letter = letters[i];
			addUnique(updates,`has${letter} = true`);
			addUnique(updates,`${letter}${i} = true`);
		}
		await database.none(`update words set ${updates.join(",")} where id = ${wordRow.id}`);
	}

	console.log("Creating indexes");
	for (const calculationColumn of calculationColumns) {
		await database.none(`CREATE INDEX ON words (${calculationColumn});`)
	}
};

const addUnique = (array, newElement) => {
	if (array.includes(newElement)) return;
	array.push(newElement);
};


const getDictionary = () => {
	if (dictionary) return dictionary;
	const dictionaryFile = fs.readFileSync("./dictionaries/termo.json", "utf8");
	dictionary = JSON.parse(dictionaryFile).map(w => normalizeDictionaryWord(w)).filter(w => w.length === 5);

	// const dictionaryFile = fs.readFileSync("./dictionaries/portuguese.txt", "utf8");
	// dictionary = dictionaryFile.split("\n").filter(word => word.length === numberOfLetters).map(w => normalizeDictionaryWord(w));

	if (dictionary.length === 0) throw new Error("Dictionary is empty.");
	return dictionary;
};

const normalizeDictionaryWord = (word) => {
	return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}


run().then(() => {
	console.log("Done.");
});