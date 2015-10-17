var gulp 	 = require('gulp');
var sass   = require('gulp-sass');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');

gulp.task('sass', function () {
  gulp.src('./src/style/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./src/style'))
    // .pipe(uglifycss())
    .pipe(gulp.dest('./public/style'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./src/style/*.scss', ['sass']);
});

gulp.task('compressJS', function() {
  gulp.src('./src/js/*.js')
    // .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});

gulp.task('js:watch', function () {
  gulp.watch('./src/js/*.js', ['compressJS']);
});

gulp.task('default', ['sass', 'sass:watch', 'compressJS', 'js:watch']);