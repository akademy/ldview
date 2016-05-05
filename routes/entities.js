var express = require('express');
var router = express.Router();

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var config = require('../config/config');

/* list all the entities we have */
router.get('/', function(req, res, next) {
	MongoClient.connect(config.local.databaseUrl, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({}).sort({"annal:type_id":1,"rdfs:label":1}).toArray(function(err, result) {
			if (err) {
				throw err;
			}
			res.render('entities/list', {
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

/**
 * A *smart* view of an entity... hopefully...
 */
router.get('/:id', function(req, res, next) {
	MongoClient.connect(config.local.databaseUrl, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({_id:new mongodb.ObjectId(req.params.id)}).toArray(function(err, results) {
			if (err) {
				throw err;
			}

			res.render('entities/entity', {
				result: (results.length > 0) ? results[0] : null,
				keyValues : function(chunk, context, bodies, params) {
					var entity = context.current();
					var data = [];
					for( var key in entity ) {
						data.push( {
							key : key,
							value : entity[key]
						} );
					}
					return data;
				}
			} );
		});
	});
});


/**
 * A raw - simple - view of this entity
 */
router.get('/raw/:id', function(req, res, next) {
	MongoClient.connect(config.local.databaseUrl, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({_id:new mongodb.ObjectId(req.params.id)}).toArray(function(err, results) {
			if (err) {
				throw err;
			}

			res.render('entities/raw', {
				result: (results.length > 0) ? results[0] : null,
				keyValues : function(chunk, context, bodies, params) {
					var entity = context.current();
					var data = [];
					for( var key in entity ) {
						data.push( {
							key : key,
							value : entity[key]
						} );
					}
					return data;
				}
			} );
		});
	});
});


module.exports = router;