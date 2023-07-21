const options = {
	error (err, e) {
		if (e.query) {
			console.log("Error", e.query);
		}
		console.log(e);
	}
};

const pgp = require("pg-promise")(options);

pgp.pg.types.setTypeParser(20, function (val) {
	return parseInt(val);
});

pgp.pg.types.setTypeParser(1700, (value) => {
	return parseFloat(value);
});


const config = {
	user: 'postgres',
	database: 'wordlebot',
	password: '123456',
	host: 'localhost',
	port: 5432,
	max: 15,
	poolSize: 5,
};

module.exports = pgp(config);