const util = require("util");
const fs = require('fs');

var express = require('express');
//var fuseki = require("/lib/fuseki");
var sparql = require( "sparql" );

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var config = require('../config/config');
var helpersDust = require('../lib/helpersDust.js');
var evDustHelpers = require('../public/js/dustHelpers.js');
var helpersEntity = require('../lib/helpersEntity.js');

var router = express.Router();

/* list all the entities we have */
router.get('/', function(req, res /*, next */) {

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	var q ="" +
		"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> " +
	"select distinct ?s ?label ?comment where { " +
	"	?s ?p ?o . " +
	"optional { ?s <rdfs:label> ?label } " +
	"optional { ?s <rdfs:comment> ?comment } " +
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
					"rdfs:label": results[i].label.value,
					"rdfs:comment": results[i].comment.value
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

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
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

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
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

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	client.query( query, function(err, result) {

		var bindings = result.results.bindings;
		var annalistType = null; // TODO: use none annalist type.

		var predicates = {
			items : {},
			list : []
		};
		
		for( var i=0, z=bindings.length;i<z; i++) {
			predicates.items[bindings[i].p.value] = bindings[i].o.value;
			predicates.list.push(bindings[i]);
			
			if( bindings[i].p.value === "http://annalist.net/type_id" ) {
				annalistType = bindings[i].o.value;
			}
		}
		
		// todo: choose view based on entity type
		var render = 'fentities/entity/basic';
		if( annalistType === 'Person') {
			render = 'fentities/entity/person';
		}
		else if( annalistType === "Performance") {
			render = 'fentities/entity/performance';
		}

		var context = {
			predicates : predicates,
			subject : req.params.uri,
			results : bindings
		};

		evDustHelpers.addHelpers( context );

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


	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	client.query( query, function(err, result) {

		var results = result.results.bindings;
		res.send( results );
	});*/
	MongoClient.connect(config.local.databaseUrl, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({"@id":req.params.uri},{"links":true,"linksAndPath" : true}).toArray(function(err, result) {
			if (err) {
				throw err;
			}
			var links = result[0].linksAndPath;

			var q = { $or : [{ "@id" : req.params.uri }] }; // Add *this* entity, TODO: Remove it, we should already have this but the system is in a "two database" weird configuration (i.e. it needs unmessing up...)
			for( var i=0; i< links.length; i ++ ) {
				q["$or"].push( { "@id" : links[i].link } )
			}

			db.collection(config.collection).find(q).toArray(function(err, result) {
				if (err) {
					throw err;
				}
				res.send(result);
			});
		});
	});
});

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
