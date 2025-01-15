const app = require("./app/server");
const logger = require("./utils/logger")
const socketServer = require("./modules/sockets/sockets.coordinator");

const http = require("http");

const httpServer = http.createServer(app);

socketServer(httpServer);

httpServer.listen(app.get("port"), "0.0.0.0", () => {
    logger.silly(`Server running - Port ${app.get("port")}`)
});