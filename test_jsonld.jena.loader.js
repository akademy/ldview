var jsonld_request = require( "jsonld-request" );
var jsonld = require( "jsonld" );
var request = require( "request" );
var async = require('async');

var fuseki = require("./lib/fuseki");


var annalistDataUrlBase = 'http://annalist.net/annalist_sitedata/c/Carolan_Guitar/d/'; //  "http://fast-project.annalist.net/annalist/c/Performances/d/";
var annalistDataContextUrl = annalistDataUrlBase + "coll_context.jsonld";
var annalistJsonLdFileName = "entity_data.jsonld";

var fusekiDataset = "test1";

//fuseki.debug = true;
fuseki = fuseki.create("localhost","3030", fusekiDataset );


request( annalistDataUrlBase, function(error, response, body ) {

	var dataSubfolderNames = parseFolderList( body ).filter( filterUnwantedFiles );
	var jsonLdUrls = [];

	async.eachSeries( dataSubfolderNames, function ( dataSubfoldeName, completeDataSub ) {

		request( annalistDataUrlBase + dataSubfoldeName, function(error, response, body ) {

			var dataJsonLdUrls = parseFolderList( body ).filter( filterUnwantedFiles );
			//console.log( dataSub, dataUrls );

			async.each( dataJsonLdUrls, function ( dataJsonLdUrl, completeDataUrl ) {
				var url = annalistDataUrlBase + dataSubfoldeName + dataJsonLdUrl + annalistJsonLdFileName;
				//console.log( url );
				jsonLdUrls.push( url );
				completeDataUrl();
			});

			completeDataSub();
		});

	},
	function( error) {
		if (error) {
			console.error(error);
		}
		else {
			console.log(jsonLdUrls);
			fusekiIndex( jsonLdUrls, function( error ) {
				if( error ) {
					console.error("Data load ERROR!");
				}
				else {
					console.log("Data load complete");
				}
			});
		}
	});
});

/*fusekiIndex(jsons, function( error ) {
	if( error ) {
		console.error("Data load ERROR!");
	}
	else {
		console.log("Data load complete");
	}
});*/

/*var jsons = [
	{
		dataUrl : annalistDataUrlBase + "Ensemble/Phil_Langran_band/entity_data.jsonld",
		dataId : annalistDataUrlBase + "Ensemble/Phil_Langran_band"
	},
	{
		dataUrl : annalistDataUrlBase + "Musician/Phil_Langran/entity_data.jsonld",
		dataId : annalistDataUrlBase + "Musician/Phil_Langran"
	},
	{
		dataUrl : annalistDataUrlBase + "Musician/Steve_Benford/entity_data.jsonld",
		dataId : annalistDataUrlBase + "Musician/Steve_Benford"
	}
];*/

function fusekiIndex( jsonLdUrls, callbackComplete ) {

	fuseki.clearDataset( function () {

		jsonld_request(annalistDataContextUrl, function (error, response, data) {
			var jsonLdContext = JSON.parse(response.body);
			jsonLdContext["@context"]["@base"] = annalistDataUrlBase; // FIX: Fix Context with @base directive

			if (error) {
				console.error("Problem with requesting jsonld context url,", annalistDataContextUrl, error);
			}
			else {

				async.eachSeries(jsonLdUrls, function (jsonLdUrl, complete) {

					var dataId = jsonLdUrl.substr( 0, jsonLdUrl.indexOf( annalistJsonLdFileName ) - 1 );

					getJsonLd( jsonLdContext, jsonLdUrl , dataId, function (error, jsonld) {

						fuseki.sendJsonLd(jsonld, function (error, result) {

							if (error) {
								console.error("Something broke", error);
							}
							else {
								console.log("Done something", result);
							}

							complete();
						});
					});
				});
			}

		}, function () {
			// do something now.
			callbackComplete();
		});
	});

}

function getJsonLd(jsonldContext, jsonLdUrl, dataId, callbackComplete ) {
	/*
		Get Expanded Json LD data from the URL.
		We need to tweak the context to fix a bug in annalist.
	 */
	jsonld_request( jsonLdUrl, function ( err, response, data ) {

		if (err) {
			console.error(err);
			callbackComplete( err );
		}
		else {

			// FIX: Insert reference to new context
			var dataJson = JSON.parse(response.body);
			dataJson["@context"] = jsonldContext["@context"];
			dataJson["@id"] = dataId;

			jsonld.expand(dataJson, {}, function (err, expanded) {

				if (err) {
					console.error(err);
					callbackComplete(err);
				}
				else {
					// The expanded (none context version) of jsonld.
					//console.log(JSON.stringify(expanded, null, 2));
					callbackComplete(null, expanded);
				}
			});
		}
	});
}

function parseFolderListTest() {
	var folderList = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN"><html><head><title>Index of /annalist_sitedata/c/Carolan_Guitar</title></head><body><h1>Index of /annalist_sitedata/c/Carolan_Guitar</h1><table><tr><th valign="top"><img src="/icons/blank.gif" alt="[ICO]"></th><th><a href="?C=N;O=D">Name</a></th><th><a href="?C=M;O=A">Last modified</a></th><th><a href="?C=S;O=A">Size</a></th><th><a href="?C=D;O=A">Description</a></th></tr><tr><th colspan="5"><hr></th></tr><tr><td valign="top"><img src="/icons/back.gif" alt="[PARENTDIR]"></td><td><a href="/annalist_sitedata/c/">Parent Directory</a></td><td>&nbsp;</td><td align="right">  - </td><td>&nbsp;</td></tr><tr><td valign="top"><img src="/icons/unknown.gif" alt="[   ]"></td><td><a href="README.md">README.md</a></td><td align="right">2015-08-07 17:57  </td><td align="right">1.1K</td><td>&nbsp;</td></tr><tr><td valign="top"><img src="/icons/folder.gif" alt="[DIR]"></td><td><a href="_annalist_collection/">_annalist_collection/</a></td><td align="right">2015-08-07 13:58  </td><td align="right">  - </td><td>&nbsp;</td></tr><tr><td valign="top"><img src="/icons/folder.gif" alt="[DIR]"></td><td><a href="d/">d/</a></td><td align="right">2015-09-18 12:31  </td><td align="right">  - </td><td>&nbsp;</td></tr><tr><th colspan="5"><hr></th></tr></table><address>Apache/2.4.7 (Ubuntu) Server at annalist.net Port 80</address></body></html>';
	var fileList = parseFolderList(folderList);

	if( fileList.length !== 3 && fileList[0] !== "README.md" ) {
		console.error("Problem with parseFolderListTest()");
	}
}

function parseFolderList(folderList) {

	var fileList = [];
	var pos = 0,
		start, file;

	for( var skip = 0; skip < 6; skip++ ) {
		pos = folderList.indexOf('href="',pos+1);
	}

	while( pos != -1 ) {
		start = pos+6;
		end = folderList.indexOf('"',start);

		file = folderList.substr(start,end-start);
		fileList.push(file);

		pos = folderList.indexOf('href="', end);

	}

	return fileList;

}

function filterUnwantedFiles(filename) {
	return filename !== "type_data_meta.jsonld" && filename !== "coll_context.jsonld";
}