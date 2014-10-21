var plumber = require('plumber');
var Rx = plumber.Rx;

var extend = require('extend');
var sass = require('node-sass');
var path = require('path');

module.exports = function (options) {
    options = options || {};

    // TODO: Remove
    var globalCounter = 0;

    return function foo(executions) {
        globalCounter++;
        var counter = globalCounter;
        console.log(counter, 'start');

        var currentExecution = executions.take(1);
        var nextExecutions   = executions.skip(1);

        return currentExecution.flatMap(function (resources) {
            console.log(counter, 'resources');
            return resources.flatMap(function (resource) {
                console.log(counter, 'resource');
                var currentDeps = Rx.Observable.create(function(observer) {
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
                }).map(function (stats) {
                    return stats.includedFiles;
                });

                var changes = currentDeps
                    .flatMap(gazeObservable)
                    .flatMap(function (x) {
                        console.log(counter, 'map dep(s) to executions', x, counter);
                        // return executions;
                        // FIXME: Why can't we re-use the existing executions
                        // observable? The data has already been emitted?
                        // Re-create for now
                        var newExecution = Rx.Observable.return(Rx.Observable.return(resource));
                        return newExecution;
                    })
                    .share();

                var next = Rx.Observable.amb(nextExecutions, changes);

                console.log(counter, 'pre-recurse');
                var x = Rx.Observable.return(Rx.Observable.return(resource))
                    .concat(Rx.Observable.defer(function () {
                        console.log(counter, 'recurse');
                        // return foo(changes);
                        return foo(next);
                    }));

                return x;
            });
        });

        // Returns an Observable of events for the gazed patterns
        function gazeObservable(patterns) {
            return Rx.Observable.defer(function() {
                // TODO: Why is this event leaking?
                console.log(counter, 'init gaze', patterns);
                var gazer = new Gaze(patterns);
                return Rx.Observable.fromEvent(gazer, 'all', function (x) {
                    return x[1];
                });
            })
            // FIXME: Without this, the recursion has no end. Why?
            .delay(1)
            .map(function (x) {
                // TODO: Why is this event leaking?
                console.log(counter, 'gaze event', x);
                return x;
            });
        }

        function inspectObservable(observable, fn) {
            var subscription = observable.subscribe(function () {
                fn.apply(null, arguments);
                subscription.dispose();
            });
        }

    };
};


var Gaze = require('gaze').Gaze;
var testGazer = new Gaze('/Users/Oliver/Development/plumber-libsass-deps/test/fixtures/other.scss');

testGazer.on('all', console.log.bind(console, 'testGazer'));
