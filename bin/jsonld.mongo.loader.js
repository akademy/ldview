/**
 * Created by matthew on 24/10/16.
 */
const fs = require('fs');
const mongo = require('mongodb');
const config = require('../config/config');
const async = require('async');

const util = require("util");

const MongoClient = mongo.MongoClient;
const jsonFolder = '../temp/json/adjusted';

MongoClient.connect( config.local.databaseUrl, function(error, db) {
	if( error ) {
		console.error( "Error:" + error );
	}
	else {
		fs.readdir(jsonFolder, function(err, files) {

			async.each( files, function( file, done ) {
				
				if( file !== "coll_context.jsonld" ) {

					console.log(file);
					var json = fs.readFileSync(jsonFolder + "/" + file);
					json = JSON.parse(json);
					json = replaceDotsInKeys(json);

					db.collection(config.collection).insertOne(json[0], function (error, result) {
						// console.log("done...");
						done();
					});
				}
				else {
					done();
				}
				
			}, function() {

				console.log("calculating links...");

				db.collection(config.collection).distinct( "@id", function (err, ids) {
					var allLinks = {};
					// async.eachSeries( ["http://annalist.net/annalist_sitedata/c/Carolan_Guitar/d/Work/A_Very_Long_Cat"], function( id, done ) {
					async.eachSeries(ids, function (id, doneEach ) {

						db.collection(config.collection)
							.find({"@id": id}, {"links": false, "linksAndPath": false})
							.toArray(function (error, objects) {
								if( error ) {
									console.error( error );
								}

								var links = findLinks(objects[0]);
								//console.log( util.inspect(links, {showHidden:false, colors:true, depth:null}) );

								links = findLinksExtended(objects[0]);
								//console.log( util.inspect(links, {showHidden:false, colors:true, depth:null}) );

								var flatLinks = [];
								flattenLinks(links, flatLinks);
								//console.log( "FlatLinks:", util.inspect(flatLinks, {showHidden:false, colors:true, depth:null}) );

								flatLinks = flatLinks.filter(function (linker) {
									var link = linker.link;
									var splits = link.split("/");
									return link.indexOf("http://annalist") != -1
										&& splits.length == 9
										&& link != 'http://annalist.net/EntityData'
										&& link != id;
								});

								//console.log(id);
								//console.log(links);
								if (!(id in allLinks)) {
									allLinks[id] = flatLinks;
								}
								else {
									allLinks[id] = allLinks[id].concat(flatLinks)
								}


								for (var i = 0, z = flatLinks.length; i < z; i++) {
									if (!(flatLinks[i].link in allLinks)) {
										allLinks[flatLinks[i].link] = [{
											path: flatLinks[i].path,
											link: id,
											reverse: true  // the path shows how to get from b to a
										}]; // linkback
									}
									else {
										var reverseLinks = allLinks[flatLinks[i].link];
										var found = false;
										for (var j = 0, y = reverseLinks.length; j < y; j++) {
											if (reverseLinks[j].link == flatLinks[i].link) {
												found = true;
												break;
											}
										}

										if (!found) {
											reverseLinks.push({
												path: flatLinks[i].path,
												link: id,
												reverse: true  // the path shows how to get from b to a
											});
										}
									}
								}

								console.log( "Calculated links for " + id );
								doneEach();
							});
					},
					function () {
						//console.log(util.inspect(allLinks, false, null));

						//outputGraphData( allLinks );

						async.each( Object.keys(allLinks), function (key, doneUpdate ) {

							db.collection(config.collection)
									.findOneAndUpdate( {"@id": key}, {"$set": {"linksAndPath": allLinks[key]}}, function( error ) {
										if( error ) {
											console.error( error );
										}
										console.log("Updated record for " + key);
										doneUpdate();
									})
						}, function() {
							console.log("Database update completed");
							db.close();
						} )
					});

				});
			});
		});
	}

});

function replaceDotsInKeys( entity ) {

	if( entity.constructor === Array ) {

		for( var i=0;i<entity.length;i++) {
			if( entity[i].constructor === Object ) {
				entity[i] = replaceDotsInKeys( entity[i] );
			}
		}
	}
	else if( entity.constructor === Object ) {
		var newEntity = {};
		for (var key in entity) {

			var value = entity[key];
			if( value.constructor === Object ) {
				value = replaceDotsInKeys( value );
			}
			else if( value.constructor === Array ) {
				replaceDotsInKeys( value );
			}

			if( key.indexOf(".") !== -1 ) {
				var newKey = key.replace(/\./g, "___" );
				newEntity[newKey] = value;
			}
			else {
				newEntity[key] = value;
			}
		}
		return newEntity;
	}

	return entity;
}

