var express = require('express');
var router = express.Router();

Test1 = require('../models/test1')

// GET example
router.get('/', function(req, res) {
  Test1.getTest1(function(err, test1) {
    if(err) {
      throw err;
    }
    res.json(test1);
  }); 
});

// POST example
router.post('/', function(req, res) {
  var test1 = req.body;
  Test1.addTest1(test1, function(err, test1) {
    if(err) {
      throw err;
    }
    res.json(test1);
  }); 
});

module.exports = router;