var op = require('./mysql/operations');

op.createTables()
.then(function() {
  console.log('security tables created!!!');
  process.exit(0);
})
.catch(function (error) {
  throw error;
});
