require('dotenv').config();
const UserDetails = require('./models/user');

//per registrare admin, l'ultima stringa è la password; Inserisci valori sicuri!
//how to register a admin, the last string is the password; change username and password to safe values!
UserDetails.register({ username: 'admin', group: 'admin', active: false }, 'admin', function(err, user) {
    if (err) {
      console.log(err);
      process.exit(-1);
    }
    else{
     console.log('user inserted');
     process.exit(0);
    }
    });

//esempio di come registrare un utente e un robot 
UserDetails.register({ username: 'user', group: 'user', robotids : [ 
    {
    robotid : "turtlebot3_1"
    },
    {
    robotid : "turtlebot3_2"
    }	
      ], active: false }, 'user');

UserDetails.register({ username: 'turtlebot3_1', group: 'robot', robotids : [ 
    {
    robotid : "turtlebot3_1"
    },
      ], active: false }, 'turtlebot3_1');
