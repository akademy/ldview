const util = require("util");
const fs = require('fs');

const express = require('express');
//const fuseki = require("/lib/fuseki");
const sparql = require( "sparql" );

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const config = require('../config/config');
const helpersDust = require('../lib/helpersDust.js');
const evDustHelpers = require('../public/js/dustHelpers.js');
const helpersEntity = require('../lib/helpersEntity.js');

const sparqlClient = "http://" + config.local.fuseki.host
								+ ":" + config.local.fuseki.port
								+ "/" + config.local.fuseki.dataset
								+ "/sparql";

const mongoConnection = "mongodb://"
	+ config.local.mongo.host
	+ ":"+ config.local.mongo.port
	+ "/" + config.local.mongo.database;

var router = express.Router();

router.get('/webviews', function(req, res /*, next */) {
	res.render('webviews');
});

router.get('/about', function(req, res /*, next */) {
	res.render('about');
});

/* list all the entities we have */
router.get('/', function(req, res /*, next */) {

	var client = new sparql.Client(sparqlClient);
	var q ="" +
		"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> " +
	"select distinct ?s ?label ?comment where { " +
	"	?s ?p ?o . " +
	"optional { ?s rdfs:label ?label } " +
	"optional { ?s rdfs:comment ?comment } " +
	"	FILTER isURI(?s) " +
	"}  " +
	"order by ?s " +
	"limit 1000 " +
	"";

	client.query( q, function(err, result) {
		var context = {};

		if( result && result.results ) {

			//var filtered = result.results.bindings.filter( function(ent) { return ent.s.type === "uri"; });
			var results = result.results.bindings;
			var currentType = null;
			var typeGroup = null;
			var entities = [];

			for (var i = 0, z = results.length; i < z; i++) {
				var uri = results[i].s.value;
				var typeSplit = uri.split("/");
				var type = typeSplit[typeSplit.length - 2];

				if (type !== currentType) {
					typeGroup = {
						type: type,
						entities: []
					};

					entities.push(typeGroup);
					currentType = type;
				}

				typeGroup.entities.push({
					id: uri,
					"http://www.w3.org/2000/01/rdf-schema#label": results[i].label ? results[i].label.value : "No label",
					"http://www.w3.org/2000/01/rdf-schema#comment": results[i].comment ? results[i].comment.value : "No comment"
				});

			}

			context.entities = entities;
				//value: helpersDust.value,
				//entityName: helpersDust.entityName
		}

		evDustHelpers.addHelpers(context);
		res.render('fentities/list', context);

	});
	
});

router.get('/raw/:uri', function(req, res /*, next */) {

	var client = new sparql.Client(sparqlClient);
	client.query( util.format( "" +
			"select * where { " +
			"	<%s> ?p ?o  " +
			"} ", req.params.uri), function(err, result) {

		res.render('fentities/raw', {
			subject : req.params.uri,
			predicates: result.results.bindings,
			//hasValue: helpersDust.hasValue,
			value: helpersDust.value,
			entityName: helpersDust.entityName
		});
	});

});

router.get('/:uri', function(req, res /*, next */) {

	var client = new sparql.Client(sparqlClient);
	client.query(
		//util.format( `select * where { <%s> ?p ?o }`, req.params.uri ),
		// Direct and indirect via (one level) blank
		/*util.format( `select distinct ?p ?o ?p2 ?o2 where
		{
		  {
		    <%s> ?p ?o.
		    FILTER( !isBlank(?o) )
		  }
		  UNION
		  {
		    <%s> ?p ?o.
		    ?o ?p2 ?o2
		  }
		} limit 1000`,  req.params.uri,  req.params.uri ),*/

		util.format( "" +
			"PREFIX list: <http://jena.hpl.hp.com/ARQ/list#> " +
			"" +
			"SELECT ?s ?p ?o ?p2 ?o2 { " +
			"	{ " +
			"		?s ?p ?o .  " + //# Get members " +
			"		optional{ " +
			"			?o list:member ?ignore_lists " + //# But not those which are lists (bnodes) or blank subjects " +
			"		} " +
			"		filter( !isBlank( ?o ) ) " +
			"	} " +
			"" +
			"	UNION { " +
			"		?s ?p ?lists . " +
			"		?lists list:member ?o " + //# Get list members " +
			"	} " +
			"" +
			"	UNION { " +
			"		?s ?p2 ?b1. " +
			"		?b1 ?p ?o . " +  // Get blank node stuff. TODO: Can we 'forget' intermediate predicate? " +
			"		optional { " +
			"			?b1 list:member ?ignore_lists " + // But not those which are lists (bnodes) " +
			"	} " +
			"		filter( ! bound( ?ignore_lists ) )				} " +
			 "" +
			"	filter( ?s = <%s> ) " +
			"}",
			req.params.uri ),
		function(err, result) {

			// var uris = result.results.bindings.filter( function(ent) { return ent.s.type === "uri"; });

			var results = result.results.bindings;
			var tidyResults = {};

			for( var i=0;i<results.length;i++) {
				var predval = results[i]["p"]["value"];

				if( results[i]["o"].type !== "bnode" ) {
					tidyResults[predval] = {
						sub: false,
						value: results[i]["o"]["value"]
					};
				}
				else {
					if( !tidyResults[predval] ) {
						if(results[i]["p2"] ) {
							tidyResults[predval] = {
								sub: true,
								value: results[i]["p2"]["value"],
								subvalues: []
							}
						}
					}

					if( tidyResults[predval] ) {
						tidyResults[predval]["subvalues"].push(results[i]["o2"]["value"]);
					}
				}
			}

			var keyval = [];
			for( var key in tidyResults ) {
				var tidyResult = {
					key: key,
					sub: tidyResults[key].sub,
					value: tidyResults[key].value
				};

				if( tidyResult.sub ) {
					tidyResult["subs"] = tidyResults[key].subvalues
				}
				keyval.push(tidyResult);
			}

			/*
			for( i=0;i<results.length;i++) {
				if (results[i]["o"].type === "bnode") {
					keyval.push({
						sub : true,
						key: results[i]["p"]["value"],
						subkey: results[i]["p2"]["value"],
						value: results[i]["o2"]["value"]
					});
				}
				else {
					keyval.push({
						sub: false,
						key: results[i]["p"]["value"],
						value: results[i]["o"]["value"]
					});
				}
			}
			*/

			res.render('fentities/simple', {
				subject : req.params.uri,
				keyval: keyval,
				//hasValue: helpersDust.hasValue,
				value: helpersDust.value,
				entityName: helpersDust.entityName
			});
		});
});

