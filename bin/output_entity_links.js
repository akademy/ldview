//var mongodb = require('mongodb');

var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var config = require('../config/config');

MongoClient.connect( config.local.databaseUrl, function(error, db) {
	if( error ) {
		console.error(error);
	}
	else {
		db.collection(config.collection)
			.distinct("annal:type_id", function(err, classNames) {

				var objectLinks = {};
				async.each( classNames, function( className, oneEachComplete ) {
					objectLinks[className] = {};
					oneEachComplete();
				});

				//console.log(objectLinks);

				async.each( classNames, function( className, oneEachComplete ) {
					db.collection(config.collection)
						.find({"annal:type_id": className})
						.toArray(function( error, objects ) {
							if( error ) {
								console.error(error);
							}
							console.log(className,objects.length);
							async.each( objects, function( obj, secondOneEachComplete ) {
								console.log("***", obj["annal:type_id"], "***" );
								if( obj["annal:type_id"] == "Ensemble") {
									var stop = 1;
								}
								var links = getLinks(obj, classNames);
								for( var l=0;l<links.length;l++) {
									var linkObj = links[l];
									if( linkObj.class in objectLinks[className] ) {
										var fieldLinks = objectLinks[className][linkObj.class];//push(links[l]);
										if( fieldLinks.indexOf(linkObj.field) === -1 ) {
											objectLinks[className][linkObj.class].push(linkObj.field)
										}
									}
									else {
										objectLinks[className][linkObj.class] = [linkObj.field];
									}
								}
								//console.log( objectLinks[className] );
								secondOneEachComplete();
							}, function() {
								console.log("DONEDONE")
							});

							console.log("toArray");
							oneEachComplete();
						});

					console.log("async:each");

				}, function(error) {
					if( error ) {
						console.error(error);
					}
					console.log("findsfinished");
					console.log( objectLinks );
					displayLinks( objectLinks );

					db.close();
				});
				console.log("distinct");


			})
	}
});

function displayLinks( links ) {
	var classes = Object.keys(links);

	for (var i = 0; i < classes.length; i++) {
		var cls = classes[i];
		var clsLinks = links[cls];
		var clsLinksCls = Object.keys(clsLinks);

		for (var j = 0; j < clsLinksCls.length; j++) {
			var link = clsLinksCls[j];
			console.log( cls, "->", link, "\t\t", clsLinks[link] );
		}

	}
}

function getLinks( obj, classNames ) {
	return getLinksAnnalist( obj, classNames );
}

function getLinksAnnalist( obj, classNames ) {

	var fields = Object.keys( obj );
	var links = [];

	async.each( fields, function (field, oneEachComplete) {
		if( field != "_id" ) {
			var values = obj[field];

			if( !Array.isArray(values) ) {
				values = [values];
			}
			
			for( var v=0; v<values.length;v++) {

				var value = values[v];
				if( typeof value === 'object' ) {
					// An object
					var subfield = Object.keys( value )[0]; // we assume there's one field here.
					value = value[subfield];
				}
				if( /*isString*/ typeof value === 'string' || value instanceof String) {
					for (var i = 0; i < classNames.length; i++) {
						if (value.startsWith(classNames[i])) {
							// Possible link
							var className = classNames[i], link = false;
							if (value[className.length] === "/" ) {
								if( value.indexOf(" ") === -1 ) {
									// Lets assume it is a link
									links.push({
										class: className,
										field: field,
										value : value
									});
									link = true;
								}
							}
							if( !link ) {
								console.log("links?", link, field, value);
							}
							break;
						}
					}
				}
			}
		}
		oneEachComplete();
	});

	return links;
}