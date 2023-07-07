require('dotenv').config(); //richiedo variabili settate nel file .env
const express = require('express');
const router = express.Router(); //oggetto router
const passport = require('passport'); //per l'autenticazione
const connectEnsureLogin = require('connect-ensure-login'); //per essere sicuri che l'utente sia loggato per poter accedere a certe pagine
const path = require('path'); //per i percorsi
const connectflash = require('connect-flash'); //serve nel caso che l'autenticazione fallisca venga stampato a video errore

const csrf = require('csurf'); //csfr protection, imposto il middleware
const csrfProtection = csrf({cookie: false}); //cookie false perché i cookie me li fornisce già express-session
//router.use(csrfProtection); //questo non devo farlo altrimenti alla prima POST il server del robot da CSRF token non valido

const { check, validationResult, param } = require('express-validator'); //chiamo modulo per validare e sanificare input utente
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const xssSanitize = (value) => {
    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window);
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
}

const loginValidate = [ //qui valido e sanitizzo input del form di login
  // Sanitizzo da XSS, Vedo se è stringa, la lunghezza, tolgo spazi, $, graffe, e faccio escaping caratteri HTML, poi solo quelli secondo espressione regolare
  check('username').customSanitizer(xssSanitize).isString().isLength({ min: Number(process.env.MIN_LENGTH_USER_FIELD), max: Number(process.env.MAX_LENGTH_USER_FIELD)}).trim().escape().matches(/^[A-Za-z0-9 .,'!&_]+$/),
  check('password').customSanitizer(xssSanitize).isString().isLength({ min: Number(process.env.MIN_LENGTH_PW_FIELD), max: Number(process.env.MAX_LENGTH_PW_FIELD)}).trim().escape().matches(/^[A-Za-z0-9 .,'!&_]+$/),
  (req, res, next) => {
    let errors = validationResult(req); //salvo errori
    if (!errors.isEmpty()){ //se ci sono errori ritorna errore
      return res.render('login', {error: "Password or username is incorrect"});
      //return res.status(422).json({errors: errors.array()});
    }
    next(); //se no prosegui con prossimo middleware, cioè vai a fare autenticazione passport
   }
  ];

const paramValidate = [ //qui valido e sanitizzo parametro robot id
  param("robot").customSanitizer(xssSanitize).isString().isLength({ min: Number(process.env.MIN_LENGTH_PARAM_ROBOT), max: Number(process.env.MAX_LENGTH_PARAM_ROBOT)}).trim().escape().matches(/^[A-Za-z0-9 .,'!&_]+$/),
  (req, res, next) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()){
      return res.redirect('/robotlist');
      //return res.status(422).json({errors: errors.array()});
    }
    next();
   }
  ];

//Qui parte per login utente e robot. Uso protezione csrf.
router.get('/login', csrfProtection, (req, res) => {
  res.render("login", {error: req.flash("error"), csrfToken: req.csrfToken() }); //inserisco token nel rendering della pagina, se ci sono stati errori nel login mostrali
});

//quando utente si è autenticato può vedere la sua lista di robot. connectEnsureLogin si assicura che l'utente sia stato autenticato prima di acceder alla pagina.
router.get('/robotlist', connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group === 'robot') return res.redirect('/login');
  let arr = [];
  for (let i = 0; i < req.user.robotids.length; i++) { 
    arr.push(req.user.robotids[i].robotid); //faccio cosi se no al javascript del client
  } //si passano objectid del database
  if(req.user.group === 'admin') return res.render('robotlistadmin', { robotlist: arr});
  res.render('robotlist', { robotlist: arr}); //li passo nella view robotlist
});

//quando l'utente ha fatto richiesta di teleop di un robot
router.get('/teleop/:robot', paramValidate, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group === 'robot') return res.redirect('/login');
  let okauth=false;
  for(let i = 0; i < req.user.robotids.length; i++){ //verifico che il parametro inviato sia uguale a uno della lista
    if(req.user.robotids[i].robotid === req.params.robot){ 
      okauth = true;      
    }
  }
  if(okauth){ //se auth ok permetto accesso a robot

    //DOTENV NUMERO ARBITRARI DI MODELLI DI ROBOT  
    for(let i=1; i<=Number(process.env.N_OF_SUPPORTED_ROBOTS); i++){
      if(req.params.robot.includes(eval('process.env.ROBOT'+i+'_MODEL'))){
         //versione con process.env e credenziali turn a lungo termine
         //return res.render('robotwithmap', { roomname: req.params.robot, max_linear: Number(eval('process.env.ROBOT'+i+'_MAX_LINEAR')), max_angular: Number(eval('process.env.ROBOT'+i+'_MAX_ANGULAR')), max_distance: Number(eval('process.env.ROBOT'+i+'_MAX_DISTANCE')), speedlimiter: Number(eval('process.env.ROBOT'+i+'_SPEEDLIMITER')), stun_url: process.env.STUN_URLS, turn_url: process.env.TURN_URLS, turn_username: process.env.TURN_USERNAME, turn_password: process.env.TURN_CREDENTIAL });
    
         //versione con dotenv per stunurls e turnurl con credenziali da REST API, non passo username e password perchè li ottengo da socket io
         //return res.render('robotwithmap', { roomname: req.params.robot, max_linear: Number(eval('process.env.ROBOT'+i+'_MAX_LINEAR')), max_angular: Number(eval('process.env.ROBOT'+i+'_MAX_ANGULAR')), max_distance: Number(eval('process.env.ROBOT'+i+'_MAX_DISTANCE')), speedlimiter: Number(eval('process.env.ROBOT'+i+'_SPEEDLIMITER')), stun_url: process.env.STUN_URLS, turn_url: process.env.TURN_URLS, turn_username: ' ', turn_password: ' '});
    
         //versione con dotenv solo stun_url
         return res.render('robotwithmap', { roomname: req.params.robot, max_linear: Number(eval('process.env.ROBOT'+i+'_MAX_LINEAR')), max_angular: Number(eval('process.env.ROBOT'+i+'_MAX_ANGULAR')), max_distance: Number(eval('process.env.ROBOT'+i+'_MAX_DISTANCE')), speedlimiter: Number(eval('process.env.ROBOT'+i+'_SPEEDLIMITER')), stun_url: process.env.STUN_URLS, turn_url: '', turn_username: ' ', turn_password: ' '});
      }
    }
    res.redirect('/robotlist');   
  }
  else{ //se no rimando a robotlist
  res.redirect('/robotlist');
  }
});

