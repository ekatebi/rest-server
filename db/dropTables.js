var op = require('./mysql/operations');

op.dropTables()
.then(function() {
  console.log('security tables dropped!!');
  process.exit(0);
})
.catch(function (error) {
  throw error;
});