
'use strict';

import model from '../../db/mysql/model';
import { checkPerm } from './common';

module.exports.all = async (ctx) => {
	try {

    checkPerm(ctx, 'Users', 'display');

    var users = await model.Users.forge().fetch({ withRelated: ['roles'] });
    ctx.body = { error: false, data: users.toJSON({ shallow: false, omitPivot: true }) || [] };
	} catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
	}
};

module.exports.filter = async (ctx) => {
  try {
    checkPerm(ctx, 'Users', 'display');

    var key = Object.keys(ctx.request.body)[0];
    var val = `%${ctx.request.body[key]}%`;

    var users = await model.User.forge().where(key, 'LIKE', val).fetchAll();

    ctx.body = { error: false, data: users.toJSON({ shallow: false, omitPivot: true }) || []};
//    console.log('filter', ctx.request.body, users);
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
};

const fetchRaw = async (id) => {
  return await model.User.forge({ id }).fetch({ withRelated: ['roles'] });
};

module.exports.fetchEx = async (id) => {
  return await fetchRaw(id);
};

module.exports.fetch = async (ctx) => {
  try {

    checkPerm(ctx, 'Users', 'display');

    const id = Number(ctx.params.id);

    var user = await fetchRaw(id); 
    ctx.body = { error: false, 
      data: user.toJSON({ shallow: false, omitPivot: true }) };
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
};

const createRaw = async (userObjEx) => {

//  console.log('createRaw', userObjEx);

  const userObj = { ...userObjEx, password: userObjEx.pw };
  delete userObj.pw;

  var userX = await model.User.where({ userId: userObj.userId }).fetch();

  if (userX !== null) {
    throw new Error(`userId, ${userObj.userId}, already exists`);
  }

  var user = await model.User.forge(userObj).save();

  return user.get('id');
};

module.exports.createEx = async (userObj) => {
  return createRaw(userObj);
};

// create a user
module.exports.create = async (ctx) => {

  try {

    checkPerm(ctx, 'Users', 'config');

    var id = await createRaw({ ...ctx.request.body });
    ctx.body = { error: false, data: { id } };
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
};

// update user details
const updateRaw = async (body, id) => {


// console.log('updateRaw', body);

  if (body.userId) {
    var userX = await model.User.where({ userId: body.userId }).fetch();

    if (userX && Number(id) !== Number(userX.get('id'))) { // another user already has this userId
      throw new Error(`userId, ${body.userId}, already exists at id: ${Number(userX.get('id'))} (${id}), name: ${userX.get('name')}`);
    }
  }

  var user = await model.User.forge({ id }).fetch({ require: true });

  if (!user) {
    throw new Error(`user with id of ${id} does not exists`);      
  }

  var userObj = {
        name: body.name || user.get('name'),
        userId: body.userId || user.get('userId'),
        forcePwChange: body.forcePwChange !== undefined ? body.forcePwChange : user.get('forcePwChange'),
        email: body.email || user.get('email')
    };

  userObj = body.pw ? { ...userObj, password: body.pw } : userObj;

  await user.save(userObj);
};

// update user details
module.exports.update = async (ctx) => {

  try {

    checkPerm(ctx, 'Users', 'config');

    const id = Number(ctx.params.id);

//    await updateRaw(ctx.request.body, id);
    await updateRaw(ctx.request.body, id);

    ctx.body = { error: false, data: { message: 'User details updated' } };

  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }

};


module.exports.updatePassword = async (ctx) => {

  try {

    const id = Number(ctx.params.id);

    checkPerm(ctx, 'Users', 'config', id);

    await updateRaw({ pw: ctx.request.body.pw, forcePwChange: 0 }, id);

    ctx.body = { error: false, data: { message: 'User password updated', id } };

  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }

};

module.exports.userExists = async (userId) => {

  try {

    var user = await model.User.where({ userId }).fetch();

    if (user) { 
      return true;
    } else {
      console.log(`userId, ${userId}, not found.`);
      return false;
    }

  } catch (err) {
    console.log(err.toString());
  }

};


module.exports.changePassword = async (userId, pw, forcePwChange = 0) => {

  try {

    var user = await model.User.where({ userId }).fetch();

    if (user) { 
      const id = user.get('id');
      await updateRaw({ pw, forcePwChange }, id);

      console.log(`successfully changed password for userId, ${userId}`);      
    } else {
      console.log(`userId, ${userId}, not found.`);
    }

  } catch (err) {
    console.log(err.toString());
  }

};

const detachRoles = async (rolesModel) => {
  var roles = await rolesModel.load();
  await roles.detach();
};

// delete user
module.exports.delete = async (ctx) => {

	try {

    checkPerm(ctx, 'Users', 'config');

    const id = Number(ctx.params.id);
    
    var user = await model.User.forge({ id }).fetch({require: true});

    await detachRoles(user.roles());

    await user.destroy();

    ctx.body = {error: false, data: { message: 'User deleted' } };

	} catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
	}
}
