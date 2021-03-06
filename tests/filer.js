var tape = require('tape'),
	Filer = require('./../scripts/filer.js'),
	fs = require('fs'),
	Promise = require('bluebird');

tape('create', function(t) {
	var filer = new Filer('tmp/filer', 0740);
	filer.create([{
			id:'test',
			extension:'php',
			content:'Hello World'
		}, {
			id:'foo',
			extension:'php',
			content:'bar'
	}]).then(function() {
		var a = new Promise(function(resolve, reject) {
			fs.stat('tmp/filer/test.php', function(err, stats) {
				if(err) return reject(err);
				if(stats.isFile() !== true) return reject('test is not a file');

				return resolve();
			});
		});

		var b = new Promise(function(resolve, reject) {
			fs.stat('tmp/filer/foo.php', function(err, stats) {
				if(err) return reject(err);
				if(stats.isFile() !== true) return reject('foo is not a file');

				return resolve();
			});
		});

		return Promise.all([a, b]);
	}).then(function() {
		t.pass('All files were created correctly');
		return filer.cleanup();
	}).then(function() {
		return new Promise(function(resolve, reject) {
			fs.stat('tmp/filer', function(err, stats) {
				if(err.code === 'ENOENT') return resolve();
				return reject('tmp directory still exists');
			});
		});
	}).then(function() {
		t.pass('Everything was cleaned up');
	}).catch(function(err) {
		console.log(err);
		t.fail('Error encountered');
	}).done(t.end);
});
