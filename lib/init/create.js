'use strict';

var fs = require('fs-extra');
var https = require('https');
var path = require('path');
var chalk = require('chalk');
var tar = require('tar');
var zlib = require('zlib');
var os = require('os');

/**
 *
 */
var initProject = function(options, callback) {
    var tempDir = os.tmpdir();

    var tempZipPath = path.join(tempDir, Date.now().toString() + '.tar.gz');
    var tempPath = path.join(tempDir, Date.now().toString());

	if (typeof options === 'string') {
        var name = options;
        var dirPath = path.join(process.cwd(), name);
        
        try {
            var stats = fs.lstatSync(dirPath);
            console.log(chalk.bold.red('Directory name already exists.'));
            process.exit(1);
        }
        catch (e) {
            downloadSeed(tempZipPath, function() {
                extract(tempZipPath, tempPath, function(){
                    fs.copy(path.join(tempPath, 'mixed-mode-seed'), dirPath, function (err) {
                        if (err) return console.error(err);
                        if (typeof callback === 'function') {
                            return callback(null);
                        }
                    });
                });
            });
        }
    } else {
        fs.readdir(process.cwd(), function (err, items) {
            if (err) {
                return cb(true);
            }
            if (!items || !items.length) {
                downloadSeed(tempZipPath, function() {
                    extract(tempZipPath, tempPath, function() {
                        fs.copy(path.join(tempPath, 'mixed-mode-seed'), process.cwd(), function(err) {
                            if (err) return console.error(err);
                            if (typeof callback === 'function') {
                                return callback(null);
                            }
                        })
                    });
                });
            } else {
                console.log(chalk.bold.red('Current directory is non empty.'));
                process.exit(1);
            }
        });

    }

    
};

function downloadSeed(dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = https.get('https://s3-us-west-2.amazonaws.com/code.famo.us/cli/mixed-mode-seed.tar.gz', function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
        });
    });
}

function extract(source, dest, cb) {
    fs.createReadStream(source)
        .pipe(zlib.createGunzip())
        .pipe(tar.Extract({ path: dest}))
        .on('error', function(error) { cb(error)})
        .on("end", function() { cb(null)})
}

/** **/
module.exports = initProject;