function findLinks( entity, base ) {
	base = (typeof base === "undefined") ? 1 : base + 1;
	//console.log(base, entity);

	var links = [];
	if( typeof entity == "string" ) {
		links.push(entity);
	}
	else if( entity.constructor === Array ) {
		for( var i=0;i<entity.length;i++) {
			links = links.concat( findLinks( entity[i], base ) )
		}
	}
	else if( entity.constructor === Object ) {
		for (var key in entity) {
			links = links.concat( findLinks( entity[key], base  ) )
		}
	}
	return links;
}

function findLinksExtended( entity, base, key ) {
	base = (typeof base !== "undefined") ? base + 1 : 1;
	key = (typeof key !== "undefined") ? key : null;
	//console.log(base, entity);

	var links = [];

	if( entity.constructor === Array ) {
		for( var i=0;i<entity.length;i++) {
			var arrayLinks = findLinksExtended(entity[i], base, key);
			if( arrayLinks !== null ) {
				/*if( arrayLinks.length === 1 ) {
					links = links.concat( arrayLinks[0] )
				}
				else */if( arrayLinks.length !== 0 ) {
					links = links.concat(arrayLinks);
				}
			}
		}
	}
	else if( entity.constructor === Object ) {
		for (key in entity) {
			if( key === "@value" || key === "@list" || (key === "@id" && base !== 1) ) {
				var stringLink  = findLinksExtended(entity[key], base, key);
				if( stringLink !== null ) {
					links = links.concat( stringLink );
				}
			}
			else {
				var arrayLinks = findLinksExtended(entity[key], base, key);

				if( arrayLinks !== null ) {
					/*if (arrayLinks.length === 1) {
						if (arrayLinks[0] != null) {
							links = links.concat({
								key: key,
								values: arrayLinks[0]
							})
						}
					}
					else */if (arrayLinks.length !== 0) {
						links = links.concat({
							key: key,
							values: arrayLinks
						})
					}
				}
			}
		}
	}
	else {
		entity = entity.toString();
		if( entity.indexOf( "http://" ) != -1 || entity.indexOf( "https://" ) != -1 ) {
			return entity;
		}
		return null;
	}
	return links;
}

function flattenLinks( links, collect, path, base ) {
	path = (typeof path !== "undefined") ? path : [];
	base = (typeof base !== "undefined") ? base + 1 : 1;

	//console.log( "log:", links, path, base );

	if( links.constructor === Array ) {
		for( var i=0, z=links.length;i < z;i++) {
			if( links[i].constructor === Object ) {

				path.push( links[i].key );
				flattenLinks( links[i].values, collect, path, base );
				path.pop();

			}
			else {
				// array
				flattenLinks( links[i], collect, path, base );
			}
		}
	}

	else {
		collect.push( {
			link : links,
			path : path.slice()
		});
	}
}

function outputGraphData( allLinks ) {
	// json data for D3 Graph
	console.log( '{"nodes" : [' );
	for( key in allLinks ) {
		var group = 0;
		if( key.indexOf( "/Event" ) !== -1 ) {
			group = 1;
		}
		if( key.indexOf( "/Person" ) !== -1 ) {
			group = 2;
		}
		if( key.indexOf( "/Work" ) !== -1 ) {
			group = 3;
		}
		if( key.indexOf( "/Performance" ) !== -1 ) {
			group = 4;
		}
		if( key.indexOf( "/Artifact" ) !== -1 ) {
			group = 5;
		}
		if( key.indexOf( "/Place" ) !== -1 ) {
			group = 6;
		}
		if( group ) {
			console.log('{"id":"' + key + '","group":"' + group + '"},')
		}
		else {
			console.log('{"id":"' + key + '"},')
		}
	}

	console.log( '],' );
	console.log( '"links": [' );
	for( key in allLinks ) {
		for( var i=0; i<allLinks[key].length; i++ ) {
			console.log('{"source":"' + key + '", "target":"' + allLinks[key][i]+ '"},')
		}
	}
	console.log( ']');
	console.log( '}' );
}