var ev = ev || {};
ev.Rephrase = {
	// TODO: Need different backward and forward rephrasing e.g. (performance) "took place at" (place) BUT (place) "was where this was done" (performance)
	rephrases : {
		"http://erlangen-crm___org/current/P7_took_place_at" : {
			"forward" : "Took place at",
			"reverse" : "Occured here"
		},
		"http://erlangen-crm___org/efrbroo/R25F_performed_r" : {
			"forward": "Performed",
			"reverse": "Was performed by"
		},
		"http://www___w3___org/ns/prov#qualifiedAssociation" : {
			"forward": "Associated",
			"reverse": "Associated"
		},
		"http://www___w3___org/ns/prov#used_r" : {
			"forward" : "Used ",
			"reverse" : "Was used by"
		},
		"http://erlangen-crm___org/current/P12i_was_present_at" : {
			"forward": "Was present at",
			"reverse": "Involved"
		}
	},
	rephrase : function( key, direction ) {
		direction = direction || "forward";
		if( key in ev.Rephrase.rephrases ) {
			return ev.Rephrase.rephrases[key][direction];
		}

		return ev.Rephrase.pretty(key);

	},
	pretty : function( key ) {
		var splits = key.split("#");
		if( splits.length > 1 ) {
			key = splits[splits.length-1];
		}
		else {
			var splits = key.split("/");
			if (splits.length > 1) {
				key = splits[splits.length - 1];
			}
		}

		key = key.replace(/_/g, " ");
		key = key[0].toLocaleUpperCase() + key.substr(1);
		return key;
	}

};