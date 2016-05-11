/**
 * Created by matthew on 5/11/16.
 */

var helpers = {
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