var ev = ev || {};
ev.EntityControl = function() {
	"strictmode";
	const OTYPE = {
		URI: "uri",
		BNODE: "bnode",
		LITERAL: "literal"
	};

	this.getBnodes = function() {
		
	};
	
	this.getLinked = function( e ) {

		var uri = "/fentities/links/" + encodeURIComponent(e.subject);  // "/data/entity/http%3A%2F%2Fannalist.net%2Fannalist_sitedata%2Fc%2FCarolan_Guitar%2Fd%2FPerson%2FMyriam_Bleau"

		var uris = getAttributesWithUris(e);
		var bnodes = getAttributesWithBlanks(e);

		var jqxhr = $.post( uri, {
			uris: JSON.stringify(uris),
			bnodes: JSON.stringify(bnodes)
		})
		.done(function(data) {
			console.log( "getLinked:done", data );

			var entityTypes = splitEntitiesIntoTypes( data ); // TODO: THESE ARENT TYPES THEY ARE PREDICATE GROUPINGS!

			// fudge to get "links" and "linksAndPath" fields in current main entity
			var entityMongo = getEntityFromEntityId( e.subject, data );
			removeEntityByEntityId( e.subject, data );

			removeDuplicateReverseLinks( entityMongo ); // TODO: We should likely be doing this at mongo index time

			var entityPreds = splitEntitiesIntoTopLevelPredicates( entityMongo, data );

			for( var entityPred in entityPreds ) {

				var typePosition = '.entities[data-predicate="' + entityPred + '"]';
				var $typeDiv = $(typePosition);
				if( $typeDiv.length === 0 ) {
					$("#others").append( '<div class="entities" data-predicate="' + entityPred + '"></div>' );
					$typeDiv = $(typePosition);
				}

				$typeDiv.append( '<h2>' + ev.Rephrase.rephrase(entityPred) + '</h2>' );

				var display = (function( entityType, $typeDiv ) {
					return function( error, data ) 	{
						var $entity = $(data);
						$typeDiv.append($entity);

						$entity.on("click", function() {
							console.log("clicked", $entity.data("subject") );
							window.location.href = "/fentities/attrs/" + encodeURIComponent( $entity.data("subject") );
						});
					};
				})( entityPred, $typeDiv );

				for( var i=0,z=entityPreds[entityPred].length;i<z;i++) {
					showLink(entityPreds[entityPred][i], display );
				}
			}

			// for( i=0,z=data.length;i<z;i++)
			// 	showLink( data[i], function( error, data ) {
			//
			// 		$("#others").append( data );
			// 	} );
		})
		.fail(function() {
			console.log( "getLinked:fail" );
		});
		//.always(function() {
		//	console.log( "getLinked:always" );
		//});
	};
	
	/*function getPsFromAttributes( attributes ) {
		return $.map( attributes, function(attribute) {
			return attribute.p;
		});
	}
	function getOsFromAttributes( attributes ) {
		return $.map( attributes, function(attribute) {
			return attribute.o;
		});
	}*/

	function showLink( entity, callback ) {
		var attributes = [];
		var encodeId = encodeURIComponent(entity["@id"]);
		var context = {
			id : entity["@id"]
		};

		for( attr in entity ) {
			if( attr !== "@id" && attr !== "_id" && attr !== "links" && attr !== "linksAndPath" ) {
				if( entity[attr].length === 1 && entity[attr][0]["@value"]) {
					attributes.push({"attr": attr, "value": entity[attr][0]["@value"]});
					context[attr] =  entity[attr][0]["@value"];
				}
				else {
					attributes.push({"attr": attr, "value": entity[attr]});
					context[attr] =  entity[attr];
				}
			}
			context[attr] = entity[attr]//[0]["@value"];
		}

		context["attributes"] = attributes;

		ev.DustHelpers.addHelpers( context );

		var tc = new ev.TemplateControl([]);

		//
		//TODO load templates based on type not the ID!
		//

		tc.addTemplate( encodeId + "_2", "/fentities/template/" + encodeId + "?level=2", function( error ) {
			if( error ) {
				console.log( error );
			}
			else {
				//console.log( "Template *test* loaded");
			}
		});

		console.log("context", context);

		tc.render( encodeId + "_2", context, function( error, result ) {
			callback( error, result );
		});
	}

	function getAttributesWithUris( entity ) {
		var uris = [];
		entity.attributes.forEach( function(attribute) {
			if( attribute.t == OTYPE.URI ) {
				uris.push(attribute);
			}
		});
		return uris;
	}

	function getAttributesWithBlanks( entity ) {
		var bnodes = [];
		entity.attributes.forEach( function(attribute) {
			if( attribute.t == OTYPE.BNODE ) {
				bnodes.push(attribute);
			}
		});
		return bnodes;
	}

	function getEntityFromEntityId( id, entities ) {
		for( var i=0, z=entities.length; i<z;i++ ) {
			if( entities[i]["@id"] === id ) {
				return entities[i];
			}
		}
		return null;
	}

	function removeEntityByEntityId( id, entities ) {
		var index = -1;
		for( var i=0, z=entities.length; i<z;i++ ) {
			if( entities[i]["@id"] === id ) {
				index = i;
				break;
			}
		}
		if( index !== -1 ) {
			return entities.splice(index,1);
		}
		return null;
	}

	function splitEntitiesIntoTopLevelPredicates( entity, entities ) {
		var predicates = {};
		var linksAndPath = entity["linksAndPath"];

		for( var i=0,z=linksAndPath.length;i<z; i++ ){
			var predicate = linksAndPath[i].path[0];

			if( !predicates.hasOwnProperty(predicate)) {
				predicates[predicate] = [];
			}
			predicates[predicate].push( getEntityFromEntityId( linksAndPath[i].link, entities ) );
		}

		return predicates;
	}

	function splitEntitiesIntoTypes( entities ) {
		var types = {};

		for( var i=0,z=entities.length;i<z; i++ ){
			var type = entities[i]["http://annalist___net/type"][0]["@id"];

			if( types.hasOwnProperty(type)) {
				types[type].push(entities[i]);
			}
			else {
				types[type] = [entities[i]];
			}
		}

		return types;
	}

	function removeDuplicateReverseLinks( entity ) {
		var linksAndPath = entity["linksAndPath"],
			duplicates = [],
			linkMatch, link, i, z, j;

		for( i=0, z=linksAndPath.length; i<z; i++ ){
			linkMatch = linksAndPath[i];
			if( linkMatch.reverse ) {
				var duplicate = false;
				for( j=0; j<z; j++ ){
					link = linksAndPath[j];
					if( !link.reverse ) {
						if( link.link === linkMatch.link ) {
							duplicate = true;
							break;
						}

					}
				}

				if( duplicate ) {
					duplicates.push(i);
				}
			}
		}

		for( i=duplicates.length; i; i-- ) {
			linksAndPath.splice(duplicates[i-1],1);
		}
	}

};

$(document).ready( function() {

	if( ev && ev.entities && ev.entities.length ) {
		var ec = new ev.EntityControl();
		ec.getLinked(ev.entities[0]);
	}
});