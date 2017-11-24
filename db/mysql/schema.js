const sec_user = {
    id: { type: 'increments', nullable: false, primary: true },
    name: { type: 'string', maxlength: 256, nullable: false },
    userId: { type: 'string', maxlength: 256, nullable: false, unique: true },
    password_digest: { type: 'string', maxlength: 256, nullable: false },
    forcePwChange: { type: 'integer', unsigned: true, defaultTo: 0 },
    email: { type: 'string', maxlength: 256, nullable: true, unique: true },
  };

const sec_role = {
    id: {type: 'increments', nullable: false, primary: true },
    roleId: { type: 'string', maxlength: 256, nullable: false, unique: true },
    name: { type: 'string', maxlength: 256, nullable: false },
    description: { type: 'string', maxlength: 256, nullable: false }
  };

const sec_permission = { // one-to-many table
    id: { type: 'increments', nullable: false, primary: true },
    role_id: { type: 'integer', nullable: false, unsigned: true, references: sec_role.id },
    name: { type: 'string', maxlength: 256, nullable: false },
    object_id: { type: 'integer', unsigned: true, defaultTo: 0 },
    admin: { type: 'integer', unsigned: true, nullable: true },
    config: { type: 'integer', unsigned: true, nullable: true },
    display: { type: 'integer', unsigned: true, nullable: true }
  };

const sec_role_user = { // many-to-many junction table
    id: { type: 'increments', nullable: false, primary: true },
    role_id: { type: 'integer', nullable: false, unsigned: true, references: sec_role.id },
    user_id: { type: 'integer', nullable: false, unsigned: true, references: sec_user.id }
  };

module.exports = {
  sec_user,
  sec_role,
  sec_permission,
  sec_role_user
};