//Questo metodo gestisce la richiesta di login tramite POST. Prima controllo credenziali con loginvalidate, poi csrf token, infine chiamo passport per autenticare; se fallisce rimando a login e mostro errore flash
router.post('/login', loginValidate, csrfProtection, passport.authenticate('userlocal', { failureRedirect: '/login', failureFlash: true }),  function(req, res) {
  // console.log(req.user) //req.user è sicuro perché non è inviato dal client ma salvato solo nel server, è il risultato di passport che dopo aver autenticato un utente genera questo oggetto e lo salva nel db per accedervi alle proprietà facilmente!
  if(req.user.group === 'user') return res.redirect('/robotlist'); //quando l'utente è autenticato viene redirezionato alla lista robot
  if(req.user.group === 'admin') return res.redirect('/admin');
  //ALLORA è un ROBOT

  //DOTENV NUMERO ARBITRARI DI MODELLI DI ROBOT
  for(let i=1; i<=Number(process.env.N_OF_SUPPORTED_ROBOTS); i++){
    if(req.user.robotids[0].robotid.includes(eval('process.env.ROBOT'+i+'_MODEL'))){
         //versione con process.env e credenziali turn a lungo termine
  //return res.render('broadcaster', { roomname: req.user.robotids[0].robotid, robotport: eval('process.env.ROBOT'+i+'_PORT'), stun_url: process.env.STUN_URLS, turn_url: process.env.TURN_URLS, turn_username: process.env.TURN_USERNAME, turn_password: process.env.TURN_CREDENTIAL });
    
  //versione con dotenv per stunurls e turnurl con credenziali da REST API, non passo username e password perchè li ottengo da socket io
  //return res.render('broadcaster', { roomname: req.user.robotids[0].robotid, robotport: eval('process.env.ROBOT'+i+'_PORT'), stun_url: process.env.STUN_URLS, turn_url: process.env.TURN_URLS, turn_username: ' ', turn_password: ' '});
    
  //versione con dotenv solo stun_url
  return res.render('broadcaster', { roomname: req.user.robotids[0].robotid, robotport: eval('process.env.ROBOT'+i+'_PORT'), stun_url: process.env.STUN_URLS, turn_url: '', turn_username: ' ', turn_password: ' '});
      }
    }
  res.redirect('/login');
  ///FINE DOTENV
});

//per gestire il logout
router.post('/logout', function(req, res) {
  req.logout();
  res.redirect('/login');
});

router.get('/admin', connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  res.render('admin');
});

router.get('/register', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  res.render('register');
});

router.get('/deleteuser', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  res.render('deleteuser');
});

router.get('/viewpermissions', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  res.render('viewpermissions');
});

router.get('/addpermission', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  res.render('addpermission');
});

router.get('/removepermission', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  res.render('removepermission');
});

const UserDetails = require('../models/user');

