const shipsData = require("./ships");
const coordinates = require("./coordinates");

function getShipSpaces(shipId) {
    for (ship of shipsData)
        if (shipId === ship) return ship.spaces;
    return 0;
}

function shipExists(shipId) {
    for (ship of shipsData)
        if (shipId === ship) return true;
    return false;
}

function shipUsed(shipId, ships) {
    for (id of ships)
        if (shipId === id) return true;
    return false;
}

function getHorizontalCoordinate(coordinate) {
    for (let hCoordinate of coordinates.hCoordinates) {
        if (coordinate === hCoordinate.character) return hCoordinate.value
    }
    throw new Error("Wrong Coordinate");
}

function getVerticalCoordinate(coordinate) {
    for (let vCoordinate of coordinates.vCoordinates) {
        if (coordinate === vCoordinate.character) return vCoordinate.value
    }
    throw new Error("Wrong Coordinate");
}

class gameBoard {
    #players;
    #turn;
    #maximumPlayers;
    #inPlay;

    constructor() {
        this.#players = [];
        this.#turn = -1;
        this.#maximumPlayers = 2;
        this.#inPlay = false;
    }

    addPlayer(username, ships) {
        if (this.#players.length === this.#maximumPlayers) 
            throw new Error("Full Game");
        if (this.#inPlay)
            throw new Error("Game in progress");
        if (ships.length !== 5)
            throw new Error("Ships imcomplete");
        let board = new Array(10).fill(new Array(10).fill(0));
        let shipsUsed = [];
        for (let ship of ships) {
            if (!shipExists(ship.id))
                throw new Error("Ship does not exist");
            if (shipUsed(ship.id, shipsUsed)) 
                throw new Error("Repeated ships");
            let hCoordinate = getHorizontalCoordinate(ship.position.charAt(0));
            let vCoordinate = getVerticalCoordinate(ship.position.slice(1));
            for (let i = 0; i < getShipSpaces(ship.id); i++) {
                board[hCoordinate][vCoordinate] = ship.id;
                if (ship.vertical)
                    hCoordinate++;
                else
                    vCoordinate++;
                if(hCoordinate >= 10 || vCoordinate >= 10)
                    throw new Error("Ships in invalid position");
            }
            shipsUsed.push(ship.id);
        }
        this.#players.push({
            username,
            board
        });
        if (this.#players.length === this.#maximumPlayers)
            return true;
        return false;
    }

    maximumPlayers() {
        if (this.#players.length === this.#maximumPlayers) 
            return true
        return false;
    }

    begin() {
        if (this.#players.length < 2) 
            throw new Error("There are not enough players");

        this.#turn = 0;
        this.#inPlay = true;
    }

    getPlayers() {
        return this.#players;
    }

    gameInPlay() {
        return this.#inPlay;
    }
}

module.exports = gameBoard;