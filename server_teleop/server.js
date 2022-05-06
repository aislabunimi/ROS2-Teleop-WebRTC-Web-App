require('dotenv').config(); //richiedo variabili settate nel file .env
const express = require('express'); // framework express
const logger = require('morgan'); // logger per la console
const createError = require('http-errors'); // per mostrare errori express in pagine html
const path = require('path'); // per manipolazione più semplice dei percorsi

// const bodyParser = require('body-parser'); // parser middleware per le HTTP POST
const session = require('express-session');  // session middleware
const connectEnsureLogin = require('connect-ensure-login'); //controlla che utente sia effettivamente autenticato prima di richiedere pagine

const MongoStore = require('connect-mongo'); // per collegare express-session al database Mongodb

const User = require('./models/user.js'); // User Model per mongo

const app = express(); // istanzio l'app

// per poter mostrare i messaggi di errore di login
const connectflash = require('connect-flash'); 
app.use(connectflash());

// per limitare connessioni al server (anti DoS)
const rateLimit = require('express-rate-limit'); 
const limiter = rateLimit({ //impostazioni semi-standard che poi verificherò
  windowMs: Number(process.env.LIMIT_TIME), // limite millisecondi, 10 minuti
  max: Number(process.env.LIMIT_IP_REQUEST), // Ogni IP può fare solo max richieste per window
  standardHeaders: true, // Ritorna informazioni del rate limit nell'header RateLimit
  legacyHeaders: false, // Disabilita l'header X-RateLimit-*
});
app.use(limiter); //uso il limitatore di richieste appena impostato

//helmet imposta insieme header per fornire più sicurezza, tra cui Content Security Policy per prevenire XSS
const helmet = require('helmet'); 
app.use(helmet({  // contentSecurityPolicy: false, //da usare solo in fase di testing!
  contentSecurityPolicy: { 
    directives: {
   //   "script-src": ["'self'"], // solo per testing
      "connect-src": ['*'], //apre possibilità al client di essere connesso a qualsiasi socket al mondo
    } //sotto controllo se utente è autorizzato a connettersi al socket
  }
})
);

//per creare il server https
const fs = require('fs'); // modulo per leggere i certificati dal file system
const https = require('https');
const options = {
 key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
 cert: fs.readFileSync(process.env.HTTPS_CERT_PATH)
};
const server = https.createServer(options, app); //creo il server con le opzioni

// app.set('trust proxy', 1) // trust first proxy nel caso in cui il server sarà dietro a proxy, va abilitato
const sessionMiddleware = session({ //creo la sessione di express-session
  secret: process.env.COOKIE_SECRET, //segreto della sessione
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }), //URL dove si trova il database MONGODB
  name: 'sessionId', //nome del cookie
  resave: false, //non salvare la sessione se non è stata modificata
  saveUninitialized: false, // non creare la sessione finché non viene memorizzato qualcosa
  cookie: { secure: true, httpOnly: true, maxAge: Number(process.env.COOKIE_AGE) },
});
app.use(sessionMiddleware); //infine, uso il middleware

// app.use(bodyParser.urlencoded({ extended: false })); //per parsare dati provenienti dal body, deprecato, uso quello integrato in express

// La parte qui sotto serve per usare passport
const passport = require('passport'); //modulo per l'autenticazione
app.use(passport.initialize()); //per usare passport con express, inizializzo l'oggetto
app.use(passport.session()); //per usare passport con express-session

passport.use('userlocal', User.createStrategy()); //dichiaro strategia da usare, createStrategy è metodo del passport-local-mongoose

passport.serializeUser(User.serializeUser()); //dopo l'autenticazione, passport salva i dati dell'utente in session
passport.deserializeUser(User.deserializeUser()); //metodo per recuperare i dati utenti dalla sessione

// uso mia logica di routing
const indexRouter = require('./routes/index');

//// TURN REST API
/// NEL CASO NON SI USI L'API METTERE SECRET e USERNAME a caso, o commentare codice qui sotto fino a const io
// e poi dove c'è socket io qui sotto sotto a socket.join commentare le due linee di codice di TURN CREDENTIAL
//const crypto = require('crypto');

//sono due process.env questi, servono per login con turn server
/*
const secret=process.env.TURN_SECRET;
const name=process.env.TURN_USERNAME;

function getTURNCredentials(name, secret){    

    let unixTimeStamp = parseInt(Date.now()/1000) + Number(process.env.TURNAPI_DURATION);
    let username = [unixTimeStamp, name].join(':');
    let password;
    let hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    password = hmac.read();
    return {
        username: username,
        password: password
    };
}*/
//////

// richiedo modulo socket.io e lo collego al server
const io = require("socket.io")(server); //connetto socket

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next); //involucro i middleware per l'autenticazione
io.use(wrap(sessionMiddleware)); //per poter usare sessioni in socket.io
io.use(wrap(passport.initialize())); // per poter usare passport in socket.io
io.use(wrap(passport.session())); // per usare le sessioni passport in socket.io

io.use((socket, next) => {
  if (socket.request.user) { //se non si ha cookie valido non ci si può connettere alle socket!
    next(); //controlla i 3 middleware uno alla volta
  } else {
    next(new Error('unauthorized'))
  }
});

