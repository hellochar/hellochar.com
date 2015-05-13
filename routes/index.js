var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index');
});

router.get('/line', function(req, res) {
  res.render('line');
});

module.exports = router;
