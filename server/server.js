var bodyParser = require('body-parser');
var express = require('express');
var helmet = require('helmet');
var mongoose = require('mongoose');

var index = require('./routes/index');
var test1 = require('./routes/test1');
var guides = require('./routes/guides');
var users = require('./routes/users');

var app = express();

app.use(bodyParser.json());
app.use(helmet());

// Connect to the howdiy_db
mongoose.connect('mongodb://howdiy-admin:lobster897@ds039095.mongolab.com:39095/howdiy-db');
var db = mongoose.connection;

// Set port number
app.set('port', process.env.PORT || 3000);

// Root
app.get('/', function(req, res) {
  res.send('Use /api/'); 
});

app.use('/api/', index);
app.use('/api/test1', test1);
app.use('/api/g', guides);
app.use('/api/u', users);

app.listen(app.get('port'), function() {
  console.log('Express started! Running on port ' + app.get('port') + '. Press CTRL-C to terminate');
});
