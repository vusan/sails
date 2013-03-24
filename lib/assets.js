// assets.js
// --------------------
//
// Manage bundling/inclusion/compilation of assets
// Includes support for: 
//    LESS, Stylus, SASS & aggregated CSS
//    Coffeescript, Typescript, Javascript (browserify, snockets & vanilla)
//    Jade templates, aggregated html/tmpl/ejs

var fs = require('fs');
var async = require('async');
var rack = require('asset-rack');
var pathutil = require('path');
var isProduction = sails.config.environment === 'production';


var SASSAsset = rack.Asset.extend({    
    mimetype: 'text/css',
    create: function(options) {
      var sass = require('node-sass');
      var self = this;
      this.filename = options.filename;
      sass.render(fs.readFileSync(options.filename, 'utf8'), function (err, css) {
          if (err) throw err;
          self.contents = css;
      });
      if (options.compress) {
        var cleancss = require('cleancss');
        this.contents = cleancss.process(this.contents);
      }
      this.emit('created');
    }    
});


var CSSAsset = rack.Asset.extend({
    mimetype: 'text/css',
    create: function(options) {
        var self = this;
        this.dirname = options.dirname
        this.files = fs.readdirSync(this.dirname).filter(function (file) {
            return /\.css/.test(file);
        });
        this.contents = '';
        this.files.forEach(function (file) {
            self.contents += fs.readFileSync(self.dirname + '/' + file);
        });
        if (options.compress) {
          var cleancss = require('cleancss');
          this.contents = cleancss.process(this.contents);
        }
        this.emit('created');
    }
})


var JSAsset = rack.Asset.extend({
    mimetype: 'text/javascript',
    create: function(options) {
        var self = this;
        this.dirname = options.dirname
        this.files = fs.readdirSync(this.dirname).filter(function (file) {
            return /\.js/.test(file);
        });
        this.contents = '';
        this.files.forEach(function (file) {
            self.contents += fs.readFileSync(self.dirname + '/' + file);
        });
        if (options.compress) {
          var uglify = require('uglify-js');
          this.contents = uglifyjs.minify(this.contents, { fromString: true }).code;
        }
        this.emit('created');
    }
})


var CoffeescriptAsset = rack.Asset.extend({    
    mimetype: 'text/javascript',
    create: function(options) {
      var coffee = require('coffee-script');
      this.filename = options.filename;
      this.contents = coffee.compile(fs.readFileSync(options.filename, 'utf8'))
      this.emit('created');
    }    
});


var TypescriptAsset = rack.Asset.extend({    
    mimetype: 'text/javascript',
    create: function(options) {
      var tsc = require('node-typescript');
      this.filename = options.filename;
      this.contents = tsc.compile(options.filename, fs.readFileSync(options.filename, 'utf8'))
      this.emit('created');
    }    
});


var jsAsset = (function () {

    var asset;

    switch (sails.config.assets.jsEngine) {
        case 'browserify':
            asset = new rack.BrowserifyAsset({
                url: '/app.js',
                filename: sails.config.appPath + '/assets/js/app.js',
                compress: isProduction
            });
        break;

        case 'snockets':
            asset = new rack.SnocketsAsset({
                url: '/app.js',
                filename: sails.config.appPath + '/assets/js/app.js',
                compress: isProduction
            });
        break;

        case 'coffeescript':
            asset = new CoffeescriptAsset({
                url: '/app.js',
                filename: sails.config.appPath + '/assets/js/app.coffee'
            });
        break;

        case 'typescript':
            asset = new TypescriptAsset({
                url: '/app.js',
                filename: sails.config.appPath + '/assets/js/app.ts'
            });
        break;

        case 'vanilla':
        default:
          asset = new JSAsset({
              url: '/app.js',
              dirname: sails.config.appPath + '/assets/js',
              compress: isProduction
          });
        break;
    }
    
    return asset;

}());


var stylesAsset = (function () {
  
    var asset;
    
    switch (sails.config.assets.cssEngine) {
        case 'less':
            asset = new rack.LessAsset({
                url: '/style.css',
                filename: sails.config.appPath + '/assets/styles/app.less',
                compress: isProduction
            });
        break;

        case 'stylus':
            asset = new rack.StylusAsset({
                url: '/style.css',
                filename: sails.config.appPath + '/assets/styles/app.styl',
                compress: isProduction
            });
        break;

        case 'sass':
            asset = new SASSAsset({
                url: '/style.css',
                filename: sails.config.appPath + '/assets/styles/app.sass',
                compress: isProduction
            });
        break;
        
        case 'vanilla':
        default:
            asset = new CSSAsset({
                url: '/style.css',
                dirname: sails.config.appPath + '/assets/styles',
                compress: isProduction
            });
        break;
    }

    return asset;

}());


var templatesAsset = (function () {
    
    var asset;

    switch (sails.config.assets.tplEngine) {
        case 'jade':
            asset = new rack.JadeAsset({
                url: '/templates.js',
                dirname: sails.config.appPath + '/assets/templates',
                compress: isProduction
            });
        break;

        default:
            // Aggregate markup
            var contents = '<div style="display: none;" id="rigging-template-library">\n';
            fs.readdirSync(sails.config.appPath + '/assets/styles').forEach(function (file) {
                if (/\.html|\.tmpl|\.ejs/.test(file)) {
                    contents += fs.readFileSync(sails.config.appPath + '/assets/styles/' + file);
                }
            });
            contents += '\n</div>';
            asset = new rack.Asset({
                contents: contents
            });
        break;
    }

    return asset;

}());


var Rack = rack.Rack.extend({
    js: function() {
        return this.tag('/app.js');
    },
    css: function() {
        return this.tag('/style.css');
    },
    templateLibrary: function() {
        return this.tag('/templates.js');
    }
});


exports.createAssets = function() {
    return new Rack([
        jsAsset,
        stylesAsset,
        templatesAsset
    ]);
};

