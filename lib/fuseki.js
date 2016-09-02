var http = require( "http" );
var querystring = require("querystring");

var sparql = require( "sparql" );

//
// wget --post-file my.jsonld --header="Content-Type: application/ld+json; charset=UTF-8" http://localhost:3030/dataset1/data
//

var fuseki = {
	version : "0.0.1",
	versionFusekiServer : "2.3.1",
	debug : false,
	
	create : function( host, port, dataset, username, password ) {

		var urlGraphStoreProtocol = '/' + dataset + "/data",
			urlSparql = '/' + dataset + "/sparql",
			urlDatasets = '/$/datasets/';

		function httpOptionsDatasets( dataset, method, content, username, password) {
			var path = urlDatasets;

			return httpOptions( path, method, content, username, password );
		}

		function httpOptionsGraphStoreProtocol( graph, method, content) {
			var path = urlGraphStoreProtocol;

			if( graph ) {
				path += "?graph="+ graph;
			}

			return httpOptions( path, method, content );
		}

		function httpOptions( path, method, content, username, password ) {

			var ops = {
				hostname: host,
				port: port,
				path: path,
				method: method,
				headers: {}
			};

			if( username && password ) {
				ops["auth"] = username + ":" + password;
			}

			if( content ) {
				ops['headers']['Content-Type'] = content;
			}
			
			return ops;
		}

		function createOkHandler( callback ) {

			return function( res ) {

				if (res.statusCode < 200 || res.statusCode > 299 ) {
					if (callback) {
						callback( new Error( res.statusCode + " " + res.statusMessage ), null );
					}
				}
				else {
					if (fuseki.debug) {
						console.log('Headers: ' + JSON.stringify(res.headers));
					}

					var body = "";
					res.setEncoding('utf8');
					res.on('data', function (chunk) {
						body += chunk;
					});
					res.on('end', function () {
						if (callback) {
							var result = null;
							try {
								result = JSON.parse(body)
							}
							catch (SyntaxError) {
								result = body;
							}

							callback(null, result);
						}
					});
				}
			};
		}

		function createErrorHandler( callback ) {
			return function ( error ) {
				console.log('problem with request: ' + error.message);
				if( callback ) {
					console.log( "error" );
					callback( error, null );
				}
			}
		}

		function putDataset( dataset, type, callback ) {
			var options = httpOptionsDatasets( dataset, "POST", "application/x-www-form-urlencoded; charset=UTF-8", username, password );
			var params = querystring.stringify({
				'dbName' : dataset,
				'dbType' : type // "mem" or "tdb"
			});
			var req = http.request( options, createOkHandler( callback ) );
			req.on('error', createErrorHandler( callback ) );
			req.write( params );
			req.end();
		}

		function putTurtle( turtle, graph, callback ) {
			var options = httpOptionsGraphStoreProtocol( graph, "PUT", "text/turtle; charset=uft-8" );

			var req = http.request( options, createOkHandler( callback ) );
			req.on('error', createErrorHandler( callback ) );
			req.write(turtle);
			req.end();
		}

		function postJson( json, graph, callback ) {

			if( typeof json !== 'string' || ! json instanceof String ) {
				json = JSON.stringify(json);
			}

			var options = httpOptionsGraphStoreProtocol( graph, "POST", 'application/ld+json; charset=UTF-8' );

			var req = http.request( options, createOkHandler( callback ) );
			req.on('error', createErrorHandler( callback ) );
			req.write(json);
			req.end();
		}
		
		return {
			createDataset : function( dataset, type, callback ) {
				if( !callback && typeof(type) === "function" ) {
					type = "tbd"; // or "mem"
				}
				putDataset( dataset, type, callback );
			},
			sendJsonLd :  function( jsonld, callback ) {
				postJson( jsonld, null, callback )
			},
			sendJsonLdToNamed :  function( jsonld, graph, callback ) {
				postJson( jsonld, graph, callback )
			},

			sendTurtle : function( turtle, callback ) {
				putTurtle( turtle, null, callback );
			},
			sendTurtleToNamed : function( turtle, graph, callback ) {
				putTurtle( turtle, graph, callback );
			},

			clearDataset : function( callback ) {
				putTurtle( "", null, callback );
			}
		};
	}
}

;

module.exports = fuseki;