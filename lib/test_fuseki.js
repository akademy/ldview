/**
 * Created by matthew on 7/12/16.
 */

var fuseki = require("./fuseki");
fuseki.debug = true;

var host = "localhost";
var port = "3030";
var dataset = "__youCanNotTakeSkyFromMe__";

var username = "admin";
var password = "qyB1G3PaIWDr5xB";

console.log( "Connecting to Fuseki...");
fuseki = fuseki.create( host, port, dataset, username, password );

console.log( "Creating dataset..." );
fuseki.createDataset( dataset, "mem", function(error) {
	if( error ) {
		console.error("Failed to create dataset,", error);
	}
	else {
		var jsonld = [
			{
				"@id": "http://fast-project.annalist.net/annalist/c/Performances/d/Musician/Steve_Benford",
				"@type": [
					"http://id.annalist.net/collMusician",
				],
				"http://purl.org/annalist/2014/#type": [
					{
						"@id": "http://id.annalist.net/collMusician"
					}
				],
				"http://purl.org/annalist/2014/#type_id": [
					{
						"@value": "Musician"
					}
				],
				"http://www.w3.org/2000/01/rdf-schema#label": [
					{
						"@value": "Thomas I. M. Epp"
					}
				]
			}
		];

		console.log("Sending JSONLD...");
		fuseki.sendJsonLd(jsonld, function (error, result) {
			if (error) {
				console.error("Sending JSONLD error,", error);
			}
			else {
				if (result.count !== 4) {
					console.error("JSON-LD insert has not inserted 4 triples", result);
				}
				else {
					console.log("Clearing Fuseki...");
					fuseki.clearDataset(function (error) {
						if (error) {
							console.error("Error in Clearing,", error);
						}
						else {
							console.log("Everything Good.");
						}
					});
				}
			}
		});
	}
} );





