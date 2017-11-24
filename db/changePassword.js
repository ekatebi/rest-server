import secUsers from '../controllers/sec/users';
var rl = require('readline-sync');
 
var userId = rl.question('userId: ');

var exists = secUsers.userExists(userId)
  .then((exists) => {

  if (exists === true) {
    var pw = rl.question('password: ', {  hideEchoBack: true });
    var pwv = rl.question('verify password: ', {  hideEchoBack: true });

    if (pw === pwv) {
      secUsers.changePassword(userId, pw)
        .then(() => {
          process.exit(0);
        });
    } else {
      console.log('password and verify did not match. Please try again.');
      process.exit(0);
    }   
  } else {
    process.exit(0);  
  }
});