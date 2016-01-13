var express   = require('express');
var passport  = require('passport');
var router    = express.Router();

var TokenHelpers  = require('../utility/token-helpers')
var Guides        = require('../models/guides')

require('../config/passport')(passport);

// GET
// Returns all guides
router.get('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuides(function(err, guides) {
      if(err) {
        throw err;
      }
      res.json(guides);
    });
  });
});

// Returns single guide according to id
router.get('/:id', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.getGuide({ 'id': req.params.id }, function(err, guide) {
      if(err) {
        throw err;
      }
      res.json(guide);
    });
  });
});

// POST
router.post('/', passport.authenticate('jwt', { session: false}), function(req, res) {
  TokenHelpers.verifyToken(req, res, function(req, res) {
    Guides.addGuide(req.body, function(err, guide) {
      if(err) {
        console.log('Error occured in adding');
        console.log(err);
      } else {
        res.json(guide);
      }
    });
  });
});

module.exports = router;
