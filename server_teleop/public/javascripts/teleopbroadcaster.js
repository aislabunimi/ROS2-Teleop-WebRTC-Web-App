const robot_port = document.getElementById('robotport').innerText;

const socketecho = io.connect(robot_port);
socket.on("speedsendrobot", (linear, angular) => {
  socketecho.emit("speedecho", linear, angular);
});

socket.on("savemapsendrobot", () => {
  socketecho.emit("savemapecho");
});

socketecho.on("mapsendserver", (map) => {
  socket.emit("map", map);
});

socketecho.on("savemapres_sendserver", (res) => {
  socket.emit("savemapres", res);
});

socketecho.on("batterysendserver", (percentage, status) => {
  socket.emit("battery", percentage);
});

window.onunload = window.onbeforeunload = () => {
  socketecho.close();
};
