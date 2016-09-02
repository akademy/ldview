/* Make a copy of this and rename to "config-local.js", fill in the blanks. */
module.exports = {
	databaseUrl: /\?/,        // e.g. "mongodb://localhost:port/db"
	port: /\?/,               // e.g. 3001
	
	fuseki : {
		host : /\?/,          // "localhost",
		port : /\?/,          //"3030",
		dataset : /\?/,        // "test1"
		username : /\?/,        // "admin"
		password : /\?/        // "my_hard-password;"
	}
};