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
                return Rx.Observable.return(resource.withType('scss'))
                    .concat(globResources(stats.includedFiles));
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

// FIXME: do we really need the supervisor then?
var Supervisor = plumber.Supervisor;
var supervisor = new Supervisor();
// TODO: glob here, though how to make Resource from data?
var glob = supervisor.glob.bind(supervisor);

// TOOD: Abstract
function globResources(paths) {
    return Rx.Observable.fromArray(paths).
        map(glob).
        mergeAll();
}
