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

//esempio di come registrare un utente e un robot, copia e incolla sopra dopo la prima { e lascia la function
//how to register a user and a robot , copy and paste after the first { and leave the function
/*
username: 'test', group: 'user', robotids : [ 
    {
    robotid : "robot1"
    },
    {
    robotid : "robot2"
    }	
      ], active: false }, 'test', 

username: 'robot1test', group: 'robot', robotids : [ 
    {
    robotid : "robot1"
    },
      ], active: false }, 'robot1test', 
*/
