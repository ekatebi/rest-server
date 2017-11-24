import { Bookshelf } from './connection'; 

// User model
var User = Bookshelf.Model.extend({
  tableName: 'sec_user',
  hasSecurePassword: true,
  roles: function() {
    return this.belongsToMany(Role, 'sec_role_user', 'user_id', 'role_id');
  }
});

module.exports.User = User;

// collection
module.exports.Users = Bookshelf.Collection.extend({
  model: User
});

// Role model
var Role = Bookshelf.Model.extend({
  tableName: 'sec_role',
  users: function() {
    return this.belongsToMany(User, 'sec_role_user', 'role_id', 'user_id');
  },
  perms: function() { 
    return this.hasMany(Perm, 'role_id');
  }  
});

module.exports.Role = Role;

// collection
module.exports.Roles = Bookshelf.Collection.extend({
  model: Role
});

// Perm model
var Perm = Bookshelf.Model.extend({
  tableName: 'sec_permission',
  role: function () {
    return this.belongsTo(Role, 'role_id');
  }
});

module.exports.Perm = Perm;

// collection
module.exports.Perms = Bookshelf.Collection.extend({
  model: Perm
});
