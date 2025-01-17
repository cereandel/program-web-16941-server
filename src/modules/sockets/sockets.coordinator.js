const socketIO = require("socket.io");
const logger = require("../../utils/logger");
const battleship = require("../battleship/battleshipServer");

let socketServer = null;
let players = [];
let games = [];
const context = "Socket Coordinator"

function getSocketIdByUsername(username) {
    for (const player of players) {
        if (player.username === username)
            return player.id
    }
}

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

        socket.on("begin", (payload) => {
            try {
                let gameFind = false;
                logger.info("Searching game...");
                logger.debug(`payload: ${payload}`);
                for (const game of games) {
                    if (!game.gameInPlay()) {
                        logger.info("Found game");
                        game.addPlayer(payload.username, payload.ships);
                        gameFind = true;
                        const gamePlayers = game.getPlayers();
                        const player1 = getSocketIdByUsername(gamePlayers[0].username);
                        const player2 = getSocketIdByUsername(gamePlayers[1].username);
                        logger.debug(`player1: ${gamePlayers[0].username} - player2: ${gamePlayers[1].username}`)
                        io.to(player1).emit("game-found", {
                            oponnent: gamePlayers[1].username
                        });
                        io.to(player2).emit("game-found", {
                            oponnent: gamePlayers[0].username
                        });
                        io.to(player1).emit("turn", {
                            turn: gamePlayers[0].username
                        });
                        io.to(player1).emit("turn", {
                            turn: gamePlayers[0].username
                        });
                    }
                }
                if (!gameFind) {
                    logger.info("Creating game...");
                    const board = new battleship();
                    board.addPlayer(payload.username, payload.ships);
                    games.push(board);
                }
            } catch (error) {
                logger.error(error);
                socket.emit("error", error);
            }
        });

        socket.on("play", (payload) => {

        })
    });

};

module.exports = SocketServer;