var path = require('path');
var Filer = require('./filer');
var Docktainer = require('./../../docktainer');
var bare = require('bareutil');
var val = bare.val;
var misc = bare.misc;

var Coder = function(repository, executeInfo, root, mode) {
	this.container = null;
	this.filer = null;

	this.executeInfo = executeInfo;
	this.repository = repository;
	this.root = root || 'tmp';
	this.mode = mode || 0644;
	this.idlength = 8;
};

Coder.prototype.run = function(project) {
	var platformInfo = this.executeInfo[project.platform];
	if(val.undefined(platformInfo)) {
		throw new Error('Unrecognized platform');
	}
	
    var desc = platformInfo[project.tag];
    if(val.undefined(desc)) {
        desc = platformInfo['latest'];
    }

	var self = this;
	return this.write(project).then(function() {
        if(desc.compile !== '') {
            return self.execute(project, desc.compile);
        }
    }).then(function(result) {
		if(result){
			//TODO: Ugly hack for pascal that needs to be fixed
			if( (result.stderr !== '' && result.stderr.indexOf('/usr/bin/ld: warning: ') === -1) ||
				result.stdout.indexOf('Fatal:') !== -1) {
					result.error = 'Error encountered while compiling';
					return result;
			}
		}

        return self.execute(project, desc.run);
    });
};

Coder.prototype.execute = function(project, innerCMD) {
    var directory = this.directory(project.id);
	var name = misc.supplant('$0/$1', [this.repository, project.platform]);
	var volume = misc.supplant('$0:$1', [directory, '/scripts']);

	var command = new Docktainer.Command(name, project.tag, innerCMD, {
		name:project.id,
		rm:true,
		volume:volume,
		workdir:'/scripts'
	});

	var cmd = command.build('run');
	var container = new Docktainer.Container(cmd);
	return container.exec();
};

Coder.prototype.directory = function(relative) {
    var dir = path.resolve(this.root, relative);
    return dir;
};

Coder.prototype.write = function(project) {
	var dir = this.directory(project.id);
	this.filer = new Filer(dir, this.mode);
	return this.filer.create(project.documents);
};

Coder.prototype.cleanup = function() {
    this.filer.cleanup();
};

module.exports = Coder;
