var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hoffman = require('hoffman');

var routes = require('./routes/index');
var routesEntities = require('./routes/entities');
var routesFentities = require('./routes/fentities');
var routesData = require('./routes/ajax-entities');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'dust');
app.engine('dust', hoffman.__express());

app.use(hoffman.stream);

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'))); // uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view cache', false);

app.use('/', routes);
app.use('/entities/', routesEntities);
app.use('/fentities/', routesFentities);
app.use('/data/', routesData );

if (app.get('env') === 'production') {
	// optionally load all templates into dust cache on server start
	hoffman.prime(app.settings.views, function(err) {
		// views are loaded
	});
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;


/*
// Testing a simple streaming template.
var path = require('path'),
	hoffman = require('hoffman'),
	express = require('express'),
	request = require('request');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'dust');
app.engine('dust', hoffman.__express());

// This is the important part-- it adds res.stream()
app.use(hoffman.stream);

app.get('/', function (req, res) {
	res.stream("hello", {
		"async": function(chunk, context, bodies, params) {
			return chunk.map(function(chunk) {
				// Introducting an artificial delay to make streaming more apparent
				setTimeout(function() {
					request('http://www.dustjs.com/')
						.on('data', chunk.write.bind(chunk) )
						.on('end', chunk.end.bind(chunk));
				}, 3000);
			});
		}
	});
});

app.listen(3000, function () {
	console.log('Visit http://localhost:3001 to see streaming!');
});

module.exports = app;
*/
