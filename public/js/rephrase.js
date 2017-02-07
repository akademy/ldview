var ev = ev || {};
ev.Rephrase = {
	// TODO: Need different backward and forward rephrasing e.g. (performance) "took place at" (place) BUT (place) "was where this was done" (performance)
	rephrases : {
		"http://erlangen-crm___org/current/P7_took_place_at" : {
			"forward" : "Occured here",
			"reverse" : "Took place at"
		},
		"http://erlangen-crm___org/efrbroo/R25F_performed_r" : {
			"forward": "Performed these",
			"reverse": "Performed by"
		},
		"http://erlangen-crm___org/efrbroo/R25F_performed" : {
			"forward": "Performed",
			"reverse": "Was performed by"
		},
		"http://www___w3___org/ns/prov#qualifiedAssociation" : {
			"forward": "Associated",
			"reverse": "Associated"
		},
		"http://www___w3___org/ns/prov#used_r" : {
			"forward" : "Used these",
			"reverse" : "Was used by"
		},
		"http://www___w3___org/ns/prov#used" : {
			"forward" : "Used",
			"reverse" : "Was used by"
		},
		"http://erlangen-crm___org/current/P12i_was_present_at" : {
			"forward": "Was present at",
			"reverse": "Involved"
		}
	},
	rephrase : function( key, direction ) {
		direction = direction || "forward";
		var phrase = '';
		if( key in ev.Rephrase.rephrases ) {
			phrase = ev.Rephrase.rephrases[key][direction];
		}
		else {
			phrase = ev.Rephrase.pretty(key);
		}

		return '<span title="' + key.replace("___",".") + '">' + phrase + "</span>";
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