//Parte per gestire webrtc, cioè il signaling, e per gestire il teleop
io.sockets.on("error", e => console.log(e)); //per gestire gli errori
io.sockets.on("connection", socket => { // quando avviene una connessione
  //console.log(socket.request.user); // solo in fase di testing
  //console.log(`new connection ${socket.id}`);
  const session = socket.request.session;
  //console.log(`saving sid ${socket.id} in session ${session.id}`);
  session.socketId = socket.id;
  session.save(); //salva la sessione

  let broadcaster; //variabile per il broadcaster webrtc
  let newroom; // variabile usata per salvare la stanza
  socket.on('room', (room) =>{
   //Questa parte sotto controlla che utente abbia l'accesso alla stanza, in base a ciò che è salvato nella sessione, cioè i suoi permessi

    if(socket.request.user.group === 'robot'){ //se l'utente è un robot
      if(socket.request.user.robotids[0].robotid === room){ //se la stringa è diversa dalla room a cui hai fatto richeista
        newroom = room; //imposta la variabile
        socket.join(room); //fai accedere il robot alla room

        ////// TURN CREDENZIALI
      /*  let turncredentials=getTURNCredentials(name, secret);       
        socket.emit("turncredentials", turncredentials.username, turncredentials.password);*/
        //////////
      }
      else{ //altrimenti
        new Error('unauthorized'); //il robot non ha accesso
        return socket.disconnect();
      }
    }
    else{ //altrimenti l'utente è user, un umano
      let okauth=false; //variabile che viene settata a true quando si sono verificati positivamente i permessi dell'utente
      for (let i = 0; i < socket.request.user.robotids.length; i++) { //guardo tutti i robotids a cui ha accesso l'utente
        if(socket.request.user.robotids[i].robotid === room){ // se la room è presente fra i robot id a cui ha accesso l'utente    
          okauth = true; //allora l'utente è autorizzato a connettersi alla socket
        }
      }
      if(okauth){ //se è autorizzato 
        let numeroclient = io.sockets.adapter.rooms.get(room);
        if(numeroclient==undefined){ //stanza non ancora creata perchè non vi è alcun utente
          new Error('robotnotonline');
          return socket.disconnect();
        }
        if(numeroclient.size>1){ //ottengo numero client connessi nella stanza, ora è definita 
          new Error('someoneisteleoperating');
          return socket.disconnect(); //significa che oltre al robot c'è qualcuno che sta già teleoperando, quindi disconnetto quello che ha appena joinato
        }
        newroom = room; //imposta variabile
        socket.join(room); //fai accedere l'utente alla room

        ////// TURN CREDENZIALI
      /*  let turncredentials=getTURNCredentials(name, secret);
        socket.emit("turncredentials", turncredentials.username, turncredentials.password); */
        //////////
      }
      else{ //altrimenti
        new Error('unauthorized'); //l'utente non ha accesso
        return socket.disconnect();
      }
    } 
  
});

  socket.on("broadcaster", () => {
    broadcaster = socket.id; //salvo il socket id del broadcaster, cioè il robot, per usarlo dopo per far sapere ai client dove si connetteranno
    socket.in(newroom).emit("broadcaster");
  });
  socket.on("watcher", () => { //se è disponibile il watcher, cioè l'utente umano
    socket.in(newroom).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => { //3 eventi usati per istanziare la connessione, sulla base del funzionamento di webrtc
    socket.in(newroom).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.in(newroom).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.in(newroom).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", () => { //se mi disconnetto il broadcaster deve chiudere la connessione
    socket.in(newroom).emit("disconnectPeer", socket.id);
  });

  //Questo evento si occupa della parte necessaria per il teleop
  socket.on("speed", (linear, angular) => { //quando si verifica evento linear, prendo arg, che è il valore
    socket.in(newroom).emit("speedsendrobot", linear, angular); // passato dal client e aggiorno la variabile, che verrà poi usata dal publisher di rclnodejs
  });
  
  socket.on("savemap", () => { //per salvare mappa
    socket.in(newroom).emit("savemapsendrobot"); 
  });
  
  socket.on("map", (map) => { //prendo mappa dal robot e la echo al client
    socket.in(newroom).emit("mapecho", map); 
  });
  
  socket.on("savemapres", (res) => { //prendo mappa dal robot e la echo al client
    socket.in(newroom).emit("savemapresecho", res); 
  });
  
  socket.on("battery", (percentage, status) => { //prendo mappa dal robot e la echo al client
    socket.in(newroom).emit("batteryecho", percentage); 
  })

});

const port = Number(process.env.SERVER_PORT);   // la porta del server
server.listen(port, () => console.log(`Server is running on port ${port}`)); //mi metto in ascolto sulla porta

const favicon = require('serve-favicon'); //per avere custom favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// view engine setup, ho usato hbs per handlebars
app.set('views', path.join(__dirname, 'views')); //dove si trovano le viste per renderizzare
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json()); //metodo per riconoscere i dati inviati dal client tramite POST come JSON
app.use(express.urlencoded({ extended: false })); //metodo per riconoscere i dati inviati dal client tramite POST come stringhe
app.use(express.static(path.join(__dirname, 'public'))); // il path dove ho tutte le risorse pubbliche (CSS e Script)
app.use('/private', connectEnsureLogin.ensureLoggedIn(), express.static(path.join(__dirname, 'private'))); //nella privata fornisco watch e broadcast che hanno credenziali di turn

app.use('/', indexRouter); // indexRouter contiene la mia logica di routing

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler, definito da express-generator
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
