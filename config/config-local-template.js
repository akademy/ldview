/* Make a copy of this and rename to "config-local.js", fill in the blanks. */
module.exports = {
	webPort: /\?/,               // e.g. 3001

	mongo : {
		host: /\?/,            // "localhost",
		port: /\?/,            //"27017",
		database: /\?/         //"ldview"
	},

	fuseki : {
		host : /\?/,          // "localhost",
		port : /\?/,          //"3030",
		dataset : /\?/,        // "test1",
		username : /\?/,        // "admin",
		password : /\?/        // "my_hard-password;"
	},

	// debugSaveJsonFiles : false,
	debug : false
};