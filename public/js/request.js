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

			var entityTypes = splitEntitiesIntoTypes( data );

			for( var entityType in entityTypes ) {
				$("#others").append( '<div class="entities" data-uri="' + entityType + '"><h2>' + entityType + '</h2></div>' );
				for( var i=0,z=entityTypes[entityType].length;i<z;i++) {
					showLink(entityTypes[entityType][i], function (error, data) {
						$('[data-uri="' + entityType + '"]').append(data);
					});
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
	
	function getPsFromAttributes( attributes ) {
		return $.map( attributes, function(attribute) {
			return attribute.p;
		});
	}
	function getOsFromAttributes( attributes ) {
		return $.map( attributes, function(attribute) {
			return attribute.o;
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

	function showLink( entity, callback ) {
		var attributes = [];

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

		context["getValue"] =  function(chunk, context, bodies, params) {
			var entity = context.current();
			console.log("getValue", entity,params.key,entity[params.key]);
			return chunk.write( entity[params.key] );
		};
		context["getValueList"] =  function(chunk, context, bodies, params) {
			var entity = context.current();
			console.log("getValue", entity,params.key,entity[params.key]);
			return entity[params.key];
		};

		var tc = new ev.TemplateControl([]);

		tc.addTemplate( "entity", "/views/entity.dust", function( error ) {
			if( error ) {
				console.log( error );
			}
			else {
				//console.log( "Template *test* loaded");
			}
		});



		console.log("context", context);

		tc.render( "entity", context, function( error, result ) {
			callback( error, result );
		});
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
};

$(document).ready( function() {

	var ec = new ev.EntityControl();
	ec.getLinked( ev.entities[0] );
});