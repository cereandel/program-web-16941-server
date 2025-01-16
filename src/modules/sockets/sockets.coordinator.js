const socketIO = require("socket.io");
const logger = require("../../utils/logger");

let socketServer = null;
let players = [];
const context = "Socket Coordinator"

async function SocketServer(server) {
    const io = socketIO(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            transports: ['websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling','polling']
        }
    });
    socketServer = io;
    
    io.on("connection", (socket) => {
        logger.info(`[${context}] New connection stablished`);

        socket.on("connect-user", (username) => {  
            let newUser = true;
            logger.info("Connecting user.....");
            logger.debug(`username send: ${username}`);
            if (!username || username === "") {
                logger.error("username invalid");
                socket.emit("error", "username invalid");
                return;
            }
            for (const player of players) {
                if (player.id === socket.id) {
                    player.username = username;
                    newUser = false;
                    break;
                }
                if (player.username === username) {
                    logger.error("username in use");
                    socket.emit("error", "username in use");
                    return;
                }
            }
            if (newUser)
                players.push({
                    id: socket.id,
                    username: username
                })
            logger.info("Connect succesfull");
            logger.debug(`Users connected: ${players.length}`)
            socket.emit("confirm", "OK")
        });
    });

};

module.exports = SocketServer;