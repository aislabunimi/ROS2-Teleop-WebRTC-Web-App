////////////////////////////////
//PARTE PER LA BATTERIA

socket.on('batteryecho', (percentage, status) => {
 if(percentage==-1){
  document.getElementById('batterypercentage').innerHTML='Batteria rimanente: Sconosciuta';
 }
 else{
  document.getElementById('batterypercentage').innerHTML='Batteria rimanente: '+percentage+'%';
 }
});
///////////////////////////////

///////////////////////////////
//PARTE PER SALVARE LA MAPPA
document.getElementById("savebutton").addEventListener("click", reqsavemap);

function reqsavemap(){
  socket.emit('savemap');
  document.getElementById('savemapresult').style.display="block";
  document.getElementById('savemapresult').innerHTML="Salvataggio mappa in corso...";
}

socket.on('savemapresecho', (res) => {
    document.getElementById('savemapresult').innerHTML=res;
});
///////////////////////////////

let scaleFactor=10;

socket.on('mapecho', (imgMes) => {
if(imgMes!=0){
document.getElementById('waitingmap').style.display="none";
scaleFactor = document.getElementById("scalefactor").value;
let can = document.getElementById("mapimage");
can.width = imgMes.info.width/4; //diviso 4 se no ne stampa 4
can.height = imgMes.info.height/4;
const ctx = can.getContext("2d");

let palette = ctx.getImageData(0,0,imgMes.info.width,imgMes.info.height); 

palette.data.set(new Uint8ClampedArray(imgMes.data)); 

ctx.putImageData(palette,0,0);

let scaledCanvas=document.getElementById("scaledmap");
let scaledContext=scaledCanvas.getContext('2d');
scaledCanvas.width=can.width*scaleFactor;
scaledCanvas.height=can.height*scaleFactor;
scaledContext.scale(scaleFactor, scaleFactor);
scaledContext.drawImage(can,0,0);
}
else{
  document.getElementById('waitingmap').innerHTML="Mappa non disponibile";
  document.getElementById("scaledmap").style.display="none";
  document.getElementById("savebutton").style.display="none";
  document.getElementById("scalefactor").style.display="none";
  document.getElementById("scalinginstructions").style.display="none";
}
});