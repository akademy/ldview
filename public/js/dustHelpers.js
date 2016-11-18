var ev = ev || {};
ev.DustHelpers = {
	get :  function(chunk, context, bodies, params) {
		var entity = context.current();
		console.log("get::", "key:", params.key, "value:", entity[params.key], "entity:", entity );
		return entity[params.key]; //chunk.write( entity[params.key] );
	},
	getValue : function(chunk, context, bodies, params) {
		var entity = context.current();
		console.log("getValue::", "key:", params.key, "value:", entity[params.key], "entity:", entity );
		return chunk.write( entity[params.key] );
	}
};
