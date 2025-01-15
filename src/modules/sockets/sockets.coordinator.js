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
        players.push({
            id: socket.id
        });

        socket.on("start", (payload) => {    
            logger.silly(`${socket.id}`)
            logger.info("Hola mundo!")
        });
    });

};

module.exports = SocketServer;