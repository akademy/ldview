var ev = ev || {};
if( !$ ) $={"needs jquery":1};

ev.EntityControl = function() {
	'use strict';

	const OTYPE = {
		URI: "uri",
		BNODE: "bnode",
		LITERAL: "literal"
	};

	this.getBnodes = function() {
		
	};
	
	this.getLinked = function( e ) {

		var uri = "/links/" + encodeURIComponent(e.subject);  // "/data/entity/http%3A%2F%2Fannalist.net%2Fannalist_sitedata%2Fc%2FCarolan_Guitar%2Fd%2FPerson%2FMyriam_Bleau"

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

			removeUnknownPredicatePositions( entityPreds );

			for( var entityPred in entityPreds ) {

				var $typeDiv = getPosition( entityPred );

				$typeDiv.append( '<h2>' + ev.Rephrase.rephrase(entityPred) + '</h2>' );

				var display = (function( entityType, $typeDiv ) {
					return function( error, data, linkAndPath ) 	{
						var $entity = $(data);

						$typeDiv.append($entity);
						if( linkAndPath.path.length > 1 ) {
							// Todo, should we add multiple ones?
							$entity.prepend("<h3>" + ev.Rephrase.rephrase(linkAndPath.path[1], (linkAndPath.reverse) ? "reverse" : "forward") + ":</h3>");
						}

						$entity.on("click", function() {
							switchMain( $entity.data("subject") );
						});
					};
				})( entityPred, $typeDiv );

				for( var i=0,z=entityPreds[entityPred].length;i<z;i++) {
					showLink(entityPreds[entityPred][i], display );
				}
			}

			// Remove empties
			/*var $predicateAreas = $(".entities[data-predicate]");
			for( var i=0, z=$predicateAreas.length; i<z; i++ ) {
				var $area = $($predicateAreas[i]);
				var $h2 = $area.children("h2");
				if( $h2.length === 0 ) {
					$area.remove();
				}
			}*/
		})
		.fail(function() {
			console.log( "getLinked:fail" );
		});
		//.always(function() {
		//	console.log( "getLinked:always" );
		//});
	};

	function removeUnknownPredicatePositions( predicates ) {
		var predicateKeys = Object.keys(predicates);
		var $predPositions = $('.entities[data-predicate]');

		for( var i=0, iz=$predPositions.length; i<iz; i++ ) {
			var $position = $($predPositions[i]);
			var pred = $position.data("predicate");
			
			var found = false;
			for( var j=0, jz=predicateKeys.length; j<jz; j++ ) {
				if( predicateKeys[j] === pred ) {
					found = true;
					break;
				}
			}
			
			if( !found ) {
				$position.remove();
			}
		}

	}

	function getPosition( predicate ) {
		// Work out a place to put this entity based on template design.
		// 1. Specific with [data-predicate="some predicate"]
		// 2. Section with class="entities-section"
		//   2.a. Order by height of section on page
		//   2.b. Number of class="entities" inside
		// 3. At end of <body>
		
		// TODO: Perhaps order just by height of entities being added...

		var typePosition = '.entities[data-predicate="' + predicate + '"]';
		var $div = $(typePosition);

		if( $div.length === 0 ) {

			var $sections = $(".entities-section");
			var $section = null;

			if( $sections.length > 0 ) {
				var entitiesMin = 999999;
				var heightMin = 99999999;

				for( var i=0, iz=$sections.length; i<iz; i++ ) {
					var $sec = $($sections[i]);

					var height = $sec.position().top;
					var entitiesCount = $sec.find(".entities").length;

					if( height < heightMin && entitiesCount <= entitiesMin ) {
						$section = $sec;
						entitiesMin = entitiesCount;
						heightMin = height;
					}
					else if( entitiesCount < entitiesMin) {
						$section = $sec;
						entitiesMin = entitiesCount;
						heightMin = height;
					}
				}
			}
			else {
				$section = $("body");
			}

			$section.append('<div class="entities" data-predicate="' + predicate + '"></div>');
			$div = $(typePosition);
		}
		else {
			if ($div.length > 1) {
				$div = $($div[0]);
			}
		}

		return $div;
	}

	function switchMain( newMain ) {
		var newMainSelector = "[data-subject='" + newMain + "']";
		var $main = $("#main");
		var $newMain = $( newMainSelector );
		var $notNewMain = $(":not(" + newMainSelector + ")" );

		// Ensure width and height remains set after position:absolute set
		$main.css("position","relative");
		var mainWidth = $main.css("width"),
			mainHeight = $main.css("height");

		$main.css("width", mainWidth );
		$main.css("height", mainHeight );

		// Ensure width and height remains set after position:absolute set
		$newMain.css("position","relative");
		$newMain.css("width",$newMain.css("width"));
		$newMain.css("height",$newMain.css("height"));

		$main.css("position","absolute");
		var mainLeft = $main.css("left"),
			mainTop = $main.css("top");

		$main.css("position","relative");
		$newMain.css("position","absolute");

		//$notNewMain
		$main.animate(
			{
				opacity:0
			}
		);

		var moveDuration = Math.max( $newMain.offset().top, 500 );
		$newMain.animate(
			{
				left: mainLeft,
				top: mainTop,
				width: mainWidth,
				height: mainHeight
			},
			{
				duration: moveDuration,
				easing: "swing",
				complete: function() {
					setTimeout( function() {
						console.log("clicked", newMain );
						window.location.href = "/attrs/" + encodeURIComponent( newMain );
					}, 400 );
				}
			}
		);

		$("html, body").animate({ scrollTop: 0 }, { duration: moveDuration });

	}

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

	function showLink( entityAndPath, callback ) {
		var entity = entityAndPath.entity;
		var attributes = [];
		var encodeId = encodeURIComponent(entity["@id"]);
		var context = {
			id : entity["@id"]
		};

		for( var attr in entity ) {
			if( entity.hasOwnProperty( attr ) ) {
				if (attr !== "@id" && attr !== "_id" && attr !== "links" && attr !== "linksAndPath") {
					if (entity[attr].length === 1 && entity[attr][0]["@value"]) {
						attributes.push({"attr": attr, "value": entity[attr][0]["@value"]});
						context[attr] = entity[attr][0]["@value"];
					}
					else {
						attributes.push({"attr": attr, "value": entity[attr]});
						context[attr] = entity[attr];
					}
				}
				context[attr] = entity[attr]; //[0]["@value"];
			}
		}

		context["attributes"] = attributes;

		ev.DustHelpers.addHelpers( context );

		var tc = new ev.TemplateControl([]);

		//
		//TODO load templates based on type not the ID!
		//

		tc.addTemplate( encodeId + "_2", "/template/" + encodeId + "?level=2&type=" + getEntityType(entity), function( error ) {
			if( error ) {
				console.log( error );
			}
			else {
				//console.log( "Template *test* loaded");
			}
		});

		//console.log("context", context);

		tc.render( encodeId + "_2", context, function( error, result ) {
			callback( error, result, entityAndPath.linkAndPath );
		});
	}

	function getEntityType( entity ) {
		if( entity ) {
			return entity["http://annalist.net/type_id"][0]["@value"];
		}
		return "";
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
			predicates[predicate].push( {
				entity: getEntityFromEntityId( linksAndPath[i].link, entities ),
				linkAndPath: linksAndPath[i]
			});
		}

		return predicates;
	}

	function splitEntitiesIntoTypes( entities ) {
		var types = {};

		for( var i=0,z=entities.length;i<z; i++ ){
			var type = entities[i]["http://annalist.net/type"][0]["@id"];

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