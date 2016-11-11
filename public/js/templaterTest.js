/**
 * Created by matthew on 11/4/16.
 */
$(document).ready( function() {

	console.log("Begin test.");

	var tc = new ev.TemplateControl([]);
	tc.render( "test", {"name":"Matthew"}, function( error ) {
		// create error.
		if( !error ) {
			console.log("UNEXPECTED BEHAVIOUR: We should have an error here.");
		}
	});

	tc.addTemplate( "test", "/views/test.dust", function( error ) {
		if( error ) {
			console.log( error );
		}
		else {
			console.log( "Template *test* loaded");
		}
	});

	tc.render( "test", {"name":"Matthew"}, function( error, result ) {
		if( error ) {
			console.log("UNEXPECTED BEHAVIOUR: Error NOT expected!", error);
		}
		else {
			console.log("Result:", result );
		}
	});

	tc.render( "test", {"name":"Jeremiah"}, function( error, result ) {
		if( error ) {
			console.log("UNEXPECTED BEHAVIOUR: Error NOT expected!", error);
		}
		else {
			console.log("Result:", result );
		}
	});

});
