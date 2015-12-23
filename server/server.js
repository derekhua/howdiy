var bodyParser = require('body-parser');
var express = require('express');
var helmet = require('helmet');
var mongoose = require('mongoose');

var app = express();

app.use(bodyParser.json());
app.use(helmet());

Test1 = require('./models/test1')

// Connect to the db
// howdiy_test is the name of the db
mongoose.connect('mongodb://localhost/howdiy_test');
var db = mongoose.connection;

// Set port number
app.set('port', process.env.PORT || 3000);

// Root
app.get('/', function(req, res) {
  res.send('Use /api/'); 
});

// GET example
app.get('/api/test1', function(req, res) {
  Test1.getTest1(function(err, test1) {
    if(err) {
      throw err;
    }
    res.json(test1);
  }); 
});

// POST example
app.post('/api/test1', function(req, res) {
  var test1 = req.body;
  Test1.addTest1(test1, function(err, test1) {
    if(err) {
      throw err;
    }
    res.json(test1);
  }); 
});

app.listen(app.get('port'), function() {
  console.log('Express started! Running on port ' + app.get('port') + '. Press CTRL-C to terminate');
});
