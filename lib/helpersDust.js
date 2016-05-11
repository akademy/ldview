/**
 * Created by matthew on 5/6/16.
 */

var helpers = {
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
};

module.exports = helpers;