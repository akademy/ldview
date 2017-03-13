var akademy = akademy || {};
akademy.webviews = akademy.webviews ||
	function( config ) {

		config = config || {};
		var _size = {
				w: config.width || 206,
				h: config.height || 136
			},
			_scale = config.scale || 0.2,
			_scaledSize = {
				w: _size.w * (1/_scale),
				h : _size.h * (1/_scale)
			},
			_element = config.element || document.body,
			_addresses = config.addresses || [
					{website:"http://www.akademy.co.uk", title : "1 OK"},
					{website:"http://wouldlike.gift", title : "2 OK"},
					{website:"http://blog.akademy.co.uk", title : "3 OK"},
					{website:"httpf://error.example.com", title : "4 Error Bad schema"},
					{website:"http://!$&'()*+,;=.com", title : "5 Error Bad URL"},
					{website:"http://qweetergfsadgdvvbboisfgergerhjokjnmtn.com", title : "6 Unknown website"},
					{website:"http:/local", title : "7 OK", textCheck: "Not Found"},
					{website:"http://127.0.0.1", title : "8 OK"}

				],
			_windows = [];

		window.addEventListener("message", function( event ) { console.log("A window message:", event ); }, false);
		window.addEventListener("load", function() {

			var style = document.createElement("style");
			style.appendChild(document.createTextNode(
				" .iframe-wrap {width:" + _size.w + "px;height:" + _size.h + "px;padding:0;margin:0;display:inline-block;background-color:white;margin:5px;border:3px solid black}" +
				" .iframe-wrap.full {position:absolute;top:20px;left:20px;}" +
				" .iframe-wrap.loading { border-color: blue; }" +
				" .iframe-wrap.loaded-ok { border-color: limegreen; }" +
				" .iframe-wrap.loaded-restricted { border-color: green; }" +
				" .iframe-wrap.loaded-errored { border-color: red; }" +
				" .iframe-wrap.error { border-color: #f55; }" +
				" .iframe-wrap a {width:" + _size.w + "px;height:" + _size.h + "px;padding:0;margin:0;display:block;position:absolute;background-color:transparent;text-align:center;font-size:20px;font-weight:bold;}" +
				" .iframe-wrap a:hover {background-color: rgba(0,0,0,0.5);color:white;}" +
				" .iframe-wrap a.hide {color: transparent }" +
				" .iframe-wrap a:hover.hide {color: white }" +
				" .iframe-wrap button {visibility:hidden;position:relative;left:" + _scaledSize.w + "px;}" +
				" .iframe-wrap.full button {visibility:visible;}" +
				" .iframe-wrap.full a:hover, .iframe-wrap.full a:hover.hide {background-color: rgba(0,0,0,0);color:transparent;}" +
				" .iframe-wrap iframe {width:" + _scaledSize.w + "px;height:" + _scaledSize.h + "px;transform: scale(" + _scale + ");position:absolute;transform-origin: 0 0;overflow: hidden;}" +
				" .iframe-wrap.full iframe {width:1010px;height:685px;transform: scale(1);z-index:100;overflow: auto;}" +
				" .iframe-wrap.loading iframe { display:none }" +
				" .iframe-wrap.loaded iframe { display:block }"

				//" .iframe-wrap.loaded a {color: transparent }"
			));
			_element.appendChild(style);

			for( var i=0; i<_addresses.length; i++  ) {

				_addresses[i].status = "none";

				var div         = document.createElement("div"),
					iframe      = document.createElement("iframe"),
					a           = document.createElement("a"),
					aText       = document.createTextNode( _addresses[i].title ),
					br          = document.createElement("br"),
					button      = document.createElement("button"),
					buttonText  = document.createTextNode( "Close" );

				div.setAttribute( "class","iframe-wrap" );
				div.setAttribute( "id","iframe-wrap-" + i );

				iframe.setAttribute("src", "");
				iframe.setAttribute("scrolling", "no");
				iframe.setAttribute("seamless", "seamless");
				iframe.setAttribute( "id","iframe-" + i );

				iframe.onload = iFrameOnLoad.bind( iframe, _addresses[i] );
				iframe.onerror = iFrameOnError.bind( iframe, _addresses[i] );

				//iframe.addEventListener("message", function( event ) { console.log("A frame message:", event ); }, false);

				a.setAttribute("src",_addresses[i].website);
				a.setAttribute("alt",_addresses[i].title + " : " + _addresses[i].website);
				a.onclick = aOnClick.bind(a,iframe);

				button.onclick = buttonOnClick.bind( button, iframe );
				button.setAttribute("value","Close");

				a.appendChild(br);
				a.appendChild(aText);
				div.appendChild(iframe);
				div.appendChild(a);
				button.appendChild(buttonText);
				div.appendChild(button);
				_element.appendChild(div);

				_windows.push( div );

				setTimeout( updateIframeSrc.bind(iframe,_addresses[i]), 50 * (i+1) );
				setTimeout( updateATitle.bind(this,a), 2500 );
			}

			function updateATitle(a) {
				a.classList.add("hide");
			}

			function updateIframeSrc(addressData) {
				addressData.status = "loading"; // Set "real" loading, not just about:blank page loaded!
				this.parentNode.classList.add("loading");
				this.setAttribute("src", addressData.website );
			}

			function iFrameOnLoad( addressData ) {
				if( addressData.status === "loading") {
					var divParent = this.parentNode;

					divParent.classList.remove("loading");
					addressData.status = "loaded";

					// try to detect page not loaded the right website...
					try {
						var content = (this.contentWindow || this.contentDocument);
						if (content.document) {
							content = content.document;
						}

						if (!content.implementation || !content.body || !content.body.innerText ||
							content.body.childElementCount === 0) {
							divParent.classList.add("loaded-errored");
						}
						else {
							if (addressData.textCheck &&
								addressData.textCheck !== '' &&
								content.body.innerText.indexOf(addressData.textCheck) === -1) {
								divParent.classList.add("loaded-errored");
							}
							else {
								divParent.classList.add("loaded-ok");
							}
						}
					}
					catch(all) {
					    //Not allowed access to iframe as on another domain.
						divParent.classList.add("loaded-restricted");
					}
				}

			}

			/* Detect loading errors (but not server errors on particular page!), such as an invalid URL */
			function iFrameOnError( addressData ) {
				_addresses[i].status = "errored";
				this.parentNode.classList.add("error");
			}

			function aOnClick ( iframe ) {
				iFrameLarge( iframe );
			}
			function buttonOnClick ( iframe ) {
				iFrameSmall( iframe );
			}

			function iFrameLarge( iframe ) {
				iframe.parentNode.classList.add("full");
				iframe.setAttribute("scrolling", "yes");
			}
			function iFrameSmall( iframe ) {
				iframe.parentNode.classList.remove("full");
				iframe.setAttribute("scrolling", "no");
			}



		}, false);
	};
