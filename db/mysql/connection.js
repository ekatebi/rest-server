/*

	$dbHost = 'localhost';
	$dbUser = 'root';
	$dbPass = 'zazzle';
	$dbName = 'zyper4k';

*/

var knex = require('knex')({
    client: 'mysql',
    connection: {
      host     : '127.0.0.1',
//      host     : '172.17.0.1', 
//      host     : '0.0.0.0', 
      user     : 'root',
      password : 'zazzle',
      database : 'zyper4k',
      charset  : 'utf8'
  },
  pool: { min: 0, max: 7 }
});

const bookshelf = require('bookshelf')(knex);
const securePassword = require('bookshelf-secure-password');
bookshelf.plugin(securePassword);

module.exports.knex = knex;
module.exports.Bookshelf = bookshelf;