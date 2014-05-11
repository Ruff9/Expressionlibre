/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

var fs, when, nodefn, promised, slice, whitelist;

fs = require('fs');
when = require('when');
nodefn = require('when/node/function');
slice = Array.prototype.slice.call.bind(Array.prototype.slice);

whitelist = [
	'appendFile',
	'chmod',
	'chown',
	'close',
	'exists',
	'fchmod',
	'fchown',
	'fdatasync',
	'fstat',
	'fsync',
	'ftruncate',
	'futimes',
	'lchmod',
	'lchown',
	'link',
	'lstat',
	'mkdir',
	'open',
	'read',
	'readFile',
	'readdir',
	'readlink',
	'realpath',
	'rename',
	'rmdir',
	'stat',
	'symlink',
	'truncate',
	'unlink',
	'utimes',
	'write',
	'writeFile'
];

module.exports = promised = {};

function promisify(method) {
	return function () {
		var args, callback, promise;
		args = slice(arguments);
		if (typeof args[args.length - 1] === 'function') {
			callback = args.pop();
			promise = nodefn.apply(method, args);
			// should the returned promise be chained from the callback?
			promise.then(function (value) { return callback(null, value); }, callback);
		}
		else {
			promise = nodefn.apply(method, args);
		}
		return promise;
	};
}

function eligible(name, obj) {
	return typeof obj === 'function' && whitelist.indexOf(name) >= 0;
}

Object.keys(fs).forEach(function (name) {
	promised[name] = eligible(name, fs[name]) ? promisify(fs[name]) : fs[name];
});

