var plumber = require('plumber');
var operation = plumber.operation;
var Report = plumber.Report;
var Rx = plumber.Rx;

var fs = require('fs');
var extend = require('extend');
var sass = require('node-sass');
var path = require('path');

module.exports = function (options) {
    options = options || {};

    return operation(function (resources) {
        return resources.flatMap(function(resource) {
            return Rx.Observable.create(function(observer) {
                var resourcePath = resource.path();
                var stats = {};
                try {
                    // We don't care about the output for the purposes of this task.
                    sass.renderSync(extend({}, options, {
                        data: resource.data(),
                        includePaths: resourcePath && [path.dirname(resourcePath.absolute())],
                        // node-sass mutates this object. Not pretty!
                        stats: stats
                    }));
                    observer.onNext(stats);
                    observer.onCompleted();
                } catch (error) {
                    observer.onError(error);
                }
            }).flatMap(function (stats) {
                var depResources = stats.includedFiles.map(function (relativePath) {
                    var absolutePath = path.join(__dirname, relativePath);
                    return new plumber.Resource({
                        path: absolutePath,
                        type: 'scss',
                        rawData: fs.readFileSync(absolutePath)
                    });
                });
                return Rx.Observable.fromArray([resource.withType('scss')].concat(depResources));
            }).catch(function(error) {
                // TODO: Get more error info from node-sass somehow. Parse error
                // error: String
                // Catch and map Sass error
                var errorReport = new Report({
                    resource: resource,
                    type: 'error', // FIXME: ?
                    success: false,
                    errors: [{
                        message: error
                    }]
                });
                return Rx.Observable.return(errorReport);
            });
        });
    });
};
