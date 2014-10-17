plumber-libsass [![Build Status](https://travis-ci.org/plumberjs/plumber-libsass.png?branch=master)](https://travis-ci.org/plumberjs/plumber-libsass)
============

[Sass](http://sass-lang.com/) compilation operation for [Plumber](https://github.com/plumberjs/plumber) pipelines.

## Example

    var sass = require('plumber-libsass');

    module.exports = function(pipelines) {

        pipelines['css'] = [
            glob('main.sass'),
            sass(),
            // ... more pipeline operations
        ];

        pipelines['icons'] = [
            glob('icons.sass'),
            sass({precision: 5}),
            // ... more pipeline operations
        ];

    };


## API

### `sass(sassOptions)`

Compile each input Sass resource to a single CSS resource.

Optionally, [options](https://github.com/sass/node-sass#options) can be passed to the Sass compiler via the `sassOptions` parameter.

Note that you may **not** specify minimisation configuration options, such as `compress` or `cleancss`; this should be done using the [plumber-mincss](https://github.com/plumberjs/plumber-mincss) operation instead, to ensure atomicity of operations.
