let robotls = document.getElementById('robotlist').innerText;
let array = robotls.split(","); //separo i vari elementi
     
for (let i = 0; i < array.length; i++) {
  let buttonEl = document.createElement("a"); //per ogni elemento creo link
  let url='/teleop/'+array[i];
  buttonEl.href = url;
  let buttonTextEl = document.createElement("span");
  buttonTextEl.className = "listarobotbutton";
  buttonTextEl.innerText = array[i];
  buttonEl.appendChild(buttonTextEl);
  document.getElementById("listarobot").appendChild(buttonEl);
  document.getElementById("listarobot").appendChild(document.createElement("br"));
}