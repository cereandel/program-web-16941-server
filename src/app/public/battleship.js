const socket = io();
const btnConnect = document.getElementById("connect-btn");
const playConnect = document.getElementById("play-btn");
const usernameInput = document.getElementById("username-input");

btnConnect.addEventListener("click", () => {
    socket.emit("connect-user", usernameInput.value);
});

socket.on("error", (resp) => {
    alert(resp);
})

socket.on("confirm", (resp) => {
    alert(resp);
});