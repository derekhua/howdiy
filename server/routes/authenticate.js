var express = require('express');
var jwt     = require('jwt-simple');
var config  = require('../config/database');
var router  = express.Router();

var User = require('../models/users');

// Route to authenticate a user (POST http://localhost:8080/api/auth)
router.post('/', function(req, res) {
  User.getUser({username: req.body.username}, function(err, user) {
    if (err) throw err;
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // If user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // Return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

module.exports = router;
