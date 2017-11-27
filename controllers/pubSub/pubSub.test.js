'use strict';

import PubSub from './pubSub';

describe('publisher/subscriber', () => {

	const fooListener1 = (msg) => {
//		console.log('listener 1 for foo topic', msg);
		expect(msg).toBe('hello');
	};

	const fooListener2 = (msg) => {
//		console.log('listener 2 for foo topic', msg);
		expect(msg).toBe('hello');
	};

	const barListener1 = (msg) => {
//		console.log('listener 1 for bar topic', msg);
		expect(msg).toBe('world');
	};

	const barListener2 = (msg) => {
//		console.log('listener 2 for bar topic', msg);
		expect(msg).toBe('world');
	};

	const foo2Listener1 = (msg) => {
//		console.log('listener 1 for foo2 topic', msg);
		expect(msg).toBe('hello 2');
	};

	const foo2Listener2 = (msg) => {
//		console.log('listener 2 for foo2 topic', msg);
		expect(msg).toBe('hello 2');
	};


	test('subscribe', async () => {

		PubSub.subscribe('foo', fooListener1);
		PubSub.subscribe('foo', fooListener2);

		PubSub.subscribe('bar', barListener1);
		PubSub.subscribe('bar', barListener2);

		PubSub.subscribe('foo2', foo2Listener1);
		PubSub.subscribe('foo2', foo2Listener2);
	});

	test('publish', async () => {
		PubSub.publish('foo', 'hello');
		PubSub.publish('bar', 'world');
		PubSub.publish('foo2', 'hello 2');
	});

	test('subscribe with history', async () => {

		PubSub.subscribe('foo', fooListener1, 1);
		PubSub.subscribe('bar', barListener1, 1);
		PubSub.subscribe('foo2', foo2Listener1, 1);

		PubSub.subscribe('foo', fooListener1, 2);
		PubSub.subscribe('bar', barListener1, 2);
		PubSub.subscribe('foo2', foo2Listener1, 2);

		PubSub.subscribe('foo', fooListener1, 3);
		PubSub.subscribe('bar', barListener1, 3);
		PubSub.subscribe('foo2', foo2Listener1, 3);
	});

});
