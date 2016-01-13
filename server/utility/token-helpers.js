var config  = require('../config/database');
var jwt     = require('jwt-simple');
var Users   = require('../models/users')

var verifyToken = function(req, res, callback) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Users.getUser({username: decoded.username}, function(err, user) {
      if (err) throw err;
      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      }
      callback(req, res);
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
}

var getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports.verifyToken = verifyToken;
module.exports.getToken = getToken;
