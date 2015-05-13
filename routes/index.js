var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index');
});

router.get(/\w+/, function(req, res) {
  var sketchName = /\w+/.exec(req.url)[0];
  res.render('singleSketch', { sketchName: sketchName });
});

module.exports = router;
