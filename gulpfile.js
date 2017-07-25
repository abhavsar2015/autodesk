/**
 * Created by bapur on 7/17/2017.
 */
var  gulp= require('gulp'),
    clean=require('gulp-clean'),
    inject=require('gulp-inject'),
    bowerFiles=require('main-bower-files'),
    angularFilesort=require('gulp-angular-filesort'),
    filter=require('gulp-filter'),
    concat=require('gulp-concat'),
    cleanCss=require('gulp-clean-css'),
    uglify=require('gulp-uglify'),
    merge=require('merge-stream'),
    gutil = require('gulp-util'),
    war=require('gulp-war'),
    zip=require('gulp-zip'),
    browserSync=require('browser-sync'),
    pump = require('pump');
    babelify = require('babelify');
    browserify=require('gulp-browserify')

var config ={
    paths:{
        src:'./src',
        build:'./build',
        bower:'./bower_components'
    }
};

gulp.task('clean',function () {
    return gulp.src(config.paths.build,{read:false})
        .pipe(clean());
});

gulp.task('inject',function () {
    var cssFiles=gulp.src([
        config.paths.src+'/**/*.css'
    ],{read:false});
    var jsFiles=gulp.src([
        config.paths.src+'/**/*.js'
    ]);

    return gulp.src(config.paths.src+'/index.html')
        .pipe(inject(gulp.src(bowerFiles(),{read:false}),{name:'bower'}))
        .pipe(inject(cssFiles,{ignorePath:'src',addRootSlash: false}))
        .pipe(inject(jsFiles.pipe(browserify({
            extensions: [
                'es6'
            ],
            transform: [babelify.configure({
                presets: ['es2015']
            })],
        })).pipe(angularFilesort()),{ignorePath:'src',addRootSlash: false}))
        .pipe(gulp.dest(config.paths.build));
});
gulp.task('js', function () {
    gulp.src(config.paths.src+'/app/controllers/uploadFileController.js')
        .pipe(browserify({
            transform: ['babelify'],
        }))
        .pipe(gulp.dest('./public/js'))
});
gulp.task('serve',['inject'],function () {
    browserSync.init({
        startPath: '/',

        server:{
            baseDir:[config.paths.build,config.paths.bower,config.paths.src],
            routes: {
                "/bower_components": "bower_components",
            },
            port: 8081

        },
        files:[
            config.paths.src+'/**'
        ]
    });
});
gulp.task('minifyCss',function () {
    var appStyles=gulp.src(config.paths.src+'/views/**/*.css')
        .pipe(concat('app.min.css'))
        .pipe(cleanCss({debug:true,compatibility:'ie8'}))
        .pipe(gulp.dest(config.paths.build+'/style'));

    var vendorStyles=gulp.src(bowerFiles())
        .pipe(filter(['**/*.css']))
        .pipe(concat('vendor.min.css'))
        .pipe(cleanCss({debug:true,compatibility:'ie8'}))
        .pipe(gulp.dest(config.paths.build+'/style'));


    return merge(vendorStyles,appStyles);
});
gulp.task('minifyJs',function (cb) {
    var vendorScripts=gulp.src(bowerFiles())
        .pipe(filter(['**/*.js']))
        .pipe(concat('vendor.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(config.paths.build+'/scripts'));

    //var templateScripts=gulp.src(config.paths.src+'/app/views/js/*.js')
      //  .pipe(filter(['**/*.js']))
        //.pipe(concat('template.min.js'))
        //.pipe(uglify())
        //.pipe(gulp.dest(config.paths.build+'/scripts'));
   // var appScripts= pump([
    //    gulp.src([
      //      config.paths.src+'/**/*.js'
        //]),
       // browserify({
    //     transform: ['babelify'],
    //  }),
    //  concat('app.min.js'),
    //  uglify(),
    //  gulp.dest(config.paths.build+'/scripts'),
    //], cb);
    var appScripts=gulp.src(config.paths.src+'/**/*.js')
        .pipe(browserify({
            extensions: [
                'es6'
            ],
            transform: [babelify.configure({
                presets: ['es2015']
            })],
              }))
        .pipe(angularFilesort())
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(config.paths.build+'/scripts'));
    return merge(vendorScripts,appScripts);
});

gulp.task('htmls',function () {
    return gulp.src([config.paths.src+'**/*.html','!'+config.paths.src+'/index.html'])
        .pipe(gulp.dest(config.paths.build));
});

gulp.task('fonts',function () {
    var bower_fonts= gulp.src(bowerFiles())
        .pipe(filter(['**/*.{eat,svg,ttf,woff,woff2}']))
        .pipe(gulp.dest(config.paths.build+'/fonts'));
    var template_fonts= gulp.src(config.paths.src)
        .pipe(filter(['**/*.{eat,svg,ttf,woff,woff2}']))
        .pipe(gulp.dest(config.paths.build+'/fonts'));
    return merge(bower_fonts,template_fonts);
});
gulp.task('images',function () {
    return gulp.src(config.paths.src+'/app/views/images/*.{jpg,png,svg}')
        .pipe(gulp.dest(config.paths.build+'/images'));
});
gulp.task('other',function () {
    return gulp.src([config.paths.src+'**/*.*','!**/*.html','!**/*.css','!**/*.js'])
        .pipe(gulp.dest(config.paths.build));
});
gulp.task('war', function () {
    gulp.src(["build/*"])
        .pipe(war({
            welcome: 'src/index.html',
            displayName: 'Grunt WAR',
        }))
        .pipe(zip('myApp.zip'))
        .pipe(gulp.dest(config.paths.build));

});
gulp.task('build',['minifyCss','minifyJs','htmls','images','fonts','other'],function () {
    var vendorFiles=gulp.src([
        config.paths.build+'/style/vendor.min.css',
        config.paths.build+'/scripts/vendor.min.js',
    ],{read:false});
    var appFiles=gulp.src([
        config.paths.build+'/style/app.min.css',
        config.paths.build+'/scripts/app.min.js',
    ],{read:false});
    var templateFiles=gulp.src([
        config.paths.build+'/scripts/template.min.js',
    ],{read:false});
    return gulp.src(config.paths.src+'/index.html')
        .pipe(inject(vendorFiles,{name:'vendor',ignorePath:'build',addRootSlash: false}))
        .pipe(inject(appFiles,{name:'app',ignorePath:'build',addRootSlash: false}))
        .pipe(inject(templateFiles,{name:'template',ignorePath:'build',addRootSlash: false}))
        .pipe(gulp.dest(config.paths.build));
});