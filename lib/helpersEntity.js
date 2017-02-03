/**
 * Created by matthew on 5/11/16.
 */

var util = require("util");
var sparql = require( "sparql" );

var helpers = {

	getEntity: function( uri, callback ) {

		console.log("test2");

		var client = new sparql.Client("http://localhost:3030/test1/sparql");
		client.query(
			util.format( " \
				select distinct ?p ?o ?p2 ?o2 where \
			{ \
			  { \
			    <%s> ?p ?o. \
			    FILTER( !isBlank(?o) ) \
			  } \
			  UNION \
			  { \
			    <%s> ?p ?o. \
			    ?o ?p2 ?o2 \
			  } \
			} limit 1000",  uri,  uri ),
			function(err, result) {
		
				var results = result.results.bindings;
				var tidyResults = {};

				for( var i=0;i<results.length;i++) {
					var predval = results[i]["p"]["value"];

					if( results[i]["o"].type !== "bnode" ) {
						tidyResults[predval] = {
							sub: false,
							value: results[i]["o"]["value"]
						};
					}
					else {
						if( !tidyResults[predval] ) {
							tidyResults[predval] = {
								sub: true,
								value: results[i]["p2"]["value"],
								subvalues: []
							}
						}

						tidyResults[predval]["subvalues"].push(results[i]["o2"]["value"]);
					}
				}

				var keyval = [];
				for( var key in tidyResults ) {
					var tidyResult = {
						key: key,
						sub: tidyResults[key].sub,
						value: tidyResults[key].value
					};

					if( tidyResult.sub ) {
						tidyResult["subs"] = tidyResults[key].subvalues
					}
					keyval.push(tidyResult);
				}

			
				if( callback ) {
					var error = null;
					callback( error, keyval );
				}
			}
		);
	},

	getEntityLinks: function( entity ) {},

	getEntityBackLinks: function( entity ) {

	},

	entityLinks: function( entity ) {
		if( entity["annal:type_id"] == "Ensemble" ) {
			// How do we generate a list of links between this object and others
			return {
				"coll:performs_role": ["Role"],
				"crm:P107_has_current_or_former_member" : [ "Musician", "Performer" ], // TODO: How to handle multiple types (They should be sub classes of a single 

			}
		}
		/*for( var key in entity ) {

			if( entity.hasOwnProperty(key) ) {
				var type = typeof entity[key];
				if( type === "object" ) {
					// ?? NO, NEED TO KNOW IF IT'S A LINK TO ANOTHER OBJECT........ Should I just use a triple store
				}
				data.push( {
					key : key,
					value : entity[key]
				} );
			}
		}*/
	},

	entityName: function( entity ) {

		if( "rdfs:label" in entity ) {
			return entity["rdfs:label"];
		}
		else if( "foaf:name"  in entity ) {
			return entity["foaf:name"];
		}
		
		return "No Named Entity";
	}
};

module.exports = helpers;
