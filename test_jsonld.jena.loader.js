var jsonld_request = require( "jsonld-request" );
var jsonld = require( "jsonld" );
var http = require("http");
var async = require('async');
var fuseki = require("./lib/fuseki");

fuseki.debug = true;
fuseki = fuseki.connector("localhost","3030");

var baseUrl =    "http://fast-project.annalist.net/annalist/c/Performances/d/";
var contextUrl = baseUrl + "coll_context.jsonld";

var jsons = [
	{
		dataUrl : baseUrl + "Ensemble/Phil_Langran_band/entity_data.jsonld?type=application/json",
		dataId : baseUrl + "Ensemble/Phil_Langran_band"
	},
	{
		dataUrl : baseUrl + "Musician/Phil_Langran/entity_data.jsonld",
		dataId : baseUrl + "Musician/Phil_Langran"
	},

	{
		dataUrl : baseUrl + "Musician/Steve_Benford/entity_data.jsonld",
		dataId : baseUrl + "Musician/Steve_Benford"
	}
];


async.each( jsons, function( json_data, complete ) {
	console.log("Requestion json");
	jsonld_request( contextUrl, function(err, response, data ) {

		// FIX: Fix Context with @base directive
		var contextJson = JSON.parse( response.body);
		contextJson["@context"]["@base"] = baseUrl;

		jsonld_request( json_data.dataUrl, function(err, response, data ) {

			// FIX: Insert reference to new context
			var dataJson = JSON.parse( response.body);
			dataJson["@context"] = contextJson["@context"];
			dataJson["@id"] = json_data.dataId;

			jsonld.expand( dataJson, {}, function( err, expanded ) {
				if (err) {
					console.log(err);
				}
				// The expanded (none context version) of jsonld.
				//console.log(JSON.stringify(expanded, null, 2));

				fuseki.sendJsonLd( expanded, "test1", function( error, result ) {
					if( error ) {
						console.log( "Something broke", error );
					}
					else {
						console.log( "Done something", result );
					}

					complete();
				} );
			});

		});
	} );

}, function () {
	// do something now.
	fuseki.clearDataset("test1");
});