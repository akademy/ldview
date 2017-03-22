var akademy = akademy || {};
akademy.webviews = akademy.webviews ||
	function( config ) {

		var configDefault = {
			views : [
				{url:"http://www.akademy.co.uk", title : "1 OK"},
				{url:"http://wouldlike.gift", title : "2 OK"},
				{url:"http://blog.akademy.co.uk", title : "3 OK"},
				{url:"httpf://error.example.com", title : "4 Error Bad schema"},
				{url:"http://!$&'()*+,;=.com", title : "5 Error Bad URL"},
				{url:"http://qweetergfsadgdvvbboisfgergerhjokjnmtn.com", title : "6 Unknown website"},
				{url:"http:/local", title : "7 OK", textCheck: "Not Found"},
				{url:"http://127.0.0.1", title : "8 OK"}
			],
			width: 206,
			height: 136,
			scale: 0.2,
			element: document.body
		};

		config = config || {};
		var _size = {
				w: config.width || configDefault.width,
				h: config.height || configDefault.height
			},
			_scale = config.scale || configDefault.scale,
			_scaledSize = {
				w: _size.w * (1/_scale),
				h : _size.h * (1/_scale)
			},
			_element = config.element || configDefault.element,
			_views = config.views || configDefault.views;

		var	_fullSize = {
				w: _size.w * 4,
				h: _size.h * 4
			},
			_windowSize = {
				w: window.innerWidth || document.body.clientWidth,
				h: window.innerHeight || document.body.clientHeight
			};

		if( _fullSize.w > _windowSize.w ) {
			_fullSize.w = _windowSize.w - 120;
		}
		if( _fullSize.h > _windowSize.h ) {
			_fullSize.h = _windowSize.h - 50;
		}

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
				" .iframe-wrap button {visibility:hidden;z-index:200;width:59px}" +
				" .iframe-wrap.full button {visibility:visible;position:relative;left:" + (_fullSize.w + 20) + "px;}" +
				" .iframe-wrap.full a:hover, .iframe-wrap.full a:hover.hide {background-color: rgba(0,0,0,0);color:transparent;}" +
				" .iframe-wrap iframe {width:" + _scaledSize.w + "px;height:" + _scaledSize.h + "px;transform: scale(" + _scale + ");position:absolute;transform-origin: 0 0;overflow: hidden;background-color:white}" +
				" .iframe-wrap.full iframe {width:" + _fullSize.w + ";height:" + _fullSize.h + "px;transform: scale(1);z-index:100;overflow: auto;}" +
				" .iframe-wrap.loading iframe { /*display:none*/ }" +
				" .iframe-wrap.loaded iframe { /*display:block*/ }"

				//" .iframe-wrap.loaded a {color: transparent }"
			));
			_element.appendChild(style);

			for( var i=0; i<_views.length; i++  ) {

				_views[i].status = "none";

				var div         = document.createElement("div"),
					iframe      = document.createElement("iframe"),
					a           = document.createElement("a"),
					aText       = document.createTextNode( _views[i].title ),
					br          = document.createElement("br"),
					buttonClose      = document.createElement("button"),
					buttonCloseText  = document.createTextNode( "✕" ), // ✕
					buttonRefresh      = document.createElement("button"),
					buttonRefreshText  = document.createTextNode( "↻" ); // ↻

				div.setAttribute( "class","iframe-wrap" );
				div.setAttribute( "id","iframe-wrap-" + i );

				iframe.setAttribute("src", "");
				iframe.setAttribute("scrolling", "no");
				iframe.setAttribute("seamless", "seamless");
				iframe.setAttribute( "id","iframe-" + i );

				iframe.onload = iFrameOnLoad.bind( iframe, _views[i] );
				iframe.onerror = iFrameOnError.bind( iframe, _views[i] );

				//iframe.addEventListener("message", function( event ) { console.log("A frame message:", event ); }, false);

				a.setAttribute("src",_views[i].url);
				a.setAttribute("alt",_views[i].title + " : " + _views[i].url);
				a.onclick = aOnClick.bind(a,iframe);

				buttonClose.setAttribute( "id","close" );
				buttonClose.onclick = buttonCloseOnClick.bind( buttonClose, iframe );

				buttonRefresh.setAttribute( "id","refresh" );
				buttonRefresh.onclick = buttonRefreshOnClick.bind( buttonRefresh, iframe, _views[i] );

				a.appendChild(br);
				a.appendChild(aText);
				div.appendChild(iframe);
				div.appendChild(a);
				buttonClose.appendChild(buttonCloseText);
				buttonRefresh.appendChild(buttonRefreshText);

				div.appendChild(buttonClose);
				div.appendChild(document.createElement("br"));
				div.appendChild(buttonRefresh);

				_element.appendChild(div);

				updateIFrame( iframe, _views[i], 50 * (i+1) );
				setTimeout( updateATitle.bind(this,a), 2500 );
			}

			function updateATitle(a) {
				a.classList.add("hide");
			}

			function updateIframeSrc(view) {
				view.status = "loading"; // Set "real" loading, not just about:blank page loaded!
				this.parentNode.classList.add("loading");
				this.setAttribute("src", view.url );
			}

			function iFrameOnLoad( view ) {
				if( view.status === "loading") {
					var divParent = this.parentNode;

					divParent.classList.remove("loading");
					view.status = "loaded";

					// try to detect page not loaded the right webpage...
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
							if (view.textCheck &&
								view.textCheck !== '' &&
								content.body.innerText.indexOf(view.textCheck) === -1) {
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
			function iFrameOnError( view ) {
				view.status = "errored";
				this.parentNode.classList.add("error");
			}

			function aOnClick ( iframe ) {
				iFrameLarge( iframe );
			}
			function buttonCloseOnClick ( iframe ) {
				iFrameSmall( iframe );
			}
			function buttonRefreshOnClick ( iframe, view ) {
				updateIFrame( iframe, view );
			}

			function updateIFrame( iframe, view, updateTime ) {
				setTimeout( updateIframeSrc.bind( iframe, view ), updateTime || 50 );
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
