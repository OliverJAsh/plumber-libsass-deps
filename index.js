var plumber = require('plumber');
var operation = plumber.operation;
var Report = plumber.Report;
var Rx = plumber.Rx;

var extend = require('extend');
var sass = require('node-sass');
var path = require('path');

module.exports = function (options) {
    options = options || {};

    return operation(function (resources) {
        return resources.flatMap (function(resource) {
            // TODO: map extra options (filename, paths, etc)?
            var compiledCss = resource.withType('css');

            return Rx.Observable.create(function(observer) {
                var resourcePath = resource.path();
                var stats = {};
                try {
                    var data = sass.renderSync(extend({}, options, {
                        data: resource.data(),
                        includePaths: resourcePath && [path.dirname(resourcePath.absolute())],
                        stats: stats
                    }));
                    observer.onNext(data);
                    observer.onCompleted();
                } catch (error) {
                    observer.onError(error);
                }
            }).map(function(out) {
                return compiledCss.withData(out);
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
