var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
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

/* GET home page. */
router.get('/second', function(req, res, next) {
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
