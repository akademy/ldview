var akademy = akademy || {};
akademy.webviews = akademy.webviews ||
function( config ) {

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
			{website:"http://www.akademy.co.uk",text : "Matthew"},
			{website:"http://wouldlike.gift",text : "Gift"}
		],
		_windows = [];
		
	window.addEventListener("load", function() {

		var style = document.createElement("style");
		style.appendChild(document.createTextNode( 
			" .iframe-wrap {width:" + _size.w + "px;height:" + _size.h + "px;padding:0;margin:0;display:inline-block;margin:5px;}" +
			" .iframe-wrap.full {position:absolute;top:20px;left:20px;}" +
			" .iframe-wrap a {width:" + _size.w + "px;height:" + _size.h + "px;padding:0;margin:0;display:block;position:absolute;background-color:transparent;text-align:center;font-size:20px;font-weight:bold;}" +
			" .iframe-wrap a:hover {background-color: rgba(0,0,0,0.5);color:white;}" +
			" .iframe-wrap button {visibility:hidden;position:relative;left:" + _scaledSize.w + "px;}" +
			" .iframe-wrap.full button {visibility:visible;}" +
			" .iframe-wrap.full a:hover, .iframe-wrap.full a:hover.hide {background-color: rgba(0,0,0,0);color:transparent;}" + 
			" .iframe-wrap iframe {width:" + _scaledSize.w + "px;height:" + _scaledSize.h + "px;transform: scale(" + _scale + ");position:absolute;transform-origin: 0 0;overflow: hidden;}" +
			" .iframe-wrap.full iframe {width:1010px;height:685px;transform: scale(1);z-index:100;overflow: auto;}" +
			" .iframe-wrap.loading iframe { display:none }" +
			" .iframe-wrap.loaded iframe { display:block }" +
			//" .iframe-wrap.loaded a {color: transparent }" +
			" .iframe-wrap a.hide {color: transparent }" +
			" .iframe-wrap a:hover.hide {color: white }"
		));
		_element.appendChild(style);
	
		for( var i=0; i<_addresses.length; i++  ) {

			var div         = document.createElement("div"),
				iframe      = document.createElement("iframe"),
				a           = document.createElement("a"),
				aText       = document.createTextNode( _addresses[i].text ),
				br          = document.createElement("br"),
				button      = document.createElement("button"),
				buttonText  = document.createTextNode( "Close" );

			div.setAttribute( "class","iframe-wrap loading" );
			div.setAttribute( "id","iframe-wrap-" + i );

			iframe.setAttribute("src", "");
			iframe.setAttribute("scrolling", "no");
			iframe.setAttribute("seamless", "seamless");
			//iframe.setAttribute("class","loading");
			iframe.setAttribute( "id","iframe-" + i );

			iframe.onload = iFrameOnLoad.bind( iframe, div );
			iframe.onerror = iFrameOnError.bind( iframe, aText );

			a.setAttribute("src",_addresses[i].website);
			a.setAttribute("alt",_addresses[i].text + " : " + _addresses[i].website);
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
			
			setTimeout( updateIframeSrc.bind(this,iframe,i), 50 );
			setTimeout( updateATitle.bind(this,a), 2500 );
		}

		function updateATitle(a) {
			a.classList.add("hide");
		}
		
		function updateIframeSrc(iframe, config_number) {
			iframe.setAttribute("src", _addresses[config_number].website );
		}
		function iFrameOnLoad( div ) {
			this.parentNode.classList.remove("loading");
			this.parentNode.classList.add("loaded");

			/*
			// try to detect page not loaded the right website...
			var content = (this.contentWindow || this.contentDocument);
			if (content.document) content = content.document;

			console.log( content );
			if( content.implementation ) {
				this.parentNode.classList.add("loaded");
			}
			else {
				this.parentNode.classList.add("errored");
			}*/
		}
		/* Detect loading errors (but not server errors on particular page!) */
		function iFrameOnError(aText) {
			console.log("Errored", this, aText);
			aText.currentText = "ERROR!";
		}
		function aOnClick ( iframe ) {
			for( var i=0;i<_windows.length;i++) {
				_windows[i].classList.remove("full");
			}
			iframe.parentNode.classList.add("full");
		}

		function buttonOnClick ( iframe ) {
			for( var i=0;i<_windows.length;i++) {
				_windows[i].classList.remove("full");
			}
		}

	}, false);
};
