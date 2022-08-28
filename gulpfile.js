const {src, dest, watch, parallel, series} = require("gulp");

const less = require("gulp-less");
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const terser = require("gulp-terser"); //вместо аглифи js
const autoprefixer = require("autoprefixer");
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const csso = require("gulp-csso");
const svgstore = require("gulp-svgstore");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin"); // С 8 переход на ESM
const del = require("del"); // С 7 переход на ESM


function browsersync(done) {
  browserSync.init({
    server: {
      baseDir: "source/"
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}
function cleanBuild() {
  return del ("build")
}
function sprite() {
  return src("source/img/**/icon-*.svg")
    .pipe(svgstore())
    .pipe(rename("sprite.svg"))
    .pipe(dest("build/img"));
}
function images() {
  return src("source/img/**/*.{gif,jpg,png,svg}")
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(dest("build/img"));
}
function scrypts() {
  return src([
    "node_modules/jquery/dist/jquery.js",
    "source/js/main.js"
  ])
    .pipe(concat("main.min.js"))
    .pipe(terser())
    .pipe(dest("source/js"))
    .pipe(browserSync.stream());
}
function styles() {
  return src("source/less/style.less")
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(concat("style.min.css"))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(sourcemaps.write("."))
    .pipe(dest("source/css"))
    .pipe(browserSync.stream());
}
function copy() {
  return src([
    "source/css/style.min.css",
    "source/fonts/**/*",
    "source/js/main.min.js",
    "source/*.html"
  ], {base: "source"})
    .pipe(dest("build"))
}
function watching() {
  watch(["source/less/**/*.less"], styles);
  watch(["source/js/**/*.js", "!source/js/main.min.js"], scrypts);
  watch(["source/*.html"]).on("change", browserSync.reload);  
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.copy = copy;
exports.scrypts = scrypts;
exports.images = images;
exports.sprite = sprite;
exports.cleanBuild = cleanBuild;

exports.build = series(cleanBuild, images, sprite, copy)
exports.start = parallel(styles, scrypts, sprite, browsersync, watching);