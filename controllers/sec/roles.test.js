'use strict';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
const users = require('./roles');
import { headers, fetchToken } from './common';

// const server: http.Server = http.createServer(app.express);

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000; // 10 second timeout

const secPort = !process.env['SEC_PORT'] ? global.port : Number(process.env['SEC_PORT']);
const baseUrl = `http://${global.server}:${secPort}`;
const baseUrls = `https://${global.server}:${secPort + 1}`;
const authUrl = `${process.env['HTTPS'] === 'true' ? baseUrls : baseUrl}/sec/auth`;
const usersUrl = `${baseUrl}/sec/users`;
const rolesUrl = `${baseUrl}/sec/roles`;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe('sec role', () => {

	var userCount = 5;
	var userIds = [];
	var token;

	beforeAll(async () => {

		var json = await fetchToken(authUrl, { userId: 'admin', pw: 'admin' });

		if (json.error) {
			console.log('fetchToken', json);						
		}

		token = json.data.token;

//		console.log('beforeAll token', token);

		// clean up

		var body = { name: 'jest-test role' };

		var resp = await fetch(`${usersUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		var json = await resp.json();

//		console.log('json (GET beforeAll)', json);

		if (json.error) {
			console.log('json (POST)', json);
		}

// console.log('beforeAll filter users for jest-test role', json);			

		if (json.error === false && json.data.length > 0) {
			var resps = await Promise.all(json.data.map((user) => {

	//			console.log('beforeAll map', user);

				return fetch(`${usersUrl}/${user.id}`, { method: 'DELETE', 
					headers: headers(token)
					});
				
			}));
		}

		body = { name: 'jest-test role' };

		var resp = await fetch(`${rolesUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		json = await resp.json();

//		console.log('json (GET beforeAll)', json);

		if (json.error === false && json.data.length > 0) {
			resps = await Promise.all(json.data.map((role) => {

	//			console.log('beforeAll map', user);

				return fetch(`${rolesUrl}/${role.id}`, { method: 'DELETE', 
					headers: headers(token)
					});
				
			}));
		}

		for (let i = 0; i < userCount; i++) {
			var body = { name: 'jest-test role', userId: 'testUserR', pw: 'testPw', forcePwChange: 1 };
			const userId = `${body.userId}-${i}`;
			body = { ...body, userId };
			var resp = await fetch(`${usersUrl}`, { method: 'POST', 
				body: JSON.stringify(body),
				headers: headers(token)
				});

			var json = await resp.json();

			userIds.push(json.data.id);

//			console.log('in beforeAll json (POST)', json);
		}

//			console.log('end of beforeAll');
	});

	afterAll(async () => {

		var body = { name: 'jest-test role' };

		var resp = await fetch(`${usersUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		var json = await resp.json();

//		console.log('json (GET beforeAll)', json);

		if (json.error) {
			console.log('json (POST)', json);
		}

		if (Array.isArray(json.data)) {
			json.data.forEach(async (user) => {
				var rsp = await fetch(`${usersUrl}/${user.id}`, { method: 'DELETE', 
					headers: headers(token)
					});
				
				var jsn = await rsp.json();

//				console.log('jsn', jsn);

			});
		}

/*
console.log('afterAll filter users for jest-test role', json);

		for (let i = 0; i < userIds.length; i++) {

			var resp = await fetch(`${usersUrl}/${userIds[i]}`, { method: 'DELETE', 
				headers: headers(token)
				});
			
			var json = await resp.json();

//			console.log('json', json);
		}
*/
	});

	test('no token fetch', async () => {

		var resp = await fetch(rolesUrl, { method: 'GET', 
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

		var resp = await fetch(rolesUrl, { method: 'GET', 
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

	test('create role and add member users', async () => {

		var body = { name: 'jest-test role', description: 'test description' };

		var resp = await fetch(`${rolesUrl}`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		var json = await resp.json();

//		console.log('json (POST)', json);

		if (json.error === true) {
			console.log('error', json);
			console.log('token', jwt.decode(token));
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.id && typeof(json.data.id) === 'number').toBe(true);

		var id = json.data.id;

//		console.log('id', id);

		// add users

		for (let i = 0; i < userCount; i++) {
			resp = await fetch(`${rolesUrl}/${id}/${userIds[i]}`, { method: 'PUT', 
//					body: JSON.stringify({}),
				headers: headers(token)
				});
			
			json = await resp.json();

			if (json.error) {
				console.log(json);
			}

			expect(json.error).toBe(false);
//			console.log('addUser json (PUT)', json);
		}

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		expect(json && typeof(json) === 'object').toBe(true);

		if (json.error) {
			console.log('role after adding users', json);
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);

		expect(json.data.users && typeof(json.data.users) === 'object').toBe(true);
		expect(json.data.users && typeof(json.data.users) === 'object').toBe(true);
		expect(Array.isArray(json.data.users)).toBe(true);
		expect(json.data.users.length).toBe(userCount);

		expect(json.data.perms && typeof(json.data.perms) === 'object').toBe(true);
		expect(Array.isArray(json.data.perms)).toBe(true);
		expect(json.data.perms.length >= 10).toBe(true);

//		console.log('json.data.perms', json.data.perms);

		var displaysPerm = json.data.perms.find((perm) => {
			return perm.name === 'Displays';
		});

//		console.log('displaysPerm', displaysPerm);

		displaysPerm.admin = 1;

		var sourcesPerm = json.data.perms.find((perm) => {
			return perm.name === 'Sources';
		});

		sourcesPerm.config = 1;
//		console.log('json.perms after', json.perms);

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'PUT', 
			body:    JSON.stringify(json.data),
			headers: headers(token)
			});
		
		json = await resp.json();

		expect(json.error).toBe(false);

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		expect(json && typeof(json) === 'object').toBe(true);

//		console.log('role after adding users', json);

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data.users && typeof(json.data.users) === 'object').toBe(true);
		expect(Array.isArray(json.data.users)).toBe(true);
		expect(json.data.users.length).toBe(userCount);

		expect(json.data.perms && typeof(json.data.perms) === 'object').toBe(true);
		expect(Array.isArray(json.data.perms)).toBe(true);
		expect(json.data.perms.length >= 10).toBe(true);

//		console.log('json.perms', json.perms);

		var displaysPerm2 = json.data.perms.find((perm) => {
			return perm.name === 'Displays';
		});

		expect(displaysPerm2.admin).toBe(1);

		var sourcesPerm2 = json.data.perms.find((perm) => {
			return perm.name === 'Sources';
		});

		expect(sourcesPerm2.config).toBe(1);

		for (let i = 0; i < userCount; i++) {
			// check user
			resp = await fetch(`${usersUrl}/${userIds[i]}`, { method: 'GET', 
				headers: headers(token)
				});
			
			json = await resp.json();

			if (json.error) {
				console.log(json);			
			}

			expect(json && typeof(json) === 'object').toBe(true);

	//		console.log('role after adding users', json);
			expect(json && typeof(json) === 'object').toBe(true);
			expect(json.error).toBe(false);
			expect(json.data.roles && typeof(json.data.roles) === 'object').toBe(true);
			expect(Array.isArray(json.data.roles)).toBe(true);
			expect(json.data.roles.length).toBe(1);

		}

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

		expect(json && typeof(json) === 'object').toBe(true);

//		console.log('role after removing users', json);
		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.users && typeof(json.data.users) === 'object').toBe(true);
		expect(Array.isArray(json.data.users)).toBe(true);
		expect(json.data.users.length).toBe(userIds.length);

		// delete a user and see if it's removed from role
		var userId = userIds.shift();

		resp = await fetch(`${usersUrl}/${userId}`, { method: 'DELETE', 
			headers: headers(token)
			});
		
		json = await resp.json();

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

		expect(json && typeof(json) === 'object').toBe(true);

//		console.log('role after removing users', json);
		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.users && typeof(json.data.users) === 'object').toBe(true);
		expect(Array.isArray(json.data.users)).toBe(true);
		expect(json.data.users.length).toBe(userIds.length);

		// remove users
		for (let i = 0; i < userIds.length; i++) {

			resp = await fetch(`${rolesUrl}/${id}/${userIds[i]}`, { method: 'DELETE', 
				headers: headers(token)
				});
			
			json = await resp.json();

//			console.log('removeUser json (DELETE)', json);
		}

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

		expect(json && typeof(json) === 'object').toBe(true);

//		console.log('role after removing users', json);
		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.users && typeof(json.data.users) === 'object').toBe(true);
		expect(Array.isArray(json.data.users)).toBe(true);
		expect(json.data.users.length).toBe(0);

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'DELETE', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);

	});

	test('create/update/delete role', async () => {

//		console.log('create/update/delete role');

		var resp = await fetch(`${rolesUrl}`, { method: 'GET', 
			headers: headers(token)
			});
		
		var json = await resp.json();
//		console.log('roles', json);
		expect(json !== undefined).toBe(true);
		expect(typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(Array.isArray(json.data)).toBe(true);

	//	console.log('roles', typeof(json), json);

		var count = json.length;

//		console.log('roles initial count', count);

		var body = { name: 'jest-test role 2', description: 'test description' };

		resp = await fetch(`${rolesUrl}`, { method: 'POST', 
			body:    JSON.stringify(body),
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

//		console.log('id', id);

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});

		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

//		console.log('json (GET after POST)', json);

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.id).toBe(id);
		expect(json.data.name).toBe(body.name);
		expect(json.data.description).toBe(body.description);

//		var putBody = { description: 'test description 2' };
		var putBody = { ...json, description: 'test description 2', perms: [...json.data.perms] };

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'PUT', 
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

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});
	
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

//		console.log('json (GET after PUT)', json);

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.id).toBe(id);
		expect(json.data.name).toBe(body.name);
		expect(json.data.description).toBe(putBody.description);

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'DELETE', 
			headers: headers(token)
			});
		
		json = await resp.json();

//		console.log('json', json);

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);

		resp = await fetch(`${rolesUrl}/${id}`, { method: 'GET', 
			headers: headers(token)
			});

//		console.log('status (GET after DELETE)', resp.status);
		expect(resp.status === 200 || resp.status === 204).toBe(true); // no content

		// check for row count again

		resp = await fetch(`${rolesUrl}`, { method: 'GET', 
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

		expect(json !== undefined).toBe(true);
		expect(typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(Array.isArray(json.data)).toBe(true);
//		expect(json.length).toBe(count);

	});

});
