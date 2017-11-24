var op = require('./mysql/operations');

op.seedDb()
.then(function() {
  console.log('security tables seeded!!!');
  process.exit(0);
})
.catch(function (error) {
  throw error;
});
