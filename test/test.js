var chai = require('chai');
chai.should();

var fs = require('fs');

var runOperation = require('plumber-util-test').runOperation;
var completeWithResources = require('plumber-util-test').completeWithResources;
var runAndCompleteWith = require('plumber-util-test').runAndCompleteWith;

var Resource = require('plumber').Resource;
var Report = require('plumber').Report;

var sass = require('..');

function createResource(params) {
    return new Resource(params);
}

function resourcesError() {
  chai.assert(false, "error in resources observable");
}


describe('sass', function () {

    it('should be a function', function(){
        sass.should.be.a('function');
    });

    it('should return a function', function(){
        sass().should.be.a('function');
    });

    describe('when passed a SCSS file', function() {
        var transformedResources;
        var mainData = fs.readFileSync('test/fixtures/main.scss').toString();

        beforeEach(function() {
            transformedResources = runOperation(sass(), [
                createResource({path: 'test/fixtures/main.scss', type: 'scss', data: mainData})
            ]).resources;
        });

        it('should return a single resource with a CSS filename', function(done){
            completeWithResources(transformedResources, function(resources) {
                resources.length.should.equal(1);
                resources[0].filename().should.equal('main.css');
            }, resourcesError, done);
        });

        it('should return a resource with CSS data', function(done){
            var outputMain = fs.readFileSync('test/fixtures/output-main.css').toString();
            completeWithResources(transformedResources, function(resources) {
                resources[0].data().should.equal(outputMain);
            }, resourcesError, done);
        });
    });
});
