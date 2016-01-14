var bodyParser 	= require('body-parser');
var express 		= require('express');
var helmet 			= require('helmet');
var jwt         = require('jwt-simple');
var mongoose 		= require('mongoose');
var morgan 			= require('morgan');
var passport		= require('passport');


var index 	= require('./routes/index');
var config 	= require('./config/database');
var signup 	= require('./routes/signup');
var auth 		= require('./routes/authenticate');
var guides 	= require('./routes/guides');
var users 	= require('./routes/users');

var app = express();

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// Parse application/json
app.use(bodyParser.json());
app.use(helmet());
// HTTP request logger
app.use(morgan('combined'));
app.use(passport.initialize());

// Connect to the howdiy_db
mongoose.connect(config.database);
var db = mongoose.connection;

// Set port number
app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res) {res.send('Use /api/');});
app.use('/api/', index);
app.use('/api/signup', signup);
app.use('/api/auth', auth);
app.use('/api/g', guides);
app.use('/api/u', users);

app.listen(app.get('port'), function() {
  console.log('Express started! Running on port ' + app.get('port') + '. Press CTRL-C to terminate');
});
