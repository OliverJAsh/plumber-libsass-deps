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

        it('should return the input SCSS resource with dependencies', function(done){
            completeWithResources(transformedResources, function(resources) {
                resources.length.should.equal(3);
                resources[0].filename().should.equal('main.scss');
                resources[1].filename().should.equal('other.scss');
                resources[2].filename().should.equal('helper.scss');
            }, resourcesError, done);
        });

        it('should return data for the input SCSS resource with dependencies', function(done){
            completeWithResources(transformedResources, function(resources) {
                resources[0].data().should.equal(fs.readFileSync('test/fixtures/main.scss').toString());
                resources[1].data().should.equal(fs.readFileSync('test/fixtures/other.scss').toString());
                resources[2].data().should.equal(fs.readFileSync('test/fixtures/sub/helper.scss').toString());
            }, resourcesError, done);
        });
    });
});
