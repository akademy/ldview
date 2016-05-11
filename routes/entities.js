var express = require('express');
var router = express.Router();

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var config = require('../config/config');
var helpersDust = require('../lib/helpersDust.js');

/* list all the entities we have */
router.get('/', function(req, res /*, next */) {
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
				//hasValue: helpersDust.hasValue,
				value: helpersDust.value,
				entityName: helpersDust.entityName
			});
		});
	});
});

/**
 * A *smart* view of an entity... hopefully...
 */
router.get('/:id', function(req, res /*, next*/) {
	MongoClient.connect(config.local.databaseUrl, function(err, db) {
		if (err) {
			throw err;
		}
		db.collection(config.collection).find({_id:new mongodb.ObjectId(req.params.id)}).toArray(function(err, results) {
			if (err) {
				throw err;
			}

			res.render('entities/entity', {
				entity: (results.length > 0) ? results[0] : null,
				keyValues : function(chunk, context /*, bodies, params*/ ) {
					var entity = context.current();
					var data = [];
					for( var key in entity ) {
						if( entity.hasOwnProperty(key) ) {
							data.push( {
								key : key,
								value : entity[key]
							} );
						}
					}
					return data;
				},
				value: function(a,b,c,d) { console.log(a,b,c,d); return helpersDust.value(a,b,c,d); },
				entityName: helpersDust.entityName
			} );
		});
	});
});


/**
 * A raw - simple - view of this entity
 */
router.get('/raw/:id', function(req, res/*, next*/) {
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
				keyValues : function(chunk, context /*, bodies, params*/) {
					var entity = context.current();
					var data = [];
					for( var key in entity ) {
						if( entity.hasOwnProperty(key) ) {
							data.push({
								key: key,
								value: entity[key]
							});
						}
					}
					return data;
				}
			} );
		});
	});
});


module.exports = router;