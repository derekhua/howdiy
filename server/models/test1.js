var mongoose = require('mongoose');

// Test1 Schema
var test1Schema = mongoose.Schema({
  name: {
    type: String, 
    required: true
  },
  create_date: {
    type: Date,
    default: Date.now
  }
});

// Exporting Test1 
// test1 references the db colleciton
var Test1 = module.exports = mongoose.model('Test1', test1Schema);

// Exporting a simple find all query getTest1()
module.exports.getTest1 = function(callback, limit) {
  Test1.find(callback).limit(limit);
};

module.exports.addTest1 = function(test1, callback) {
  Test1.create(test1, callback);
};
