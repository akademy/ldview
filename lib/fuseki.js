var http = require( "http" );

//
// wget --post-file my.jsonld --header="Content-Type: application/ld+json; charset=UTF-8" http://localhost:3030/dataset1/data
//

var fuseki = {
	version : "0.0.1",
	versionFusekiServer : "2.3.1",
	debug : false,
	
	connector : function( host, port ) {

		function httpOptions( dataset, graph, method, content ) {
			
			var path = '/' + dataset + "/data";

			if( graph ) {
				path += "?graph="+ graph;
			}

			return {
				hostname: host,
				port: port,
				path: path,
				method: method,
				headers: {
					'Content-Type': content
				}
			};
		}

		function createOkHandler( callback ) {

			return function( res ) {

				//if (res.statusCode !== 200) {
				//	if (callback) {
				//		callback(new Error({"error": "Status code is " + res.statusCode}))
				//	}
				//}
				//else {
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

							console.log("ondata");
							callback(null, result);
						}
					});
				//}
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

		function putTurtle( turtle, dataset, graph, callback ) {
			var options = httpOptions(dataset, graph, "PUT", "text/turtle; charset=uft-8" );

			var req = http.request( options, createOkHandler( callback ) );
			req.on('error', createErrorHandler( callback ) );
			req.write(turtle);
			req.end();
		}

		function postJson( json, dataset, graph, callback ) {

			if( typeof json !== 'string' || ! json instanceof String ) {
				json = JSON.stringify(json);
			}

			var options = httpOptions(dataset, graph, "POST", 'application/ld+json; charset=UTF-8' );

			var req = http.request( options, createOkHandler( callback ) );
			req.on('error', createErrorHandler( callback ) );
			req.write(json);
			req.end();
		}
		
		return {
			sendJsonLd :  function( jsonld, dataset, callback ) {
				postJson( jsonld, dataset, null, callback )
			},
			sendJsonLdToNamed :  function( jsonld, dataset, graph, callback ) {
				postJson( jsonld, dataset, graph, callback )
			},
			sendTurtle : function( turtle, dataset, callback ) {
				putTurtle( turtle, dataset, null, callback );
			},
			sendTurtleToNamed : function( turtle, dataset, graph, callback ) {
				putTurtle( turtle, dataset, graph, callback );
			},
			clearDataset : function( dataset, callback ) {
				putTurtle( "", dataset, callback );
			}
		};
	}
}

;

module.exports = fuseki;