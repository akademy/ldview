var express = require('express');
var router = express.Router();

//var fuseki = require("/lib/fuseki");
var sparql = require( "sparql" );

var config = require('../config/config');
var helpersDust = require('../lib/helpersDust.js');
var helpersEntity = require('../lib/helpersEntity.js');


//fuseki = fuseki.create( config.fusekiDatabase.host, config.fusekiDatabase.port, config.fusekiDatabase.dataset );

/* list all the entities we have */
router.get('/', function(req, res /*, next */) {

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	client.query( 'select distinct ?s where { ?s ?p ?o } limit 1000', function(err, result) {

		var filtered = result.results.bindings.filter( function(ent) { return ent.s.type === "uri"; });

		res.render('fentities/list', {
			entities: filtered,
			//hasValue: helpersDust.hasValue,
			value: helpersDust.value,
			entityName: helpersDust.entityName
		});
	});
	
});

router.get('/raw/:uri', function(req, res /*, next */) {

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	client.query( 'select * where { <' + req.params.uri +'> ?p ?o }', function(err, result) {

		res.render('fentities/raw', {
			predicates: result.results.bindings,
			//hasValue: helpersDust.hasValue,
			value: helpersDust.value,
			entityName: helpersDust.entityName
		});
	});

});

router.get('/:uri', function(req, res /*, next */) {

	var client = new sparql.Client("http://localhost:3030/test1/sparql");
	client.query( 'select * where { <' + req.params.uri +'> ?p ?o }', function(err, result) {

		var results = result.results.bindings;
		var keyval = [];
		for( var i=0;i<results.length;i++) {
			keyval.push( {
				key: results[i]["p"]["value"],
				value: results[i]["o"]["value"]
			});
		}
		
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