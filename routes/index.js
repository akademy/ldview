var express = require('express');
var router = express.Router();

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var config = require('../config/config');

router.get('/', function(req, res, next) {
	MongoClient.connect(config.local.databaseUrl, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({}).sort({"annal:type_id":1,"rdfs:label":1}).toArray(function(err, result) {
			if (err) {
				throw err;
			}
			res.render('data/list', {
				entities: result,
				hasValue: function(chunk, context, bodies, params) {
					var entity = context.current();
					return params.key in entity;
				},
				value: function(chunk, context, bodies, params) {
					var entity = context.current();
					return chunk.write( entity[params.key] );
				},
				entityName: function(chunk, context, bodies, params) {
					var entity = context.current(),
						name = "No label";

					if( "rdfs:label" in entity ) {
						name = entity["rdfs:label"];
					}
					else if( "foaf:name"  in entity ) {
						name = entity["foaf:name"];
					}
					return chunk.write( name );
				}
			});
		});
	});
});

/* GET home page. */
router.get('/:id', function(req, res, next) {
	MongoClient.connect(config.local.databaseUrl, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({_id:new mongodb.ObjectId(req.params.id)}).toArray(function(err, results) {
			if (err) {
				throw err;
			}
			if( results.length > 0 ) {
				res.render('data/item', { found: true, result: results[0] } );
			}
			else {
				res.render('data/item', {found:false, result:null} );
			}
		});
	});
});

/* GET home page. */
router.get('/test', function(req, res, next) {
  res.render('partial', {
	  features: [
		  {name: "async"},
		  {name: "helpers"},
		  {name: "filters"},
		  {name: "a little bit of logic"},
		  {name: "and more"}
	  ]
  });
});

/* GET home page. */
router.get('/test/second', function(req, res, next) {
	res.render('index', {
		features: [
			{name: "async"},
			{name: "helpers"},
			{name: "filters"},
			{name: "a little bit of logic"},
			{name: "and more"}
		]
	});
});

module.exports = router;