const registerValidate = [ //qui valido e sanitizzo input del form di register
  // Sanitizzo da XSS, Vedo se è stringa, la lunghezza, tolgo spazi, $, graffe, e faccio escaping caratteri HTML, poi solo quelli secondo espressione regolare
  check('username').customSanitizer(xssSanitize).isString().isLength({ min: Number(process.env.MIN_LENGTH_USER_FIELD), max: Number(process.env.MAX_LENGTH_USER_FIELD)}).trim().escape().matches(/^[A-Za-z0-9 .,'!&_]+$/),
  check('password').customSanitizer(xssSanitize).isString().isLength({ min: Number(process.env.MIN_LENGTH_PW_FIELD), max: Number(process.env.MAX_LENGTH_PW_FIELD)}).trim().escape().matches(/^[A-Za-z0-9 .,'!&_]+$/)
  .not().isLowercase().not().isUppercase().not().isNumeric().not().isAlpha(), //verifico che non sia tutto minuscolo, tutto maiuscolo, non sia solo numeri e ne solo di caratteri qualsiasi
  check('group').isIn(['user', 'admin', 'robot']), //verifico che il gruppo sia corretto
  (req, res, next) => {
    let errors = validationResult(req); //salvo errori
    if (!errors.isEmpty()){ //se ci sono errori ritorna errore
      return res.render("register", { result: "utente non soddisfa i requisiti minimi di lunghezza username "+process.env.MIN_LENGTH_USER_FIELD+" o i max "+process.env.MAX_LENGTH_USER_FIELD+
        " oppure i minimi di password "+process.env.MIN_LENGTH_PW_FIELD+" o i max "+process.env.MAX_LENGTH_PW_FIELD+" oppure la password non contiene almeno una minuscola, una maiuscola e un numero; oppure sbagliato a digitare gruppo (deve essere user, admin o group)"});
      //return res.status(422).json({errors: errors.array()});
    }
    next(); //se no prosegui con prossimo middleware
   }
  ];

router.post('/register', registerValidate, csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  UserDetails.register({ username: req.body.username, group: req.body.group, robotids : [ 
    {
    robotid : req.body.robotid
    }
      ], active: false }, req.body.password, function(err, user){
    if(err){console.log(err); res.render("register", { result: "utente già registrato"})}
    else{
      console.log("utente registrato");
      res.render("register", { result: "utente registrato con successo"})
    }
    });
});

router.post('/deleteuser', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  UserDetails.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) {
      console.log(err); res.render("deleteuser", { result: err});
    }
    else{
      if(user!==null){
        UserDetails.remove({
          username: req.body.username
        }, function(err, user) {
          if (err) {
              console.log(err); res.render("deleteuser", { result: "utente inesistente"});
          }
          else{
             console.log("utente eliminato");
             res.render("deleteuser", { result: "utente eliminato con successo"})
          }
        });
       }
      else{
        res.render("deleteuser", { result: "utente inesistente"});
      }
    }
  });
});

router.post('/viewpermissions', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  UserDetails.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) {
      console.log(err); 
      res.render("viewpermissions", { result: err, robotlist: ''});
    }
    else{
     if(user!==null){
      let arr = [];
      for (let i = 0; i < user.robotids.length; i++) { 
        arr.push(' '+user.robotids[i].robotid); //faccio cosi se no al javascript del client
      }
      console.log("permessi trovati");
      if(arr.length==0){
        res.render("viewpermissions", { result: "Nessun permesso trovato", robotlist: ''})
      }
      else{
      res.render("viewpermissions", { result: "I permessi sono:", robotlist: arr})
      }
     }
     else{
      res.render("viewpermissions", { result: "utente inesistente", robotlist: ''});
     }
    }
  });
});

router.post('/addpermission', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  let robid = { robotid: req.body.robotid};
  UserDetails.findOne(
  {username: req.body.username}, 
  function(err, user) {
    if (err) {
      console.log(err); res.render("addpermission", { result: err});
    }
    else{
      if(user!==null){
        UserDetails.update(
        {username: req.body.username},
        {$push: {robotids: robid}},
        function (err,user){
          if (err) {
            console.log(err); res.render("addpermission", { result: err});
          }
          else{
            console.log("permesso aggiunto con successo");
            res.render("addpermission", { result: "permesso aggiunto con successo"})
          }
        });
      }
       else{
       res.render("addpermission", { result: "utente inesistente"});
       }
      }
  });
});

router.post('/removepermission', csrfProtection, connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  let robid = { robotid: req.body.robotid};
  UserDetails.findOne(
  {username: req.body.username}, 
  function(err, user) {
    if (err) {
      console.log(err); res.render("removepermission", { result: err});
    }
    else{
      if(user!==null){
        UserDetails.update(
        {username: req.body.username},
        {$pull: {robotids: robid}},
        function (err,user){
          if (err) {
            console.log(err); res.render("removepermission", { result: err});
          }
          else{
            console.log("permesso rimosso con successo");
            res.render("removepermission", { result: "permesso rimosso con successo"})
          }
        });
      }
       else{
       res.render("removepermission", { result: "utente inesistente"});
       }
      }
  });
});


router.get('/userslist', connectEnsureLogin.ensureLoggedIn(), function(req, res, next) {
  if(req.user.group !== 'admin') return res.redirect('/login');
  UserDetails.find({}, function(err, users) {
    if (err) {
      console.log(err); 
      res.render("userslist", { result: err});
    }
    else{
     let arr = [];
     for (let i = 0; i < users.length; i++) {
      arr.push(' '+users[i].username); //faccio cosi se no al javascript del client
     }
     res.render('userslist', { result: arr});
    }
  });
});

router.get('/', function(req, res, next) {
  res.redirect('/login');
});

module.exports = router;
