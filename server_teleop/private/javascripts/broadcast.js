const roomna = document.getElementById('roomname').innerText;
let turnusernameapi, turnpasswordapi;

const stunurl = document.getElementById('stun_url').innerText;
const turnurl = document.getElementById('turn_url').innerText;
const turnuser = document.getElementById('turn_username').innerText;
const turnpass = document.getElementById('turn_password').innerText;

const peerConnections = {};

const socket = io.connect();
socket.on("connect", () => {
  socket.emit('room', roomna);
  ///// TURN credenziali REST API
  socket.on("turncredentials", (username, password) => {
     turnusernameapi = username;
     turnpasswordapi = password;
  })
  /////
});

socket.on("answer", (id, description) => { //quando client conferma imposto descrizione
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => { //quando avviene l'evento watcher avviato dall'utente connesso al sito
  
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

  const peerConnection = new RTCPeerConnection(config); //creo una nuova connessione RTC usando le config sopra

  peerConnections[id] = peerConnection; //salvo la nuova connessione creata nell'oggetto Peerconnections che mantiene tutte le connessioni attive

  let stream = videoElement.srcObject; //prendo sorgente video
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream)); //usando addTrack() aggiungo lo stream locale alla connessione 

  //l'evento ontrack non serve gestirlo perchè lui è il robot e non deve ricevere alcun video

  peerConnection.onicecandidate = event => { //quando ricevo una configurazione corretta ICE la mando al mio server
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

 //on negotiation needed si usa solo se la connessione è già creata ed è stable
  peerConnection
    .createOffer() //invio al client un'offerta di connessione
    .then(sdp => peerConnection.setLocalDescription(sdp)) //utilizzo il metodo setLocalDescription per configurare la connessione
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription); //invio offerta
    });
   
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => { //quando il client si disconnette chiudo la connessione in questo modo
  socketecho.emit("speedecho", 0, 0); //se utente chiude la pagina fermo robot dove è
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => { //chiudo la connessione anche quando viene chiuso il browser (cioè interrompo il server in questo caso)
  socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream()
  .then(getDevices) //queste servono solo per farmi scegliere il device dove streammare
  .then(gotDevices);

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  const constraints = { //configuro la camera
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  };
  return navigator.mediaDevices
    .getUserMedia(constraints) //prendo il video dalla camera
    .then(gotStream) //quando ho preso il video dalla camera, emetto evento broadcaster
    .catch(handleError);
}

function gotStream(stream) { //funzione usata per quando prendo lo stream
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );
  videoElement.srcObject = stream;
  socket.emit("broadcaster");
}

function handleError(error) {
  console.error("Error: ", error);
}
