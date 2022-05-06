const roomna = document.getElementById('roomname').innerText;
let turnusernameapi, turnpasswordapi;

const stunurl = document.getElementById('stun_url').innerText;
const turnurl = document.getElementById('turn_url').innerText;
const turnuser = document.getElementById('turn_username').innerText;
const turnpass = document.getElementById('turn_password').innerText;

let peerConnection;

const socket = io.connect();
const video = document.querySelector("video");
const enableAudioButton = document.querySelector("#enable-audio");

enableAudioButton.addEventListener("click", enableAudio) //evento per attivare lo stream di audio

socket.on("connect", () => {
  socket.emit('room', roomna);

  ///// TURN credenziali REST API
  socket.on("turncredentials", (username, password) => {
     turnusernameapi = username;
     turnpasswordapi = password;
  })
  /////

  socket.emit("watcher"); //per webrtc
});

//quando avviene un'offerta da parte del server
socket.on("offer", (id, description) => {
  
  const config = {
  iceServers: [
      { 
        "urls": stunurl,
      },
      //scommenta uno solo delle due, usa la prima per test funzionamento tuo turn server, poi la seconda
    // { //configurato da process env, credenziali a lungo termine
    //   "urls": turnurl,
    //   "username": turnuser,
    //   "credential": turnpass
    // },
    // { //configurato con TURN REST API, sicuro
    //   "urls": turnurl,
    //   "username": turnusernameapi,
    //   "credential": turnpasswordapi
    // }
  ]
  };

  peerConnection = new RTCPeerConnection(config); //creo nuova connessione RTC usando le config sopra
  
  //on negotiation needed si usa solo se la connessione è già creata ed è stable
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer()) //uso createAnswer per inviare una risposta di conferma alla request del broadcaster
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription); //invio effettivo
    });

  peerConnection.ontrack = event => { //con l'evento ontrack ottengo il video stream (l'oggetto peerConnection possiede un ontrack event listener)
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
  document.getElementById('waitingconn').style.display="none";
});


socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("broadcaster", () => {
  socket.emit("watcher");
});

socket.on('disconnect', function(){
    document.getElementById('waitingconn').innerHTML="Robot non online o altro utente connesso! Ricarica la pagina Web!";
});

window.onunload = window.onbeforeunload = () => { // se chiudo pagina web chiude connessione peer
  socket.close();
  peerConnection.close();
};

function enableAudio() { //funzione per abilitare l'audio
  console.log("Enabling audio")
  video.muted = false;
}
