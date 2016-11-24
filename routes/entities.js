var express = require('express');
var router = express.Router();

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var config = require('../config/config');
var helpersDust = require('../lib/helpersDust.js');
var helpersEntity = require('../lib/helpersEntity.js');

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

			var result = (results.length > 0) ? results[0] : null;
			
			var links = helpersEntity.entityLinks( result );
			var fields = Object.keys(links);
			var query = [];

			for( var l=0; l<fields.length; l++) {
				// That is looping through
				var field = fields[l];
				var values = result[field];
				if( typeof values !== "array" ) {
					values = [values];
				}
				
				for(var v=0; v<values.length; v++) {
					var props = values[v]["@id"].split("/");

					query.push({
						"annal:type_id": props[0],
						"annal:id": props[1]
					})
				}
			}

			db.collection(config.collection)
				.find({
					$or: query
				})
				.toArray(function ( err, associated ) {

					res.render('entities/entity', {
						entity: result,
						keyValues: function (chunk, context /*, bodies, params*/) {
							var entity = context.current();
							var data = [];
							for (var key in entity) {
								if (entity.hasOwnProperty(key)) {
									data.push({
										key: key,
										value: entity[key]
									});
								}
							}
							return data;
						},
						value: function (a, b, c, d) {
							console.log(a, b, c, d);
							return helpersDust.value(a, b, c, d);
						},
						entityName: helpersDust.entityName
					});
				});
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