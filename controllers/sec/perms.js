'use strict';

import model from '../../db/mysql/model';

const const_perms = [
  { name: 'Sources', admin: 0, config: 0, display: 0, object_id: 0 },
  { name: 'Displays', admin: 0, config: 0, display: 0, object_id: 0 },
  { name: 'Zones', config: 0, display: 0, object_id: 0 },
  { name: 'Walls', config: 0, display: 0, object_id: 0 },
  { name: 'Multiview', config: 0, display: 0, object_id: 0 },
  { name: 'Logs', display: 1, object_id: 0 },
  { name: 'Help', display: 1, object_id: 0 },
  { name: 'Users', config: 0, display: 0, object_id: 0 },
  { name: 'Roles', config: 0, display: 0, object_id: 0 },
  { name: 'Server', admin: 0, config: 0, display: 0, object_id: 0 }
];

module.exports.create = async (role_id, perms) => {
  const permsEx = perms ? perms : const_perms;
  return Promise.all(permsEx.map((perm) => {
      return model.Perm.forge({ ...perm, role_id }).save();
    }));
}

module.exports.update = async (permObjs) => {
  return Promise.all(permObjs.map((permObj) => {
      const perm = { ...permObj };
      const id = perm.id;
      delete perm.id;
      return model.Perm.forge({ id }).save(perm);
    }));
}

module.exports.delete = async (permModels, role_id ) => {
  var perms = await permModels.model.where({ role_id }).fetchAll();
  return Promise.all(perms.map((perm) => {
      return perm.destroy();
    }));
}
