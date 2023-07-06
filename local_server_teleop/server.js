require('dotenv').config();  //richiedo variabili settate nel file .env
const express = require("express");
const app = express(); //framework express come nel server

//per https
/*const fs = require('fs');
const https = require('https');
const options = {
 key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
 cert: fs.readFileSync(process.env.HTTPS_CERT_PATH)
};
const server = https.createServer(options, app);*/ //creo il server https

const http = require('http');
const server = http.createServer(app);

const io = require("socket.io")(server, { //necessario impostare cors per permettere al server del robot di collegarsi al socket di signaling
  cors: { 
   // origin: '*', //questo permette al server di connettersi a socket di ogni origine, poi imposto nel listen in modo che solo localhost si può connettere al server e quindi alla socket
    origin: process.env.SERVER_TELEOP_IP //solo al server, deve essere proprio l'ip, non la pagina web
  }
}
); //connetto socket

const port = Number(process.env.THIS_SERVER_PORT); //la porta

//ascolto solo su localhost
server.listen(port, 'localhost', () => console.log(`Server is running on port ${port}`));

/////Socket io per rclnodejs
let linear=0; //inizializzo le due variabili a zero,
let angular=0; //la prima è la velocità lineare, la seconda l'angolare
let mapmsg=0;
let batterypercentage=-1;

const { exec } = require('child_process'); //richiedo per salvare la mappa

io.on('connection', socket => { //quando avviene una connessione, ascolto solo per due eventi. 
  // Qui non mi interessa verificare room del socket perché essendo solo su Localhost solo il client guidato da puppeteer può connettersi.
    socket.on("speedecho", (speedlinear, speedangular) => {
      if(isNaN(speedlinear) || isNaN(speedangular)){
        console.log("input malformato");
      }
      else
      {
       linear = speedlinear, angular = speedangular;
      console.log("linear: %s, angular: %s", linear, angular);
      }
    });
    
    socket.on("savemapecho", () => {
      exec('ros2 run nav2_map_server map_saver_cli -f '+process.env.SAVE_MAP_NAMEANDPATH+' -t '+process.env.COSTMAP_TOPIC_NAME+' --ros-args --enclave '+process.env.SROS2_MAP_SAVER_ENCLAVE, (err, stdout, stderr) => {
  	if (err) {     //invio errore al client 
 	   socket.emit("savemapres_sendserver", "Qualcosa è andato storto!");   
 	 } //essendo processo child condivide variabili sros2 del padre
  	else {    // il risultato    
  	   socket.emit("savemapres_sendserver", "Mappa salvata con successo!");     
 	 } 
	});
    });
    
   setInterval(function () {
        socket.emit('mapsendserver', mapmsg);
}, 100);

   setInterval(function () {
        socket.emit('batterysendserver', batterypercentage);
}, 10000); //ogni 10 secondi perchè è inutile inviarlo in continuazione

    socket.on("disconnect", () => { //se puppeteer si chiude setto a zero le speed e fermo il robot
    linear=0;
    angular=0;
    });


});

//rclnodejs e comunicazione con ros2

const rclnodejs = require('rclnodejs'); // modulo per creare nodo ros2 e comunicare con sistema ros
const argv=['--ros-args', '--enclave', process.env.SROS2_RCLNODE_ENCLAVE_PATH]; //DA ABILITARE PER SROS2
rclnodejs.init(rclnodejs.Context.defaultContext(), argv).then(() => { 
  const node = rclnodejs.createNode('rclnodemain'); //nodo chiamato rclnodemain
  const publisher = node.createPublisher(process.env.TELEOP_TYPE_MSG, process.env.TELEOP_TOPIC_NAME); //creo il publisher con tipo messaggio / nome topic
  setInterval(function () { // periodicamente eseguo questa funzione
  publisher.publish({ //pubblico questo messaggio, composto da questi parametri
     linear: {
     	x : linear, //valore passato dal client con comandi teleop
     	y : 0.0,
     	z : 0.0
     },
     angular: {
     	x : 0.0,
     	y : 0.0,
     	z : angular //valore passato dal client con comandi teleop
     }
  });
  }, 25); //provare 25, dovrebbe essere più reattivo
  
  const subscribermap = node.createSubscription(process.env.COSTMAP_TYPE_MSG, process.env.COSTMAP_TOPIC_NAME, (map) => {
    mapmsg=map;
    });
  
  const subscriberbattery = node.createSubscription(process.env.BATTERY_TYPE_MSG, process.env.BATTERY_TOPIC_NAME, (battery) => {
    batterypercentage = Math.floor(battery.percentage);
    });
  
  rclnodejs.spin(node); //spin continuo, serve solo se inserisco un subscriber nel codice!
  
});

const reader = require("readline-sync"); //ottengo nome user e password da linea di comando in maniera sincrona
///////// Parte di puppeteer per l'headless browser
const puppeteer = require ('puppeteer'); //modulo per l'headless browser

(async () => {
  const browser = await puppeteer.launch({  //lancio puppeteer con argomenti
   headless: true,      //per testing
   args: [
   '--use-fake-ui-for-media-stream', //accetta in automatico di inviare stream cam
   //'--use-fake-device-for-media-stream',  //per testing
   '--ignore-certificate-errors', //solo per test, ignora i certificati di sicurezza self signed.
   //'enable-features=BlockInsecurePrivateNetworkRequests' //se non funziona quella sotto provare questa
   '--disable-features=BlockInsecurePrivateNetworkRequests' //per eliminare problemi di accesso a localhost che potrebbero comparire in futuro
   ]
  });
  const page = await browser.newPage(); //apro una nuova pagina del browser
  
  page.on('console', message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`));
  page.on('pageerror', ({ message }) => console.log(message));
  page.on('requestfailed', request => console.log(`${request.failure().errorText} ${request.url()}`));

  await page.goto(process.env.SERVER_LOGIN_PAGE); //vado alla pagina del robot teleop che contiene webrtc e inizio
  do {
    console.log('Inserisci username e password del robot.');
    await page.type('#username', reader.question("Username: ",{ hideEchoBack: true }));  //inserisco username nel input tag con id #username
    await page.type('#password', reader.question("Password: ",{ hideEchoBack: true })); //inserisco password nel input tag con id #password
    await Promise.all([ //aspetto che una volta premuto il pulsante di login venga redirezionato
    page.click('#buttonlogin'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);
  } while (await page.$('#loginerror') !== null);
  console.log("Auth Ok");
  //await browser.close();
})();
