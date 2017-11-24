'use strict';

import model from '../../db/mysql/model';
import secPerms from './perms';
import { checkPerm } from './common';

module.exports.all = async (ctx) => {
//  console.log('roles all');
	try {

    checkPerm(ctx, 'Roles', 'display');

    var roles = await model.Roles.forge().fetch({ withRelated: ['users', 'perms'] });
    ctx.body = { error: false, data: roles.toJSON({ shallow: false, omitPivot: true }) || [] };
//    ctx.body = roles;
	} catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
	}
};

module.exports.filter = async (ctx) => {
  try {

    checkPerm(ctx, 'Roles', 'display');
    
    var key = Object.keys(ctx.request.body)[0];
    var val = `%${ctx.request.body[key]}%`;

    var roles = await model.Role.forge().where(key, 'LIKE', val).fetchAll();

//    console.log('role filter', key, val, await roles.count());

    ctx.body = { error: false, data: roles.toJSON({ shallow: false, omitPivot: true }) || [] };
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
};

const fetchRaw = async (id) => {
  return await model.Role.forge({ id }).fetch({ withRelated: ['users', 'perms'] });
};

module.exports.fetchEx = async (id) => {
  return await fetchRaw(id);
};

module.exports.fetch = async (ctx) => {

  try {
    checkPerm(ctx, 'Roles', 'display');
    const id = Number(ctx.params.id);
    ctx.body = { error: false, data: await fetchRaw(id) };
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }

};

const mergePerms = async (roleId, inputPerms) => {  
  const role = await fetchRaw(roleId);
  const roleObj = await role.toJSON({ shallow: false, omitPivot: true });
  return roleObj.perms.map((dbPerm) => {
      const inputPerm = inputPerms.find((inputPerm2) => { return inputPerm2.name === dbPerm.name; });
      return { ...dbPerm, 
        object_id: 0,
        admin: inputPerm.admin !== undefined && inputPerm.admin !== null && typeof(inputPerm.admin) === 'number' ? 
          inputPerm.admin : dbPerm.admin,
        config: inputPerm.config !== undefined && inputPerm.config !== null && typeof(inputPerm.config) === 'number' ? 
          inputPerm.config : dbPerm.config,  
        display: inputPerm.display !== undefined && inputPerm.display !== null && typeof(inputPerm.display) === 'number' ? 
          inputPerm.display : dbPerm.display
      };
    });
};

const addUserRaw = async (id, userId) => {
  var role = await model.Role.forge({ id }).fetch({require: true});
  var users = await role.users().load();
  await users.attach(userId);
};

const removeUserRaw = async (id, userId) => {
  var role = await model.Role.forge({ id }).fetch({require: true});
  var users = await role.users().load();
  await users.detach(userId);
};

const updateRaw = async (roleObj) => {

    var role = await model.Role.forge({ id: roleObj.id }).fetch({ withRelated: ['users', 'perms'] });
    var roleDb = role.toJSON({ shallow: false, omitPivot: true });
    
    if (roleObj.perms) {
//      const perms = await mergePerms(roleObj.id, roleObj.perms);
//      await secPerms.update(perms);
      await secPerms.update(roleObj.perms);
    }

    if (roleObj.users) {

      const users = roleObj.users;
      const dbUsers = roleDb.users;

      let addList = [];
      let removeList = [];

      if (dbUsers.length === 0) { // add all
        addList = [...users];
      } else if (users.length === 0) { // remove all
        removeList = [...dbUsers];
      } else { // mix

        users.forEach(user => {
          if (!dbUsers.find(dbUser => { return dbUser.id === user.id; })) {
            addList.push(user);
          }
        });

        dbUsers.forEach(dbUser => {
          if (!users.find(user => { return user.id == dbUser.id; })) {
            removeList.push(dbUser);
          }
        });

      }

//      console.log('removeList', removeList);
      if (removeList.length > 0) {
        await Promise.all(removeList.map(user => {
          return removeUserRaw(roleObj.id, user.id);
        }));
      }

//      console.log('addList', addList);
      if (addList.length > 0) {
        await Promise.all(addList.map(user => {
          return addUserRaw(roleObj.id, user.id);
        }));
      }

    }

    role = await role.save({
      name: roleObj.name || role.get('name'),
      description: roleObj.description || role.get('description')
    });

    return role.get('id');
}

module.exports.updateEx = async (roleObj) => {
  return await updateRaw(roleObj);
}

module.exports.update = async (ctx) => {
  try {
    checkPerm(ctx, 'Roles', 'config');
    const id = Number(ctx.params.id);
    await updateRaw({ ...ctx.request.body, id });
    ctx.body = { error: false, data: { message: 'Role details updated' } };
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
}

const createRaw = async (roleObj) => {

  var roleX = await model.Role.where({ name: roleObj.name }).fetch();

  if (roleX) {
    throw new Error(`role name, ${roleObj.name} (${roleX.get('name')}, ${roleX.get('id')}), already exists`);
  }

  const roleObj2 = { ...roleObj };

  if (roleObj.perms) { 
    delete roleObj.perms; 
  }

  if (roleObj.users) { 
    delete roleObj.users; 
  }

  var role = await model.Role.forge({ ...roleObj, 
    roleId: roleObj.name.toLowerCase().replace(/ /g, '-')}).save();

  const id = role.get('id');

  if (roleObj2.perms) {
    const perms = await mergePerms(id, roleObj2.perms);
//    await secPerms.update(perms);
    await secPerms.create(id, perms);
  } else {
    await secPerms.create(id);
  }

  if (roleObj2.perms || roleObj2.users) {
    await secPerms.create(id);
    const perms = await mergePerms(id, roleObj2.perms);
    await updateRaw({ ...roleObj2, perms, id });
  }

  return id;
}

module.exports.createEx = async (roleObj) => {
  return await createRaw(roleObj); 
};

module.exports.create = async (ctx) => {
  try {

    checkPerm(ctx, 'Roles', 'config');

    ctx.body = { error: false, data: { id: await createRaw(ctx.request.body) } }; 
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
};

const detachUsers = async (usersModel) => {
  var users = await usersModel.load();
  await users.detach();
};

module.exports.delete = async (ctx) => {

	try {

    checkPerm(ctx, 'Roles', 'config');

    const id = Number(ctx.params.id);

    var role = await model.Role.forge({ id }).fetch({ require: true });

    await secPerms.delete(role.perms(), id);

    await detachUsers(role.users());

    await role.destroy();

    ctx.body = { error: false, data: { message: 'Role deleted' } };

  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
	}
}

module.exports.addUserEx = async (id, userId) => {
  return await addUserRaw(id, userId);
};

module.exports.addUser = async (ctx) => {
  try {   

    checkPerm(ctx, 'Roles', 'config');

    const id = Number(ctx.params.id);
    const userId = Number(ctx.params.userId);

    await addUserRaw(id, userId);
    ctx.body = { error: false, 
      data: { message: `succeeded in adding user ${userId} to role ${id}` } };
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
};

module.exports.removeUserEx = async (id, userId) => {
  return await removeUserRaw(id, userId);
};

module.exports.removeUser = async (ctx) => {
  try {

    checkPerm(ctx, 'Roles', 'config');

    const id = Number(ctx.params.id);
    const userId = Number(ctx.params.userId);

    await removeUserRaw(id, userId);
    ctx.body = { error: false, 
      data: { message: `succeeded in removing user ${userId} from role ${id}` } };
  } catch (err) {
    ctx.body = { error: true, data: { message: err.toString() } };
  }
};
