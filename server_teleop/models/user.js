const mongoose = require('mongoose'); //richiedo mongoose per potermi interfacciare con MongoDB
const passportLocalMongoose = require('passport-local-mongoose'); //strategia locale semplice

//connessione al database

mongoose.connect( process.env.MONGODB_URL,{ 
  useNewUrlParser: true, //rimuove avvisi di deprecation, come anche quello sotto
  useUnifiedTopology: true
});

//creo il modello
const Schema = mongoose.Schema;

const User = new Schema({ //definisco modello utente
  username: String, //nome dell'utente
  group: String, //se è user, cioè client umano, o robot
  robotids : [{ //l'insieme dei robotid, cioè le stanze, a cui ha accesso
    robotid : String, //nel caso del robot è una sola
     }],
  password: String, //la password
});

//esporto il modello
//passport-local-mongoose automaticamente fa l'hash delle password e aggiunge il "salt"
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('userData', User, 'userData'); //userData è il nome della collezione
