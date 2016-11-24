var ev = ev || {};
ev.DustHelpers = {
	addHelpers: function( context ) {
		for (var func in ev.DustHelpers) {
			if ( func !== "addHelpers" && ev.DustHelpers.hasOwnProperty(func) ) {
				context[func] = ev.DustHelpers[func];
			}
		}
	},
	get :  function(chunk, context, bodies, params) {
		var entity = context.current();
		//console.log("get::", "key:", params.key, "value:", entity[params.key], "entity:", entity );
		return entity[params.key]; //chunk.write( entity[params.key] );
	},
	getValue : function(chunk, context, bodies, params) {
		var entity = context.current();
		//console.log("getValue::", "key:", params.key, "value:", entity[params.key], "entity:", entity );
		return chunk.write( entity[params.key] );
	},

	typeIs : function(chunk, context, bodies, params) {
		var result = context.current();
		console.log("typeIs::", "result:",result,params);
		return params.types.indexOf( result.o.type ) !== -1;
	}
};

try {
	module.exports = ev.DustHelpers;
}
catch (e) {}