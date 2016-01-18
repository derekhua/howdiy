var bodyParser 	= require('body-parser');
var express 		= require('express');
var helmet 			= require('helmet');
var jwt         = require('jwt-simple');
var mongoose 		= require('mongoose');
var morgan 			= require('morgan');
var passport		= require('passport');
var multipart   = require('connect-multiparty');
var fs          = require('fs');

var index     = require('./routes/index');
var config    = require('./config/database');
var signup    = require('./routes/signup');
var auth      = require('./routes/authenticate');
var guides    = require('./routes/guides');
var users     = require('./routes/users');
var s3Client  = require('./config/s3')

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

// For cross-domain requests
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization");
  next();
});

app.get('/', function(req, res) {res.send('Use /api/');});

// Test route for posting photos
app.post('/photos', multipart(), function(req, res) {
  var filepath = req.files.file.path;
  console.log("Request filepath: " + filepath);
  fs.readFile(filepath, function (err, data) {
    var filename = req.files.file.name;
    if (filename.substr(filename.lastIndexOf('.') + 1) !== 'jpg') {
      filename += '.jpg';
    }
    console.log("File name: " + filename);
    if (err) {
      console.log(err);
    }
    else {
      var params = {
        localFile: filepath,
        s3Params: {
          Bucket: "howdiy",
          Key: filename
        }
      };
      var uploader = s3Client.uploadFile(params);
      uploader.on('error', function(err) {
        console.error("unable to upload:", err.stack);
        res.sendStatus(500);
      });
      uploader.on('progress', function() {
        console.log("progress", uploader.progressMd5Amount,
        uploader.progressAmount, uploader.progressTotal);
      });
      uploader.on('end', function() {
        console.log("Done uploading");
        res.sendStatus(200);
      });
    };
  });
});

app.use('/api/', index);
app.use('/api/signup', signup);
app.use('/api/auth', auth);
app.use('/api/g', guides);
app.use('/api/u', users);
// Access photos dir
app.use('/photos', express.static(__dirname + '/photos'));

app.listen(app.get('port'), function() {
  console.log('Express started! Running on port ' + app.get('port') + '. Press CTRL-C to terminate');
});
