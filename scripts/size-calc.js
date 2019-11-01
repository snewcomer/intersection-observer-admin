var gzipSize = require('gzip-size');
var fs = require('fs');
var prettyBytes = require('pretty-bytes');

var contents = fs.readFileSync('./dist/intersection-observer-admin.es5.js');
var kb = prettyBytes(gzipSize.sync(contents));
var msg = 'intersection-observer-admin.js is ' + kb + ' gzipped.';

fs.writeFileSync('./size.txt', msg);

console.log(msg);
