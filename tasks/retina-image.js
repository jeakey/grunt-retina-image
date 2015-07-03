/*
 * grunt-retina-image
 * https://github.com/jeakey/grunt-retina-image
 *
 * Copyright (c) 2015 Joram jeakey
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
	var async = require('async'),
		images = require('images'),
		path = require('path'),
		_ = require('lodash'),
		os = require('os'),
		numCPUs = os.cpus().length,
		r_percentage = /([0-9]+)%$/, // Percentage matching.
		r_width = /w([0-9]+)/, // Width matching.
		r_height = /h([0-9]+)/; // Height matching.

	/**
	 * Process the size, return object of new size.
	 * Currently only test percentages.
	 */
	function processSize(targetSize, origSize) {
		var match = (targetSize.match(r_percentage) || [])[1];
		
		if (match /= 100) {
			return {
				width: origSize.width * match,
				height: origSize.height * match
			};
		} else {
			return {
				width: (targetSize.match(r_width) || [])[1] || 0,
				height: (targetSize.match(r_height) || [])[1] || 0
			};
		}
	}

	/**
	 * In order to do async.each we have to iterate over an array
	 * Turn the sizes-object into an array of objects.
	 * @param  {Object} sizes
	 * @return {Object}
	 */
	function convertSizes(sizes) {
		var tmp = [];
		for (var size in sizes) {
			tmp.push({
				size: size,
				settings: _.extend({suffix: '', prefix: ''}, sizes[size])
			});
		}
		return tmp;
	}

	/**
	 * Create simple callback function that will
	 * call callback if no errors are given
	 * @param  {Function} callback
	 * @return {Function}
	 */
	function whenReady(callback) {
		return function(err) {
			if (err) {
				throw err;
			}
			callback();
		};
	}

	
	function format(string, values) {
		return string.replace(/\{(\d+)\}/g, function(match, number) {
			return values[number];
		});
	}

	grunt.registerMultiTask('retina_image', 'Take the 2x images and generate retina and regular versions', function() {
		var done = this.async(),
			options = this.options({
				sizes: {}
			}),
			start = Date.now();

		// Convert sizes to something more readable.
		options.sizes = convertSizes(options.sizes);
		
		this.files.forEach(function(f) {
			
			var extName = path.extname(f.dest),
				srcPath = f.src[0],
				dirName = path.dirname(f.dest),
				baseName = path.basename(srcPath, extName); // filename without extension
			
			if(baseName.indexOf("@")<0){
				var img=images(srcPath);
				var srcImageSize=img.size();

				
				async.eachSeries(options.sizes, function(size, callback) {
					var dstPath = dirName + "/",
						prefix  = size.settings.prefix,
						filename = baseName + "@" + size.settings.suffix + extName,
						destImageSize = processSize(size.size, srcImageSize);

					// Is the prefix a dir prefix?
					if (prefix.charAt(prefix.length - 1) === '/') {
						dstPath += prefix;
					} else {
						filename = prefix + filename;
					}

					// Make directory if it doesn't exist.
					if (!grunt.file.isDir(dstPath)) {
						grunt.file.mkdir(dstPath);
					}
					
					img.size(destImageSize.width,destImageSize.height).save(dstPath + filename);
					grunt.log.writeLn("generate image : " + dstPath + filename);
					callback();

				});
			}
			
		})

		
	});

};