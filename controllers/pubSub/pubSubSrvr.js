'use strict';

import PubSub from './pubSub';

module.exports.publishGet = async (ctx) => {

	try {
  	
		ctx.body = { error: false, data: { message: 'published successfully' } };

	} catch (err) {		
	  ctx.body = { error: true, data: { message: err.toString() } };
	}
};

module.exports.publish = async (ctx) => {

	try {

    var topic = ctx.request.body.topic;
    var msg = ctx.request.body.msg;

//    console.log('publish', ctx.request.body);

		PubSub.publish(topic, msg);
  	
		ctx.body = { error: false, data: { message: 'published successfully' } };

	} catch (err) {		
	  ctx.body = { error: true, data: { message: err.toString() } };
	}
};

module.exports.subscribe = async (ctx) => {

	try {

    var topic = ctx.params.topic;

/*
    var message = await new Promise((resolve, reject) => {
			PubSub.subscribe(topic, (msg) => {
				resolve(msg);
			});
		});
*/

		var message = topic;

		ctx.body = { error: false, data: { message } };

	} catch (err) {		
	  ctx.body = { error: true, data: { message: err.toString() } };
	}
};
