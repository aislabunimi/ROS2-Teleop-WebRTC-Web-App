teleopkey(); //per la tastiera
createJoystick(); //creo nipplejs e suo joystick
teleopgamepad(); //per il gamepad

////////////////////////////////////
//PARTE DI TELEOP KEYBOARD
function teleopkey(){
let    linear_speed = 0, //i valori di speed che invierò a rclnodejs, qui sono inizializzati
    angular_speed = 0; //incrementa valore per aumentare velocità, o diminuisci per diminuirla
let speedlimiter = document.getElementById('speedlimiter').innerText;
document.addEventListener('keydown',press);
document.addEventListener('keyup',release);

function press(e){
  if (e.keyCode === 38 || e.keyCode === 87){ //freccia su e tasto w
    move('up');
  }
  if (e.keyCode === 39 || e.keyCode === 68){ //freccia destra e tasto d
    move('right');
  }
  if (e.keyCode === 40 || e.keyCode === 83){ //freccia giù e tasto s
    move('down');
  }
  if (e.keyCode === 37 || e.keyCode === 65){ //freccia sinistra e tasto a
    move('left');
  }
}

function release(e){
  if (e.keyCode === 38 || e.keyCode === 87){ //freccia su e tasto w
    stop('linear');
  }
  if (e.keyCode === 39 || e.keyCode === 68){ //freccia destra e tasto d
    stop('angular');
  }
  if (e.keyCode === 40 || e.keyCode === 83){ //freccia giù e tasto s
    stop('linear');
  }
  if (e.keyCode === 37 || e.keyCode === 65){ //freccia sinistra e tasto a
    stop('angular');
  }
}

function move(keypressed){ //i valori 1 e 0.35 derivano da quelli ottimali di nipplejs
    if(keypressed==='up'){ //cioè quelli massimi che invio
      linear_speed=speedlimiter;//metri al secondo semplice
    }
    if(keypressed==='left'){
      angular_speed=speedlimiter; //metri al secondo semplice
    }
    if(keypressed==='down'){ //right e down con segno meno
      linear_speed=-speedlimiter;
    }
    if(keypressed==='right'){
      angular_speed=-speedlimiter; //metri al secondo semplice
    } 
    socket.emit("speed", linear_speed, angular_speed);  
}

function stop(speed){
   if(speed==='linear'){ //devo fermare solo la velocità lineare o angolare, in base al tasto che ho rilasciato
    linear_speed=0; //non posso semplicimente mettere a zero entrambe altrimenti non è corretto
   }
   if(speed==='angular'){ 
    angular_speed=0;
   }
   socket.emit("speed", linear_speed, angular_speed);  
}
}
////////////////////////////////////

