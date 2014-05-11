/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

var fs = require('..'),
	buster = require('buster'),
	path = require('path'),
    assert, refute, fail, goodFile, badFile;

assert = buster.assertions.assert;
refute = buster.assertions.refute;
fail = buster.assertions.fail;

goodFile = path.join('test', 'buster.js');
badFile = path.join('test', 'foobar.txt');

buster.testCase('fs-then.readFile()', {
	'given a invocation with a callback': {
		'it should fire the callback with a value for a good file': function (done) {
			var promise = fs.readFile(goodFile, function (err, value) {
				assert(value);
				refute(err);
				done();
			});
			assert.isFunction(promise.then);
		},
		'it should fire the callback with an error for a bad file': function (done) {
			var promise = fs.readFile(badFile, function (err, value) {
				refute(value);
				assert(err);
				done();
			});
			assert.isFunction(promise.then);
		}
	},
	'given a invocation without a callback': {
		'it should resolve the returned promise with a value for a good file': function () {
			return fs.readFile(goodFile).then(
				function (value) {
					assert(value);
				},
				fail
			);
		},
		'it should reject the returned promise with an error for a bad file': function () {
			return fs.readFile(badFile).then(
				fail,
				function (err) {
					assert(err);
				}
			);
		}
	}
});
