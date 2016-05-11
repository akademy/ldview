/**
 * Created by matthew on 5/6/16.
 */
var entityHelpers = require("../lib/helpersEntity");

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
			name = entityHelpers.entityName( entity );

		return chunk.write( name );
	}
};

module.exports = helpers;