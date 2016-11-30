var ev = ev || {};
ev.Rephrase = {
	rephrases : {
		"http://erlangen-crm___org/current/P7_took_place_at" :
			"Took place at",
		"http://erlangen-crm___org/efrbroo/R25F_performed_r" :
			"Performed",
		"http://www___w3___org/ns/prov#qualifiedAssociation" :
			"Associated",
		"http://www___w3___org/ns/prov#used_r" :
			"Used"
	},
	rephrase : function( key ) {
		if( key in ev.Rephrase.rephrases ) {
			return ev.Rephrase.rephrases[key];
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
		return key;
	}

};