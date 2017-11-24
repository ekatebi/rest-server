
import Router from 'koa-router';
import secAuth from '../controllers/sec/auth';
import secUsers from '../controllers/sec/users';
import secRoles from '../controllers/sec/roles';

const base = '/sec';

const auth = new Router({
  prefix: `${base}/auth`
});
 
auth.post('/', secAuth.auth);
auth.get('/cert', secAuth.cert);
auth.get('/:id', secAuth.selectRole);

const users = new Router({
  prefix: `${base}/users`
});

users.get('/', secUsers.all);
users.get('/:id', secUsers.fetch);
users.post('/filter', secUsers.filter);
users.post('/', secUsers.create);
users.put('/:id', secUsers.update);
users.put('/pw/:id', secUsers.updatePassword);
users.delete('/:id', secUsers.delete);

const roles = new Router({
  prefix: `${base}/roles`
});

roles.get('/', secRoles.all);
roles.get('/:id', secRoles.fetch);
roles.post('/filter', secRoles.filter);
roles.post('/', secRoles.create);
roles.put('/:id', secRoles.update);
roles.delete('/:id', secRoles.delete);

roles.put('/:id/:userId', secRoles.addUser);
roles.delete('/:id/:userId', secRoles.removeUser); 

module.exports.authRoutes = auth;
module.exports.usersRoutes = users;
module.exports.rolesRoutes = roles;
