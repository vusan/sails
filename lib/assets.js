// assets.js
// --------------------
//
// Manage bundling/inclusion/compilation of assets
// Includes support for CSS, LESS, js, & CoffeeScript

var async = require('async');
var rack = require('asset-rack');
var pathutil = require('path');
var isProduction = sails.config.environment === 'production';


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
    }
    
    return asset;

}());


var stylesAsset = (function () {
  
    var asset;
    
    switch (sails.config.assets.cssEngine) {
        case 'stylus':
            asset = new rack.StylusAsset({
                url: '/style.css',
                filename: sails.config.appPath + '/assets/styles/app.styl',
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

