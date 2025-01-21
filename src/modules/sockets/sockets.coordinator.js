const socketIO = require("socket.io");
const logger = require("../../utils/logger");
const battleship = require("../battleship/battleshipServer");

var numeroPartida = 0;
let players = [];
/* Estructura del objeto player: 
{
    id: ....        --> id del socket de donde se conecto el cliente
    username: ..... --> username del cliente 
}
*/

let games = [];
/* Estructura del objeto game: (CLASE BOARD)
{
    #players [            --> Clientes con su tablero
        username:  ....   --> Usuario del cliente
        board[][]: ....   --> Tablero hecho como una matriz 10x10, dentro de cada casilla ira el id del barco que este detro
    ]:     
    #turn:           .... --> 
    #inPlay:         .... --> 
    #maximumPLayers: .... --> 
    #roomName:       .... -->
}
*/

const context = "Socket Coordinator";

function getSocketIdByUsername(username) {
  for (const player of players) {
    if (player.username === username) return player.id;
  }
}

function getUsernameBySocketId(socketId) {
  for (const player of players) {
    if (player.id === socketId) return player.username;
  }
  return null;
}

async function SocketServer(server) {
  const io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      transports: [
        "websocket",
        "flashsocket",
        "htmlfile",
        "xhr-polling",
        "jsonp-polling",
        "polling",
      ],
    },
  });

  const deletePlayers = (player1, player2) => {
    for (const player of players) {
      if (player.username === player1 || player.username === player2) {
        players.splice(players.indexOf(player), 1);
      }
    }
  };

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
          username: username,
        });
      logger.info("Connect succesfull");
      logger.debug(`Users connected: ${players.length}`);
      socket.emit("confirm", "OK");
    });

    socket.on("begin", (payload) => {
      try {
        let gameFind = false;
        logger.info("Searching game...");
        logger.debug(`payload: ${payload}`);
        for (const game of games) {
          if (!game.gameInPlay()) {
            logger.info("Found game");
            socket.join("game_" + numeroPartida);
            game.addPlayer(payload.username, payload.ships);
            gameFind = true;
            const gamePlayers = game.getPlayers();
            const player1 = getSocketIdByUsername(gamePlayers[0].username);
            const player2 = getSocketIdByUsername(gamePlayers[1].username);
            logger.debug(
              `player1: ${gamePlayers[0].username} - player2: ${gamePlayers[1].username}`
            );
            game.begin();
            io.to(player1).emit("game-found", {
              oponnent: gamePlayers[1].username,
            });
            io.to(player2).emit("game-found", {
              oponnent: gamePlayers[0].username,
            });
            let salaJuego = game.getGameName();
            io.to(salaJuego).emit("turn", {
              turn: gamePlayers[0].username,
            });
            numeroPartida++;
          }
        }
        if (!gameFind) {
          logger.info("Creating game...");
          const board = new battleship();
          board.addPlayer(payload.username, payload.ships);
          board.setGameName("game_" + numeroPartida);
          games.push(board);
          socket.join("game_" + numeroPartida);
        }
      } catch (error) {
        logger.error(error);
        socket.emit("error", error);
      }
    });

    socket.on("disconnect", () => {
      const clientId = socket.id;
      const client = getUsernameBySocketId(clientId);
      logger.info("Desconectado: " + client);
      for (const game of games) {
        const gamePlayers = game.getPlayers();
        logger.info(`gamePlayers: ${JSON.stringify(gamePlayers)}`);
        const player1 = gamePlayers[0].username;
        const player2 = gamePlayers[1].username;

        logger.info(`player1: ${player1} - player2: ${player2}`);

        for (const gamePlayer of gamePlayers) {
          if (gamePlayer.username === client) {
            let salaJuego = game.getGameName();
            io.to(salaJuego).emit("disconnection-finish", {
              winner: player1 === client ? player2 : player1,
            });
            logger.info("eliminando jugadores de la sala");
            deletePlayers(player1, player2);
            socket.disconnect();
            break;
          }
        }
      }
    });

    socket.on("play", (payload) => {
      // Buscamos partida por partida...
      playersGame = [];
      //player = [];
      for (const game of games) {
        // Me traigo los jugadores es esta partida del for...
        const playersGame = game.getPlayers();

        const player1 = playersGame[0].username;
        const player2 = playersGame[1].username;
        // Busco que el jugador que envio el disparo este dentro de esta partida del for...
        const player = playersGame.find((pl) => {
          // Busco en todos los jugadores guardados cual de ellos tiene el id del socket de esta partida
          let client = players.find((cl) => cl.username === pl.username);
          return client && client.id === socket.id;
        });
        // Cuando encuentro la partida del jugador que envio el disparo, procedo a devolver el resultado
        if (player) {
          try {
            const gamePlayers = game.getPlayers();
            // Guarda en result si el jugador que decibio el disparo perdio todos los barcos
            const result = game.makePlay(player.username, payload.position);
            logger.info(`Resultado => [${JSON.stringify(result)}] `);
            /* Estructura de lo que recibe "result"  
                            {
                                username: ...,
                                position: ...,
                                hit:      ...,
                                drown:    ...,
                                finish:   ...
                            } */
            let salaJuego = game.getGameName();
            io.to(salaJuego).emit("play-result", result);
            // Si perdio los barcos, avisa a los clientes
            if (result.finish) {
              io.to(salaJuego).emit("finish", {
                winner: player.username,
              });
              const gamePlayers = game.getPlayers();
              for (const gamePlayer of gamePlayers) {
                const socketId = getSocketIdByUsername(gamePlayer.username);
                const clientSocket = io.sockets.sockets.get(socketId);
                if (clientSocket) {
                  let salaJuego = game.getGameName();
                  clientSocket.leave(salaJuego);
                  deletePlayers(player1, player2);
                }
              }
              break;
            }
            game.nextTurn();
            io.to(salaJuego).emit("turn", {
              turn: gamePlayers[game.getTurn()].username,
            });
          } catch (error) {
            socket.emit("error", error);
          }
        }
      }
    });
  });
}

module.exports = SocketServer;
