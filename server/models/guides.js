var mongoose = require('mongoose');

// Guide Schema
var guideSchema = mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  picturePath: {
    type: String
  },
  author: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    required: true
  },
  steps: [{
    picturePath: {
      type: String
    },
    body: {
      type: String,
      default: ""
    },
    comments: [{
      body: String,
      date: Date
    }]
  }],
  comments: [{
    body: String,
    date: Date
  }],
  meta: {
    favs: Number,
    createDate: {
      type: Date,
      default: Date.now
    }
  }
});

var Guides = module.exports = mongoose.model('Guides', guideSchema);

module.exports.getGuide = function(params, callback, limit) {
  Guides.findOne(params, callback).limit(limit);
};

module.exports.getGuides = function(params, callback, limit) {
  Guides.find(params, callback).limit(limit);
};

module.exports.addGuide = function(guide, callback) {
  Guides.create(guide, callback);
};
