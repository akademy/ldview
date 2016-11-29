var ev = ev || {};
ev.DustHelpers = {
	addHelpers: function( context ) {
		for (var func in ev.DustHelpers) {
			if ( func !== "addHelpers" && ev.DustHelpers.hasOwnProperty(func) ) {
				context[func] = ev.DustHelpers[func];
			}
		}
	},
	exists :  function(chunk, context, bodies, params) { // TODO: Is this needed? doesn't {#get} do this?!
		var entity = context.current();
		//console.log("exists::", "key:", params.key, "value:", entity[params.key], "entity:", entity );
		return params.key in entity;
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
		//console.log("typeIs::", "result:",result,params);
		return params.types.indexOf( result.o.type ) !== -1;
	},

	maxLength : function (chunk, context, bodies, params) {
		// https://github.com/framp/dustjs-helper-maxlength
		// e.g. {@maxLength length="10" /} => A comment...
		var str = context.current();
		if( params.key ) {
			str = str[params.key];
		}
		var originalLength = str.length;
		
		var breakWord = (params.break !== 'false');
		var limitByWord = (params.type === 'words');
		var limit = parseInt(params.length) || originalLength;
		var ellipsis = params.ellipsis || "...";
		
		console.log("maxLength::", "string:", str, "originalLength:", originalLength, "maxLength:", limit, "key:", params.key || "none" );
		
		if (originalLength <= limit ) {
			return chunk.write(str);
		}
		
		if (limitByWord){
			var words = str.replace(/['";:,.?¿\-!¡]+/g, '').trim().match(/\S+/g) || [];
			if (words.length>limit){
				var word = words[limit];
				var matches = 1;
				for (var i=0; i<limit; i++){
					matches += (words[i].match(new RegExp(word, 'g')) || []).length;
				}
				i = -1;
				while (matches-- && i++ < str.length){
					i = str.indexOf(word, i);
					if (i < 0) break;
				}
				if (i>-1)
					str = str.substr(0, i);
			}
		}
		if (breakWord){
			str = str.substr(0, limit);
		}
		if (!limitByWord && !breakWord ){
			var trimmed = str.substr(0, limit);
			str = trimmed.substr(0, Math.min(trimmed.length, trimmed.lastIndexOf(" ")));
		}
		ellipsis = (originalLength===str.length) ? '' : ellipsis;
		return chunk.write(str.trim() + ellipsis);
	}

};

try {
	module.exports = ev.DustHelpers;
}
catch (e) {}