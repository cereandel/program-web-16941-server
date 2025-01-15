const socket = io();
const btnConnect = document.getElementById("connect-btn");
const playConnect = document.getElementById("play-btn");

btnConnect.addEventListener("click", () => {
    socket.emit("start", {});
});