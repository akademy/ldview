var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	res.render('index2', {});
});

router.get('/test', function(req, res, next) {
  res.render('partial', {
	  features: [
		  {name: "async"},
		  {name: "helpers"},
		  {name: "filters"},
		  {name: "a little bit of logic"},
		  {name: "and more"}
	  ]
  });
});


router.get('/test/second', function(req, res, next) {
	res.render('index', {
		features: [
			{name: "async"},
			{name: "helpers"},
			{name: "filters"},
			{name: "a little bit of logic"},
			{name: "and more"}
		]
	});
});

module.exports = router;
