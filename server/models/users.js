var mongoose = require('mongoose');

// User Schema
var userSchema = mongoose.Schema({
  id: {
    type: String, 
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  firstName: {
    type: String, 
    required: true
  },
  lastName: {
    type: String, 
    required: true
  },
  profilePicturePath: {
    type: String
  },
  meta: {
    followers: Number,
    createDate: {
      type: Date,
      default: Date.now
    }
  }
});

var Users = module.exports = mongoose.model('Users', userSchema);

module.exports.getUser = function(query, callback, limit) {
  Users.findOne(query, callback).limit(limit);
};

module.exports.getUsers = function(query, callback, limit) {
  Users.find(query, callback).limit(limit);
};

module.exports.addUser = function(user, callback) {
  Users.create(user, callback);
};