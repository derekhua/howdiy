var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var jshint = require('gulp-jshint');
var jasmineNode = require('gulp-jasmine-node');
var nodemon = require('gulp-nodemon');

var paths = {
  sass: ['./scss/**/*.scss'],
  www: ['www/js/**/.js'],
  server: ['server/**/.js']
};

gulp.task('default', ['sass']);
gulp.task('server', ['server']);
gulp.task('test', ['lint-server', 'lint-www','server-test']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('lint-server', function() {
    return gulp.src(paths.server, {base: './'})
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

gulp.task('lint-www', function() {
    return gulp.src(paths.www, {base: './'})
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

gulp.task('server-test', function () {
    return gulp.src(['server/specs/**/*spec.js'])
      .pipe(jasmineNode({timeout: 10000}));
});

gulp.task('server', function () {
  nodemon({ script: 'server/server.js'
          , ext: 'html js'
          , ignore: ['ignored.js']
          , tasks: ['lint-server'] })
    .on('restart', function () {
      console.log('restarted!')
    });
})
