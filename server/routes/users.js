var express = require('express');
var router = express.Router();

Users = require('../models/users')

// GET

// Returns all users
router.get('/', function(req, res) {
  Users.getUsers(function(err, user) {
    if(err) {
      throw err;
    }
    res.json(user);
  }); 
});

// Returns single user 
router.get('/:id', function(req, res) {
  var query = { 'id': req.params.id };
  Users.getUser(query, function(err, user) {
    if(err) {
      throw err;
    }
    res.json(user);
  }); 
});

// POST

router.post('/', function(req, res) {
  var user = req.body;
  Users.addUser(user, function(err, user) {
    if(err) {
      console.log('Error occured in adding');
      console.log(err);
    } else {
      res.json(user);
    }
  });
});

module.exports = router;