/**
 * Created by matthew on 24/10/16.
 */
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config/config');
const async = require('async');

const jsonFolder = '../temp/json/adjusted';

MongoClient.connect( config.local.databaseUrl, function(error, db) {
	if( error ) {
		console.error( error );
	}
	else {
		/*fs.readdir(jsonFolder, (err, files) => {
			files.forEach(file => {
				console.log(file);
				var potentialJson = fs.readFileSync(jsonFolder + "/" + file);
				potentialJson = (potentialJson + "").replace(/\./g,"___");
				var json = JSON.parse(potentialJson);
				console.log( db.collection(config.collection).insertOne( json[0] ) );
			});
		});*/

		db.collection(config.collection).distinct("@id", function(err, ids) {
			var allLinks = {};
			async.eachSeries( ids, function( id, done ) {
				//var id = "http://annalist___net/annalist_sitedata/c/Carolan_Guitar/d/Work/A_Very_Long_Cat"
				db.collection(config.collection)
					.find({"@id": id })
					.toArray(function( error, objects ) {
						var links = findLinks(objects[0]);

						links = links.filter( function(link) {
							return link.indexOf( "http://annalist" ) != -1
								&& link != 'http://annalist___net/EntityData'
								&& link != id;
						});

						//console.log(id);
						//console.log(links);
						if( ! (id in allLinks) ) {
							allLinks[id] =  links;
						}
						else {
							allLinks[id] = allLinks[id].concat( links )
						}


						for( var i = 0;i<links.length; i++ ) {
							if( ! (links[i] in allLinks) ) {
								allLinks[links[i]] =  [id]; // linkback
							}
							else {
								var otherLinks = allLinks[links[i]];
								if (!(id in otherLinks)) {
									otherLinks.push(id);
								}
							}
						}

						done();
					});
			},
			function() {
				console.log(allLinks);

			});
		});
	}

});

function findLinks( entity ) {
	var links = [];
	if( typeof entity == "string" ) {
		links.push(entity);
	}
	else if( entity.constructor === Array ) {
		for( var i=0;i<entity.length;i++) {
			if( typeof entity == "string" ) {
				links.push(entity[i]);
			}
			else {
				links = links.concat( findLinks( entity[i] ) )
			}
		}
	}
	else if( entity.constructor === Object ) {
		for (key in entity) {

			if( typeof entity == "string" ) {
				links.push( entity[key] );
			}
			else {
				links = links.concat( findLinks( entity[key] ) )
			}
		}
	}
	return links;
}

