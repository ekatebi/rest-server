'use strict';

require("babel-core/register");
require("babel-polyfill");

var fs = require('fs');
// var compress = require('koa-compress');
var logger = require('koa-logger');
var serve = require('koa-static');
var route = require('koa-route');
var koa = require('koa');
var cors = require('koa-cors');
var path = require('path');
var app = new koa();
var app2 = new koa();
const koaBody = require('koa-body');
// const koaBody = require('koa-bodyparser');
var jwt = require('koa-jwt');
const http = require('http');
const https = require('https');

import { privateKey } from './constants';
import * as secRoutes from './routes/security';
import * as epgRoutes from './routes/epg';
import * as pubsubRoutes from './routes/pubsub';

const secPort = !process.env['SEC_PORT'] ? 8080 : Number(process.env['SEC_PORT']);

global.epgData = undefined;

app.use(cors());

// Logger
if (process.env['LOGGER'] === 'true') {
	console.log('http logger on:', process.env['LOGGER']);
	app.use(logger());
} else {
	console.log('http logger off:', process.env['LOGGER']);	
}

app.on('error', (err, ctx) => {
 	console.error('app error', err, ctx)
});

app.use(koaBody());

app.use(jwt({ secret: privateKey, passthrough: true, key: 'jwtdata' }));

/*
app.use(epgRoutes.epgRoutes.routes());
app.use(epgRoutes.chansRoutes.routes());
app.use(epgRoutes.progsRoutes.routes());
*/

app.use(secRoutes.authRoutes.routes());
app.use(secRoutes.usersRoutes.routes());
app.use(secRoutes.rolesRoutes.routes());

app.use(pubsubRoutes.pubRoutes.routes());
app.use(pubsubRoutes.subRoutes.routes());

// Serve static files
// app.use(serve(path.join(__dirname, 'public')));
// app.use(compress());

if (process.env['HTTPS'] === 'true') {

	app2.use(cors());

	// RoutesLogger
	if (process.env['LOGGER'] === 'true') {
		console.log('https logger on:', process.env['LOGGER']);
		app2.use(logger());
	} else {
		console.log('https logger off:', process.env['LOGGER']);	
	}

	app2.on('error', (err, ctx) => {
	 	console.error('app2 error', err, ctx)
	});

	app2.use(koaBody());

	app2.use(jwt({ secret: privateKey, passthrough: true, key: 'jwtdata' }));

	app2.use(secRoutes.authRoutes.routes());
}

var config = {
  domain: 'localhost',
  http: {
    port: secPort
  },
  https: {
    port: secPort + 1,
    options: {
      key: fs.readFileSync(path.resolve(process.cwd(), './key.pem'), 'utf8').toString(),
      cert: fs.readFileSync(path.resolve(process.cwd(), './cert.pem'), 'utf8').toString(),
    },
  },
};

if (!module.parent) {
	try {
	  http.createServer(app.callback()).listen(config.http.port, (err) => {
			if (!!err) {
		    console.error('HTTP server FAIL: ', err, (err && err.stack));
		  } else {
		    console.log(`HTTP server OK: http://${config.domain}:${config.http.port}`);
		  }  	
	  });
	}
	catch (ex) {
	  console.error('Failed to start HTTP server\n', ex, (ex && ex.stack));
	}

	if (process.env['HTTPS'] === 'true') {
		try {
		  https.createServer(config.https.options, app2.callback()).listen(config.https.port, (err) => {
				if (!!err) {
			    console.error('HTTPS server FAIL: ', err, (err && err.stack));
			  } else {
			    console.log(`HTTPS server OK: https://${config.domain}:${config.https.port}`);
			  }
		  });
		}
		catch (ex) {
		  console.error('Failed to start HTTPS server\n', ex, (ex && ex.stack));
		}
	}
}
