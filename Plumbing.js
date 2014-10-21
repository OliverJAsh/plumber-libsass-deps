var glob = require('plumber-glob');
var libsassDeps = require('./index');
var plumber = require('plumber');

exports = module.exports = function function_name (pipelines) {
    pipelines['default'] = [
        glob('test/fixtures/main.scss'),
        libsassDeps(),
        plumber.operation.map(function (resource) {
            console.log('done', resource.path());
        })
    ];
};