router.get('/attrs/:uri', function(req, res ) {

	var query = util.format(
		"	SELECT ?s ?p ?o { " +
				"?s ?p ?o . " +   //  Get members
				"filter( ?s = <%s> )" +
		"}", req.params.uri );

	var client = new sparql.Client(sparqlClient);
	client.query( query, function(err, result) {
		var context = {};
		var render = 'fentities/entity/_general';

		if( !err && result.results.bindings.length > 0 ) {

			var bindings = result.results.bindings;
			var annalistType = null; // TODO: use none annalist type.

			var predicates = {
				items: {},
				list: []
			};

			for (var i = 0, z = bindings.length; i < z; i++) {
				predicates.items[bindings[i].p.value] = bindings[i].o.value;
				predicates.list.push(bindings[i]);

				if (bindings[i].p.value === "http://annalist.net/type_id") {
					annalistType = bindings[i].o.value;
				}
			}

			// todo: choose view based on entity type
			if (annalistType === 'Person') {
				render = 'fentities/entity/person';
			}
			else if (annalistType === "Performance") {
				render = 'fentities/entity/performance';
			}
			else if (annalistType === "Place") {
				render = 'fentities/entity/place';
			}

			context = {
				predicates: predicates,
				subject: req.params.uri,
				results: bindings
			};

			evDustHelpers.addHelpers(context, config.local.debug && !req.query.debug );
		}

		res.render( render, context );
	});
});


router.post('/links/:uri', function(req, res ) {

	/*var uris = (req.body.uris) ? JSON.parse(req.body.uris) : [];
	var bnodes = (req.body.bnodes) ? JSON.parse(req.body.bnodes) : [];

	var query = util.format(
		`	
			SELECT ?s ?p ?entity {
					?s ?p ?entity . # Get members
					filter( ?entity = <%s> )
			}
		`
		, req.params.uri );


	var client = new sparql.Client(sparqlClient);
	client.query( query, function(err, result) {

		var results = result.results.bindings;
		res.send( results );
	});*/
	MongoClient.connect( mongoConnection, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({"@id":req.params.uri},{"links":true,"linksAndPath" : true}).toArray(function(err, result) {
			if (err) {
				throw err;
			}
			
			if( result[0] ) {
				var links = result[0].linksAndPath;

				var q = {$or: [{"@id": req.params.uri}]}; // Add *this* entity, TODO: Remove it, we should already have this but the system is in a "two database" weird configuration (i.e. it needs unmessing up...)
				for (var i = 0; i < links.length; i++) {
					q["$or"].push({"@id": links[i].link})
				}

				db.collection(config.collection).find(q).toArray(function (err, results) {
					if (err) {
						throw err;
					}

					// Take out triple underscore in keys, replace with a dot (because mongo doesn't allow dots in keys)
					for( var i=0, iEnd=results.length; i<iEnd; i++ ) {
						replaceUnderscoresInKeys( results[i] );
					}

					res.send(results);
				});
			}
			else {
				res.send(null);
			}
		});
	});
});

function replaceUnderscoresInKeys( obj ) {
	var keys = Object.keys( obj );
	for( var j=0, jEnd=keys.length; j<jEnd; j++ ) {

		if( typeof obj[keys[j]] === 'object') {
			replaceUnderscoresInKeys( obj[keys[j]] )
		}

		if( keys[j].indexOf("___") != -1 ) {
			obj[keys[j].replace(/___/g,".")] = obj[keys[j]];
			obj[keys[j]] = null;
			delete obj[keys[j]];
		}
	}
}

router.get('/template/:uri', function(req, res ) {
	// TODO work out which template we need. (Or construct the template)
	var views_location = "views/fentities/entity/parts/";
	var file = req.query["type"].toLocaleLowerCase() + ".dust";
	
	fs.readFile(views_location + file, 'utf8', function (err,data) {
		if (err) {
			fs.readFile(views_location + '_general.dust', 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
				res.send(data);
			});
		}
		else {
			res.send(data);
		}
	});
});

module.exports = router;
