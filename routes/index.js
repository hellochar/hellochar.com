var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index');
});

router.get('/:sketchName', function(req, res) {
  res.render('singleSketch', { sketchName: req.params.sketchName });
});

module.exports = router;
