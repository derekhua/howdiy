var express = require('express');
var router = express.Router();

Guides = require('../models/guides')

// GET

// Returns all guides
router.get('/', function(req, res) {
  Guides.getGuides(function(err, guide) {
    if(err) {
      throw err;
    }
    res.json(guide);
  }); 
});

// Returns single guide 
router.get('/:id', function(req, res) {
  var query = { 'id': req.params.id };
  Guides.getGuide(query, function(err, guide) {
    if(err) {
      throw err;
    }
    res.json(guide);
  }); 
});

// POST

router.post('/', function(req, res) {
  var guide = req.body;
  Guides.addGuide(guide, function(err, guide) {
    if(err) {
      console.log('Error occured in adding');
      console.log(err);
    } else {
      res.json(guide);
    }
  });
});

module.exports = router;