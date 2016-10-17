var util = require("util");

var express = require('express');
//var fuseki = require("/lib/fuseki");
var sparql = require( "sparql" );

var config = require('../config/config');
var helpersDust = require('../lib/helpersDust.js');
var helpersEntity = require('../lib/helpersEntity.js');

var router = express.Router();

/* list all the entities we have */
router.get('/', function(req, res /*, next */) {

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	client.query( `
			select distinct ?s where {
				?s ?p ?o 
				FILTER isURI(?s)
			} 
			limit 1000
	`, function(err, result) {

		//var filtered = result.results.bindings.filter( function(ent) { return ent.s.type === "uri"; });

		res.render('fentities/list', {
			entities: result.results.bindings,//filtered,
			//hasValue: helpersDust.hasValue,
			value: helpersDust.value,
			entityName: helpersDust.entityName
		});
	});
	
});

router.get('/raw/:uri', function(req, res /*, next */) {

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	client.query( util.format( `
			select * where { 
				<%s> ?p ?o 
			}`, req.params.uri), function(err, result) {

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

		util.format( `
			PREFIX list: <http://jena.hpl.hp.com/ARQ/list#>
			
			SELECT ?s ?p ?o ?p2 ?o2 {
				{
					?s ?p ?o . # Get members
					optional{
						?o list:member ?ignore_lists # But not those which are lists (bnodes) or blank subjects
					}
					filter( !isBlank( ?o ) )
				}
			
				UNION {
					?s ?p ?lists .
					?lists list:member ?o	# Get list members
				}
			
				UNION {
					?s ?p2 ?b1.
					?b1 ?p ?o . # Get blank node stuff. TODO: Can we "forget" intermediate predicate?
					optional {
						?b1 list:member ?ignore_lists # But not those which are lists (bnodes)
					}
					filter( ! bound( ?ignore_lists ) )
				}
			
				filter( ?s = <%s> )
			}`,
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
						tidyResults[predval] = {
							sub: true,
							value: results[i]["p2"]["value"],
							subvalues: []
						}
					}

					tidyResults[predval]["subvalues"].push(results[i]["o2"]["value"]);
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

			res.render('fentities/entity', {
				subject : req.params.uri,
				keyval: keyval,
				//hasValue: helpersDust.hasValue,
				value: helpersDust.value,
				entityName: helpersDust.entityName
			});
		});

});

module.exports = router;
