// assets.js
// --------------------
//
// Manage bundling/inclusion/compilation of assets
// Includes support for CSS, LESS, js, & CoffeeScript

var fs = require('fs');
var async = require('async');
var rack = require('asset-rack');
var pathutil = require('path');
var isProduction = sails.config.environment === 'production';


var CoffeescriptAsset = rack.Asset.extend({    
    mimetype = 'text/javascript';
    create: function() {
      var coffee = require('coffee-script');
      this.contents = coffee.compile(fs.readFileSync(this.filename, 'utf8');
      this.emit('created');
    }    
});


var TypescriptAsset = rack.Asset.extend({    
    mimetype = 'text/javascript';
    create: function() {
      var tsc = require('node-typescript');
      this.contents = tsc.compile(fs.readFileSync(this.filename, 'utf8');
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
                filename: sails.config.appPath + '/assets/js/app.coffee',
                compress: isProduction
            });
        break;

        case 'coffeescript':
            asset = new rack.CoffeescriptAsset({
                url: '/app.js',
                filename: sails.config.appPath + '/assets/js/app.coffee'
            });
        break;

        case 'typescript':
            asset = new rack.TypescriptAsset({
                url: '/app.js',
                filename: sails.config.appPath + '/assets/js/app.ts'
            });
        break;

        default:
          // Aggregate scripts
          var contents = '';
          fs.readdirSync(sails.config.appPath + '/assets/js').forEach(function (file) {
              if (/\.js/.test(file)) {
                  contents += fs.readFileSync(sails.config.appPath + '/assets/js/' + file);
              }
          });
          asset = new rack.Rack({
              url: '/app.js',
              contents: contents
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

        default:
            // Aggregate stylesheets
            var contents = '';
            fs.readdirSync(sails.config.appPath + '/assets/styles').forEach(function (file) {
              if (/\.css/.test(file)) {
                  contents += fs.readFileSync(sails.config.appPath + '/assets/styles/' + file);
              }
            });
            asset = new rack.Rack({
                url: '/style.css',
                contents: contents
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
              if (/\.html|\.tmpl|\.tpl|\.ejs/.test(file)) {
                  contents += fs.readFileSync(sails.config.appPath + '/assets/styles/' + file);
              }
            });
            var contents += '\n</div>';
            asset = new rack.Rack({
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

