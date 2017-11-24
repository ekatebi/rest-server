'use strict';

// import app from '../../app';
var views = require('co-views');
var parse = require('co-body');
var monk = require('monk');
var wrap = require('co-monk');
var db = monk('localhost/library');
var co = require('co');

var fs = require('fs'),
    xml2js = require('xml2js'),
    path = require("path");

var epgPath = "/../../../../app/src/images/epg/";

const xmlFiles = (epgDir) => {

	return new Promise((resolve, reject) => {

		console.log('epg load from folder:', epgDir);

		fs.readdir(epgDir, (err, files) => {

	    if (err) {
				reject(err);
	    }

			const xmlfiles = [];
	
	    files
	    .map(function (file) {
	      return path.join(epgDir, file);
	    })
	    .filter(function (file) {
	      return fs.statSync(file).isFile();
	    })
	    .sort((a, b) => {
	      
	      if (fs.statSync(a).birthtimeMs < fs.statSync(b).birthtimeMs) {
	        return 1;
	      }
	      
	      if (fs.statSync(a).birthtimeMs > fs.statSync(b).birthtimeMs) {
	        return -1;
	      }

	      // names must be equal
	      return 0;
	    })    
	    .forEach(function (file, index) {
	      console.log("%s [%d] (%s) %d", file, index, path.extname(file), fs.statSync(file).birthtimeMs);
	      xmlfiles.push(file);
	    });

	    resolve(xmlfiles);
		});

	});
};

const parserXml = (filePath) => {

	return new Promise((resolve, reject) => {

		var parser = new xml2js.Parser();

//		console.log('filePath:', filePath);

		fs.readFile(filePath, function(err, data) {
			if (err) {
				reject(err);
			} else {
		    parser.parseString(data, function (err, result) {
		    	if (err) {
		    		reject(err);
		    	} else {
		    		console.log('xml parsed:', filePath);
		    		resolve(result);
					}
		    });
		  }
		});
	});
};

// module.exports.load = async () => {
const load = async () => {

	global.epgXmlFiles = await xmlFiles(path.join(__dirname, epgPath));

//	console.log('xmlfiles', global.epgXmlFiles);

//	let file = 'xmltv2634.xml';
//	let filePath = path.join(__dirname, epgPath, file);

	if (!global.epgData) {
		global.epgData = await parserXml(global.epgXmlFiles[0]);
	}

	return global.epgData;
};

co(async () => {

	console.log('env', process.env.NODE_ENV);

	if (process.env.NODE_ENV === 'no-epg')
		return;

	await load();

	const p = path.join(__dirname, epgPath);

	fs.watch(p, (eventType, filename) => {

	  console.log(`event type is: ${eventType}`);

	  if (filename) {
	    console.log(`filename provided: ${filename}`);
	  } else {
	    console.log('filename not provided');
	  }

		load();
	});
});

module.exports.fileInfo = async (ctx) => {
  var xmlfiles = await global.epgXmlFiles;

	var xmlfileInfos = xmlfiles.map((file) => {
		return { file, ...fs.statSync(file) };
	});

  ctx.body = xmlfileInfos;
};
