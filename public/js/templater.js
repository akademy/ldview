/**
 * Created by matthew on 11/11/16.
 */
var ev = ev || {};
ev.TemplateControl = function() {
	"strictmode";

	const LOAD = {
		INIT: 0,
		LOADING: 1,
		LOADED: 2,
		ERRORED: 3
	};

	var templates = [
		/*
		{
			name : "name",
			url : "/views/name.dust",
			loading : true,
			waiting : []
		}
		*/
	];

	this.addTemplate = function( name, url, callback ) {
		if( !haveTemplate(name) ) {

			var template = {
				name : name,
				url : url,
				load : LOAD.INIT,
				waiting: []
			};

			templates.push( template );

			requestTemplate( template, callback );
		}
		// else ignore
	};

	this.render = function( name, data, callback ) {
		var template = getTemplate( name );

		if( template !== null ) {

			if( template.load === LOAD.LOADED ) {
				dustRender( name, data, callback );
			}
			else if( template.load === LOAD.ERRORED ) {
				callback( new Error( "Unable to load template" ) );
			}
			else {
				template.waiting.push( {
					name: name,
					data: data,
					callback: callback
				} );
			}
		}
		else {
			callback(new Error("Template not added"));
		}
	};

	function dustRender( name, data, callback ) {
		dust.render( name, data, callback );
	}

	function requestTemplate( template, callback ) {
		template.load = LOAD.LOADING;

		$.get( template.url )
			.done( function( requested ) {
				template.load = LOAD.LOADED;
				dust.loadSource( dust.compile( requested, template.name ) );

				callback(null);

				if( template.waiting.length !== 0 ) {
					for( var i=0, z=template.waiting.length; i<z; i++ ) {
						dustRender( template.waiting[i].name, template.waiting[i].data, template.waiting[i].callback );
					}
				}

			})
			.fail( function( error ) {
				template.load = LOAD.ERRORED;

				callback(error);

				if( template.waiting.length !== 0 ) {
					for( var i=0, z=template.waiting.length; i<z; i++ ) {
						template.waiting[i].callback( new Error( "Can't load template") )
					}
				}
			})
	}

	function getTemplate( name ) {
		for( var i=0, z=templates.length; i<z; i++ ) {
			if( templates[i].name === name ) {
				return templates[i];
			}
		}
		return null;
	}

	function haveTemplate( name ) {
		return getTemplate(name) !== null;
	}
};
