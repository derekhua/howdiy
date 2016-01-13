var express = require('express');
var router  = express.Router();

var User = require('../models/users')

// Create a new user account (POST http://localhost:8080/api/signup)
router.post('/', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } else {
    var newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    });
    // Save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

module.exports = router;
