/*
* //Configuration
* requirejs.config({
*   baseUrl: "file:///C:/Users/Home/Desktop/",
*   paths: {
*     console": "rj-modules/console/1.0"
*   }
* })
* //requirejs is requirejs function to get deps. module is an object: module.uri & module.id
* define("path/module-name", function(requirejs, module){    //It should return something (const, variable, fuunc, obj); Empty output causes multi-load!
*   return 1;
* });
*
* requirejs(["path/module-name"], function(mName){
*   alert(mName)
* });
*
*/



(function() {

var global = (function() {
    return this;
})();

if (typeof requirejs !== "undefined")
    return;

var _define = function(module, deps, payload) {
    if (typeof module !== 'string') {
        if (_define.original)
            _define.original.apply(window, arguments);
        else {
            console.error('dropping module because define wasn\'t a string.');
            console.trace();
        }
        return;
    }

    if (arguments.length == 2)
        payload = deps;

    if (!define.modules)
        define.modules = {};

    define.modules[module] = payload;
};
if (global.define)
    _define.original = global.define;

global.define = _define;
define.modules = {};

/**
 * Get at functionality define()ed using the function above
 */
var _requirejs = function(module, callback) {
    if (Object.prototype.toString.call(module) === "[object Array]") {
        var params = [];
        for (var i = 0, l = module.length; i < l; ++i) {
            var dep = lookup(module[i]);
            if (!dep && _requirejs.original)
                return _requirejs.original.apply(window, arguments);
            params.push(dep);
        }
        if (callback) {
            callback.apply(null, params);
        }
    }
    else if (typeof module === 'string') {
        var payload = lookup(module);
        if (!payload && _requirejs.original)
            return _requirejs.original.apply(window, arguments);

        if (callback) {
            callback();
        }

        return payload;
    }
    else {
        if (_requirejs.original)
            return _requirejs.original.apply(window, arguments);
    }
};
_requirejs.packaged = true;

if (global.requirejs)
    _requirejs.original = global.requirejs;

global.requirejs = _requirejs;

var baseUrl = "";
var paths = {};

var _config = function (configs) {
    if (configs.baseUrl)
        baseUrl = configs.baseUrl;
    if (configs.paths)
        paths = configs.paths;
};
requirejs.config = _config;

/**
 * Internal function to lookup moduleNames and resolve them by calling the
 * definition function if needed.
 */

var lookup = function(moduleName, render) {
    var module = define.modules[moduleName];
    if (module == null) {
        //Find real path
        var moduleNames = moduleName.split("/");
        moduleNames.forEach(function(item, index, arr){
            if (paths[item])
                arr[index] = paths[item];
        });
        var realName = baseUrl + moduleNames.join("/") + ".js";
        //Load the script
        Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Components.interfaces.mozIJSSubScriptLoader)
            .loadSubScript(realName);

        return lookup(moduleName, true);
    }

    if (render && typeof module === 'function') {
        var exports = module(requirejs, { id: moduleName, uri: realName });

        //qfnServices.jsDump.logStringMessage("QuickFox Notes [mini-require]: \"" + moduleName + "\" has been loaded successfully!");
        // cache the resulting module object for next run
        define.modules[moduleName] = exports;
        return exports;
    }

    return module;
};

})();
