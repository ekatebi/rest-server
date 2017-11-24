import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
const users = require('./users');
import { headers, fetchToken } from './common';

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000; // 10 second timeout

const secPort = !process.env['SEC_PORT'] ? global.port : Number(process.env['SEC_PORT']);
const baseUrl = `http://${global.server}:${secPort}`;
const baseUrls = `https://${global.server}:${secPort + 1}`;
const authUrl = `${process.env['HTTPS'] === 'true' ? baseUrls : baseUrl}/sec/auth`;
const usersUrl = `${baseUrl}/sec/users`;
const usersPwUrl = `${baseUrl}/sec/users/pw`;
const rolesUrl = `${baseUrl}/sec/roles`;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe('sec user', () => {

	var userCount = 5;
	var userIds = [];
	var token;

	beforeAll(async () => {

		var json = await fetchToken(authUrl, { userId: 'admin', pw: 'admin' });

		if (json.error) {
			console.log('fetchToken', json);						
		}

		token = json.data.token;

		// clean up

		var body = { name: 'jest-test user' };

		var resp = await fetch(`${usersUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		var json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

// console.log('filter for jest-test user', json);			

		if (json.error === false && json.data.length > 0) {
			var resps = await Promise.all(json.data.map((user) => {
				return fetch(`${usersUrl}/${user.id}`, { method: 'DELETE', 
					headers: headers(token)
					});				
			}));
		}

		resp = await fetch(`${rolesUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

// console.log('filter for roles jest-test user', json);			

		if (json.error === false && Array.isArray(json.data) && json.data.length > 0) {

			json.data.forEach(async (role) => {
				var rsp = await fetch(`${rolesUrl}/${role.id}`, { method: 'DELETE', 
					headers: headers(token)
					});
				
				var jsn = await rsp.json();

//				console.log('jsn', jsn);

			});

		}

	});

	afterAll(async () => {
		var body = { name: 'jest-test user' };

		var resp = await fetch(`${usersUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		var json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

		if (json.error === false && json.data.length > 0) {
			var resps = await Promise.all(json.data.map((user) => {
				return fetch(`${usersUrl}/${user.id}`, { method: 'DELETE', 
					headers: headers(token)
					});				
			}));
		}

		resp = await fetch(`${rolesUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

// console.log('filter for roles jest-test user', json);			

		if (json.error === false && Array.isArray(json.data) && json.data.length > 0) {

			json.data.forEach(async (role) => {
				var rsp = await fetch(`${rolesUrl}/${role.id}`, { method: 'DELETE', 
					headers: headers(token)
					});
				
				var jsn = await rsp.json();

//				console.log('jsn', jsn);

			});

		}

	});

	test('password update', async () => {

		var body = { name: 'jest-test user', userId: 'testUserP', pw: 'testPw', forcePwChange: 1 };

		var resp = await fetch(usersUrl, { method: 'POST', 
			body: JSON.stringify(body),
				headers: headers(token)
			});

		var json = await resp.json();

		if (json.error) {
			console.log('json (POST)', json);
		}
		
		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.id && typeof(json.data.id) === 'number').toBe(true);

		var userid = json.data.id;

		body = { name: 'jest-test user min', description: 'test description' };

		resp = await fetch(`${rolesUrl}`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		json = await resp.json();

//		console.log('json (POST)', json);

		if (json.error === true) {
			console.log('error', json);
			console.log('token', jwt.decode(token));
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.id && typeof(json.data.id) === 'number').toBe(true);

		var roleid = json.data.id;

		resp = await fetch(`${rolesUrl}/${roleid}/${userid}`, { method: 'PUT', 
			headers: headers(token)
			});
			
		json = await resp.json();

		if (json.error) {
			console.log(json);
		}

		expect(json.error).toBe(false);

		json = await fetchToken(authUrl, { userId: 'testUserP', pw: 'testPw' });

		if (json.error) {
			console.log('fetchToken', json);						
		}

		var tkn = json.data.token;

		expect(tkn !== undefined).toBe(true);


		body = { pw: 'testPw2' };

		resp = await fetch(`${usersUrl}/pw/${userid}`, { method: 'PUT', 
			body: JSON.stringify(body),
				headers: headers(tkn)
			});

		json = await resp.json();

		if (json.error) {
			console.log('pw update', userid, roleid, json);
		}
		
		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.id && typeof(json.data.id) === 'number').toBe(true);
		
		// no token for old pw
		json = await fetchToken(authUrl, { userId: 'testUserP', pw: 'testPw' });

		if (json.error && json.data.message !== 'PasswordMismatchError: Invalid password') {
			console.log('fetchToken', json);						
		}

		expect(json.error).toBe(true);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);
		expect(json.data.message).toBe('PasswordMismatchError: Invalid password');
		expect(json.data.token).toBe(undefined);

		var tkn2 = json.data.token;

		// valid token with new pw!
		json = await fetchToken(authUrl, { userId: 'testUserP', pw: 'testPw2' });

		if (json.error) {
			console.log('fetchToken', json);						
		}

		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.token !== undefined).toBe(true);

		var tkn3 = json.data.token;

		expect(tkn3 !== undefined).toBe(true);
	});

	test('no token fetch', async () => {

		var resp = await fetch(usersUrl, { method: 'GET', 
				headers: headers()
			});
		
		var json = await resp.json();

		if (json.error && json.data.message !== 'Error: invalid security token') {
			console.log(json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(true);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);
		expect(json.data.message).toBe('Error: invalid security token');

	});

	test('corrupted token fetch', async () => {

		var resp = await fetch(usersUrl, { method: 'GET',
				headers: headers(token + 'x')
			});
		
		var json = await resp.json();

		if (json.error && json.data.message !== 'Error: invalid security token') {
			console.log(json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(true);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);
		expect(json.data.message).toBe('Error: invalid security token');
	});

	test('create/update/delete user', async () => {

		var resp = await fetch(usersUrl, { method: 'GET', 
				headers: headers(token)
			});
		
		var json = await resp.json();

		if (json.error) {
			console.log('json (GET)', json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(typeof(json.data) === 'object').toBe(true);
		expect(Array.isArray(json.data)).toBe(true);

		var count = json.data.length;

		var body = { name: 'jest-test user', userId: 'testUser', pw: 'testPw', forcePwChange: 1 };

		resp = await fetch(usersUrl, { method: 'POST', 
			body: JSON.stringify(body),
				headers: headers(token)
			});

		json = await resp.json();

		if (json.error) {
			console.log('json (POST)', json);
		}
		
		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.id && typeof(json.data.id) === 'number').toBe(true);

		var id = json.data.id;


// create another user with same userId
		resp = await fetch(usersUrl, { method: 'POST', 
			body:    JSON.stringify(body),
			headers: headers(token)
			});

		json = await resp.json();

		if (json.error && json.data.message !== `Error: userId, ${body.userId}, already exists`) {
			console.log('json (POST)', json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
// expect(json.error).toBe(false);
		expect(json.error).toBe(true);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);
//		expect(json.data.id && typeof(json.data.id) === 'number').toBe(true);

//		console.log('json (POST)', json.data.message);

//		console.log('id', id);

		resp = await fetch(`${usersUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log('json (GET)', id, json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data.id).toBe(id);
		expect(json.data.name).toBe(body.name);
		expect(json.data.userId).toBe(body.userId);
//		expect(json.pw).toBe(body.pw);
		expect(json.data.forcePwChange).toBe(body.forcePwChange);

		var putBody = { name: 'jest-test user 2', pw: 'testPw2', forcePwChange: 0 };

		resp = await fetch(`${usersUrl}/${id}`, { method: 'PUT',
			body:    JSON.stringify(putBody),
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log('json (PUT)', json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);

		resp = await fetch(`${usersUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log('json (GET)', id, json);
		}

		expect(json.error).toBe(false);
		expect(json.data.id).toBe(id);
		expect(json.data.name).toBe(putBody.name);
		expect(json.data.userId).toBe(body.userId);
//		expect(json.pw).toBe(putBody.pw);
		expect(json.data.forcePwChange).toBe(putBody.forcePwChange);

		resp = await fetch(`${usersUrl}/${id}`, { method: 'DELETE', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log('json (DETETE)', id, json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);

		resp = await fetch(`${usersUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});

//		console.log('status (GET after DELETE)', resp.status);
		expect(resp.status === 200 || resp.status === 204).toBe(true); // no content

		// check for row count again

		resp = await fetch(usersUrl, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log('json (GET)', json);
		}

		expect(json !== undefined).toBe(true);
		expect(json.error).toBe(false);
		expect(typeof(json) === 'object').toBe(true);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(Array.isArray(json.data)).toBe(true);
//		expect(json.length).toBe(count);

	});

});
