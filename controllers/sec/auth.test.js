'use strict';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
const users = require('./roles');
import { headers, fetchToken } from './common';

const secPort = !process.env['SEC_PORT'] ? global.port : Number(process.env['SEC_PORT']);
const baseUrl = `http://${global.server}:${secPort}`;
const baseUrls = `https://${global.server}:${secPort + 1}`;
const authUrl = `${process.env['HTTPS'] === 'true' ? baseUrls : baseUrl}/sec/auth`;
const usersUrl = `${baseUrl}/sec/users`;
const rolesUrl = `${baseUrl}/sec/roles`;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000; // 10 second timeout
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe('sec auth', () => {

	var userCount = 5;
	var userIds = [];

	var roleCount = 5;
	var roleIds = [];
	var token;

	beforeAll(async () => {

		var json = await fetchToken(authUrl, { userId: 'admin', pw: 'admin' });

		if (json.error) {
			console.log('fetchToken', json);						
		}

		token = json.data.token;

		var body = { name: 'jest-test auth' };

		var resp = await fetch(`${usersUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log('beforeAll', json);			
		}

		if (json.error === false && json.data.length > 0) {

			var resps = await Promise.all(json.data.map((user) => {
				return fetch(`${usersUrl}/${user.id}`, { method: 'DELETE', 
					headers: headers(token)
					});
				
			}));
		}

		body = { description: 'jest-test auth' };

		var resp = await fetch(`${rolesUrl}/filter`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers(token)
			});
		
		json = await resp.json();

		if (json.error) {
			console.log('beforeAll', json);			
		}

		if (json.error === false && json.data.length > 0) {
			resps = await Promise.all(json.data.map((role) => {

	//			console.log('beforeAll map', user);

				return fetch(`${rolesUrl}/${role.id}`, { method: 'DELETE', 
					headers: headers(token)
					});
				
			}));
		}

		for (let i = 0; i < userCount; i++) {

			var body = { name: 'jest-test auth', userId: 'testUser', pw: 'testPw', forcePwChange: 0 };

			const userId = `${body.userId}-${i}`;
			body = { ...body, userId };

			var resp = await fetch(`${usersUrl}`, { method: 'POST', 
				body: JSON.stringify(body),
				headers: headers(token)
				});

			var json = await resp.json();

			if (json.error) {
				console.log(json);
			}

			userIds.push(json.data.id);

//			console.log('in beforeAll json (POST)', json);
		}

		for (let i = 0; i < roleCount; i++) {

			var body = { name: 'jest-test auth', description: 'jest-test auth' };
	
			body = { ...body, name: `${body.name}-${i}` };

			var resp = await fetch(`${rolesUrl}`, { method: 'POST', 
				body:    JSON.stringify(body),
				headers: headers(token)
				});
			
			var json = await resp.json();

			if (json.error) {
				console.log('error', json);
			}

			expect(json.error).toBe(false);

			roleIds.push(json.data.id);
		}

		for (let r = 0; r < roleIds.length; r++) {
			for (let u = 0; u < userIds.length; u++) {
				resp = await fetch(`${rolesUrl}/${roleIds[r]}/${userIds[u]}`, { method: 'PUT', 
					headers: headers(token)
					});
				
				json = await resp.json();

				if (json.error) {
					console.log('PUT', json);
				}

				expect(json.error).toBe(false);
			}
		}

	});

	afterAll(async () => {

		for (let i = 0; i < userIds.length; i++) {
			var resp = await fetch(`${usersUrl}/${userIds[i]}`, { method: 'DELETE', 
				headers: headers(token)
				});
			
			var json = await resp.json();

			if (json.error) {
				console.log(json);
			}
		}

		for (let i = 0; i < roleIds.length; i++) {
			var resp = await fetch(`${rolesUrl}/${roleIds[i]}`, { method: 'DELETE', 
					headers: headers(token)
				});
			
			var json = await resp.json();

			if (json.error) {
				console.log(json);
			}
		}

	});

	test('login, get token with roles, select a role perms', async () => {

		var userId = 'testUser-10';

		var body = { userId, pw: 'testPw' };

		var resp = await fetch(`${authUrl}`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers()
			});

		var json = await resp.json();
/*
		if (json.error) {
			console.log('auth', json.data);			
		}
*/
		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(true);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);
		expect(json.data.message).toBe(`user id, ${userId}, not found`);

		body = { userId: 'testUser-0', pw: 'testPwX' };

		resp = await fetch(`${authUrl}`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers()
			});

		var json = await resp.json();

		if (json.error && json.data.message !== 'PasswordMismatchError: Invalid password') {
			console.log('fetchToken', json);						
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(true);
		expect(json.data && typeof(json.data) === 'object').toBe(true);
		expect(json.data.message && typeof(json.data.message) === 'string').toBe(true);
		expect(json.data.message).toBe('PasswordMismatchError: Invalid password');

		body = { userId: 'testUser-0', pw: 'testPw' };

		resp = await fetch(`${authUrl}`, { method: 'POST', 
			body: JSON.stringify(body),
			headers: headers()
			});

		var json = await resp.json();

		if (json.error) {
			console.log(json);			
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);

//		expect(json.data.token && typeof(json.data.token) === 'object').toBe(true);

		var token = jwt.decode(json.data.token);

//		console.log('foo:', decoded.foo); // bar 
//		console.log('token:', token); // bar 

		expect(token && typeof(token) === 'object').toBe(true); 
		expect(token.roles && typeof(token.roles) === 'object').toBe(true); 
		expect(Array.isArray(token.roles)).toBe(true);
		expect(token.roles.length).toBe(5);
		expect(token.selectedRole).toBe(undefined);

		var roleId = token.roles[2].id;

		var resp = await fetch(`${authUrl}/${roleId}`, { method: 'GET', 
				headers: headers(json.data.token)
			});

		var json = await resp.json();

		if (json.error) {
			console.log('error:', json.data);			
		}

		expect(json && typeof(json) === 'object').toBe(true);
		expect(json.error).toBe(false);
		expect(json.data && typeof(json.data) === 'object').toBe(true);

		token = jwt.decode(json.data.token);

		expect(token && typeof(token) === 'object').toBe(true); 

		if (!token.selectedRole) {
			expect(token.roles && typeof(token.roles) === 'object').toBe(true); 
			expect(Array.isArray(token.roles)).toBe(true);
			expect(token.roles.length).toBe(5);
		}

		if (!token.roles) {
			expect(token.selectedRole && typeof(token.selectedRole) === 'object').toBe(true); 
			expect(token.selectedRole.perms && typeof(token.selectedRole.perms) === 'object').toBe(true); 
			expect(Array.isArray(token.selectedRole.perms)).toBe(true);
			expect(token.selectedRole.perms.length >= 10).toBe(true);
		}
//		console.log('token', JSON.stringify(token, null, 2)); 
	});
});
