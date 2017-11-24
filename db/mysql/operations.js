import { knex } from './connection';
import secUsers from '../../controllers/sec/users';
import secRoles from '../../controllers/sec/roles';

var Schema = require('./schema');
var sequence = require('when/sequence');
var _ = require('lodash');

const createTable = (tableName) => {
  return knex.schema.createTable(tableName, function (table) {
    var column;
    var columnKeys = _.keys(Schema[tableName]);
    _.each(columnKeys, function (key) {
      if (Schema[tableName][key].type === 'text' && Schema[tableName][key].hasOwnProperty('fieldtype')) {
        column = table[Schema[tableName][key].type](key, Schema[tableName][key].fieldtype);
      }
      else if (Schema[tableName][key].type === 'string' && Schema[tableName][key].hasOwnProperty('maxlength')) {
        column = table[Schema[tableName][key].type](key, Schema[tableName][key].maxlength);
      }
      else {
        column = table[Schema[tableName][key].type](key);
      }
      if (Schema[tableName][key].hasOwnProperty('nullable') && Schema[tableName][key].nullable === true) {
        column.nullable();
      }
      else {
        column.notNullable();
      }
      if (Schema[tableName][key].hasOwnProperty('primary') && Schema[tableName][key].primary === true) {
        column.primary();
      }
      if (Schema[tableName][key].hasOwnProperty('unique') && Schema[tableName][key].unique) {
        column.unique();
      }
      if (Schema[tableName][key].hasOwnProperty('unsigned') && Schema[tableName][key].unsigned) {
        column.unsigned();
      }
      if (Schema[tableName][key].hasOwnProperty('references')) {
        column.references(Schema[tableName][key].references);
      }
      if (Schema[tableName][key].hasOwnProperty('defaultTo')) {
        column.defaultTo(Schema[tableName][key].defaultTo);
      }
    });
  });
}

module.exports.createTables = () => {
  var tables = [];
  var tableNames = _.keys(Schema);

  tables = _.map(tableNames, function (tableName) {
    return function () {
      return createTable(tableName);
    };
  });

  return sequence(tables);
};

module.exports.dropTables = () => {
  var tables = [];
  var tableNames = _.keys(Schema);

  tables = _.map(tableNames, function (tableName) {
    return function () {
      return knex.schema.dropTable(tableName);
    };
  });

  return sequence(tables);
};

const showTable = (tableName) => {
  console.log(tableName);
  knex.schema.table(tableName, function (table) {
    console.log('table', table);
  });
};

module.exports.showTables = (tableName = '*', nameOnly = true) => {
  console.log('showTables', tableName, nameOnly);
  knex.select(tableName).from('information_schema.tables')
    .then(function(resp) {
      // console.log('resp', resp);

      if (nameOnly) {
        const tableNames = resp.map((table) => {
          return table['TABLE_NAME'];
        });

        tableNames.forEach((tableName) => {
          console.log(tableName);
        });

      } else {
        console.log('resp', resp);
      } 

      process.exit(0);
  })
  .catch(function (error) {
    throw error;
  });

};

module.exports.showTablesColumns = () => {
  var tableNames = _.keys(Schema);

  tableNames.forEach((tableName) => {

  console.log('table name:', tableName);

  knex.select('SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT')
    .from('INFORMATION_SCHEMA.COLUMNS')
    .where('table_name', tableName)
    .then(function(resp) {
      // console.log('resp', resp);

      console.log('resp', resp);

      process.exit(0);
    })
    .catch(function (error) {
      throw error;
    });
  });

  process.exit(0);
};

module.exports.seedDb = async () => {
  try {

    // make user
    var name = 'admin';
    var userId = 'admin';
    
    var uid = await secUsers.createEx({
      name,
      userId,
      pw: 'admin',
      forcePwChange: 0
    });

    // make role
    var rid = await secRoles.createEx({
      name,
      description: 'admin Role'
    });

    await secRoles.addUserEx(rid, uid);

    // get perms of new role
    var role = await secRoles.fetchEx(rid);

    var roleObj = role.toJSON({ shallow: false, omitPivot: true });

    var perms = await Promise.all(roleObj.perms
      .map((perm) => {
        const perm2 = { ...perm };
      return new Promise((resolve, reject) => {
        if (perm2.admin !== undefined && perm2.admin !== null) {
          perm2.admin = 1;
        }

        if (perm2.config !== undefined && perm2.config !== null) {
          perm2.config = 1;        
        }

        if (perm2.display !== undefined && perm2.display !== null) {
          perm2.display = 1;        
        }

        resolve(perm2);
      });
    }));

//    console.log('after', perms);

    await secRoles.updateEx({ ...role.toJSON({ shallow: false, omitPivot: true }), perms: [...perms] });

  } catch (err) {
    console.log('seedDb error:', err.toString());
  }
};


