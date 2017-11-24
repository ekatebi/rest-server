'use strict';

import model from '../../db/mysql/model';
import jwt from 'jsonwebtoken';
import { privateKey } from '../../constants';

const selectRoleRaw = async (roleId, token) => {

  var role = await model.Role.forge({ id: roleId }).fetch({ withRelated: ['perms'] });

	return jwt.sign({ selectedRole: role.toJSON({ shallow: false, omitPivot: true }), 
		id: token.id,
		name: token.name,
		forcePwChange: token.forcePwChange
	}, privateKey);

};

module.exports.cert = async (ctx) => {

	try {

	  ctx.body = 'Web certificate registered successfully. Please continue with Maestro Z app to the left of this browser tab.';

	} catch (err) {		
	  ctx.body = { error: true, data: { message: err.toString() } };
	}
};

module.exports.auth = async (ctx) => {

	try {

    var userId = ctx.request.body.userId;
    var pw = ctx.request.body.pw;

    var user = await model.User.forge().where({ userId }).fetch({ withRelated: ['roles'] });

    if (!user) {
	    ctx.body = { error: true, data: { message: `user id, ${userId}, not found` } };
	    return;
    }

//    console.log(userId, pw);

		var auth = await user.authenticate(pw);

		var userObj = user.toJSON({ shallow: false, omitPivot: true });

		let token = jwt.sign({ ...userObj }, privateKey);			

		if (userObj.roles.length === 1) {
			token = await selectRoleRaw(userObj.roles[0].id, jwt.decode(token));
		} else if (userObj.roles.length < 1) {
	    ctx.body = { error: true, data: { message: 'user not a member of any roles' } };
	    return;
		}
  	
		ctx.body = { error: false, data: { token } };

	} catch (err) {		
//    ctx.body = { error: true, data: { message: err.toString(), stack: err.stack } };
    ctx.body = { error: true, data: { message: err.toString() } };
	}
};

module.exports.selectRole = async (ctx) => {

	try {

    if (!ctx.state.jwtdata) {
      throw new Error('invalid security token');
    } else if (!ctx.state.jwtdata.roles) {
      throw new Error('wrong token used');    	
    }

    const id = Number(ctx.params.id);

		var token = await selectRoleRaw(id, ctx.state.jwtdata);

		ctx.body = { error: false, data: { token } };

	} catch (err) {		
    ctx.body = { error: true, data: { message: err.toString() } };
	}

};
