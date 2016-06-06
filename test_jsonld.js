/**
 * Created by matthew on 5/13/16.
 */
var jsonld_request = require( "jsonld-request" );
var jsonld = require( "jsonld" );

// read from URL
var contextUrl = "http://fast-project.annalist.net/annalist/c/Performances/d/coll_context.jsonld";
var dataUrl = "http://fast-project.annalist.net/annalist/c/Performances/d/Ensemble/Phil_Langran_band/entity_data.jsonld?type=application/json";
var baseUrl = "http://fast-project.annalist.net/annalist/c/Performances/d/";

jsonld_request( contextUrl, function(err, response, data ) {

	// Fix Context with @base
	var contextJson = JSON.parse( response.body);
	contextJson["@context"]["@base"] = baseUrl;

	jsonld_request( dataUrl, function(err, response, data ) {

		// Remove reference to "old" context
		var dataJson = JSON.parse( response.body);
		delete dataJson["@context"];

		jsonld.compact(dataJson, contextJson, {}, function (err, compacted) {
			if (err) {
				console.log(err);
			}
			console.log(JSON.stringify(compacted, null, 2));

			jsonld.expand( compacted, {}, function( err, expanded ) {
				if (err) {
					console.log(err);
				}
				//console.log( expanded );
				console.log(JSON.stringify(expanded, null, 2));
			});
		});
	});
} );