////////////////////////////////////
//PARTE DI TELEOP GAMEPAD
function teleopgamepad(){
  let    linear_speed = 0, //i valori di speed che invierò a rclnodejs, qui sono inizializzati
    angular_speed = 0; //incrementa valore per aumentare velocità, o diminuisci per diminuirla
let speedlimiter = document.getElementById('speedlimiter').innerText;
let gamepadIndex;
window.addEventListener('gamepadconnected', (event) => {
    gamepadIndex = event.gamepad.index;
});
let waitforinput=false;

setInterval(() => {
    if(gamepadIndex !== undefined) {
        // gamepad connesso con suo index //testato funzionamento con controller xbox360 e ps5, per estensione dovrebbe andare con tutti
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if(gamepad.buttons[12].pressed==true){ //12 è il pad direzionale su
          linear_speed=speedlimiter;
          waitforinput=false;
        }
        if(gamepad.buttons[13].pressed==true){ //13 è il pad direzionale giù
           linear_speed=-speedlimiter;
           waitforinput=false;
        }
        if(gamepad.buttons[14].pressed==true){ //14 è il pad direzionale sinistra
          angular_speed=speedlimiter;
          waitforinput=false;
        }
        if(gamepad.buttons[15].pressed==true){ //15 è il pad direzionale destra
          angular_speed=-speedlimiter;
          waitforinput=false;
        }
        if(gamepad.buttons[12].pressed==false && gamepad.buttons[13].pressed==false){ 
          linear_speed=0;
        }
        if(gamepad.buttons[14].pressed==false && gamepad.buttons[15].pressed==false){ 
          angular_speed=0;
        }
    
        //0.02 serve per ignorare il leggero drift dello stick dovuto al fatto che è analogico, è come una deadzone
         //asse x dello stick destro
          if(gamepad.axes[2]>0.02){ //se > 0 sto muovendo stick verso destra
            angular_speed=-gamepad.axes[2]*speedlimiter; 
            waitforinput=false;
          }
          if(gamepad.axes[2]<-0.02){ //se < 0 sto muovendo stick verso sinistra
            angular_speed=-gamepad.axes[2]*speedlimiter; //il meno serve per avere valori corretti con evento 
            waitforinput=false;
          }
        //asse y dello stick destro
          if(gamepad.axes[3]>0.02){ //se > 0 sto muovendo stick verso giù
            linear_speed=-gamepad.axes[3]*speedlimiter; //lo / 3 qui non ne ho bisogno
            waitforinput=false;
          }
          if(gamepad.axes[3]<-0.02){ //se < 0 sto muovendo stick verso sopra
            linear_speed=-gamepad.axes[3]*speedlimiter;
            waitforinput=false;
          }
          /* non serve, perché se smetto di usarli interviene già il pressed false a impostare a zero il tutto
          if(gamepad.axes[2]==0){ 
          angular_speed=0;
          }

          if(gamepad.axes[3]==0){ 
          linear_speed=0;
          }
          */

          if(waitforinput==false){
            socket.emit("speed", linear_speed, angular_speed);
            if(linear_speed==0 && angular_speed==0){ //waitforinput serve perché cosi
              waitforinput=true; //quando si sa che la speed è 0 anziché continuare a emettere nel socket
            }//smetto di emettere fino a nuovo input
          }
       
    }
}, 25)
}

////////////////////////////////////

////////////////////////////////////
//PARTE DI NIPPLEJS
 function createJoystick() { //funzione che crea il joystick
      let options = { //tutte le opzioni
        zone: document.getElementById('zone_joystick'), //div dove posizionarlo
        threshold: 0.1,
        position: { left: '50%', bottom: '0%'}, //posizione css
        mode: 'static', //da lasciare static
        size: 150, //dimensione analogico
        color: '#ff2919', //colore
      };
      manager = nipplejs.create(options); //manager è la variabile che contiene l'analogico creato con quelle opzioni

      let linear_speed = 0, angular_speed = 0; //i valori di speed che invierò a rclnodejs, qui sono inizializzati
      const max_linear = document.getElementById('max_linear').innerText; // valori massimi che userò  // m/s     
      const max_angular = document.getElementById('max_angular').innerText; // rad/s
      const max_distance = document.getElementById('max_distance').innerText; // pixels; //incrementa per rendere più duro l'analogico, decrementa per renderlo più sensibile

      manager.on('start', function (event, nipple) { //start è il metodo che si occupa di quando inizio a muovere l'analogico
 	 timer = setInterval(function () {
    	 	socket.emit("speed", linear_speed, angular_speed);  
 	 }, 25); //timer
      });

      manager.on('end', function () { //end è il metodo di quando smetto di muovere l'analogico
  	if (timer) { //quando smetto elimino il timer
   	 clearInterval(timer);
        }
      linear_speed=0, angular_speed=0; //importante inviare i valori 0, perché cmd_vel come topic tiene in memoria
      socket.emit("speed", linear_speed, angular_speed);  //ultimo valore ricevuto, se non lo faccio continuerebbe a muoversi!
      });

      manager.on('move', function (event, nipple) { //quando sto muovendo l'analogico
  	linear_speed = Math.sin(nipple.angle.radian) * max_linear * nipple.distance/max_distance; //invio valore di speed
  	angular_speed = -Math.cos(nipple.angle.radian) * max_angular * nipple.distance/max_distance;
      });
}
///////////////////////////////////
