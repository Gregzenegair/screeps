require('object.extension')();

var helperCreep = {

    moveTo: function (creep, target, ignoreCreeps) { // should be into an helper class

        if (null == creep.memory.previousPosX || null == creep.memory.previousPosY) {
            creep.memory.previousPosX = -1;
            creep.memory.previousPosY = -1;
        }

        if (null == ignoreCreeps || creep.memory.alternativePath) {
            ignoreCreeps = false;
        }

        var moveResult = creep.moveTo(target, {
            reusePath: 16,
            visualizePathStyle: {stroke: '#fffd00'},
            ignoreCreeps: ignoreCreeps
        });

        var didMove = true;
        if (creep.memory.previousPosX == creep.pos.x && creep.memory.previousPosY == creep.pos.y) {
            didMove = false;
        }

        creep.memory.previousPosX = creep.pos.x;
        creep.memory.previousPosY = creep.pos.y;

        if (moveResult === ERR_NO_PATH || !didMove) {
            creep.memory.errorPathCount++;
            if (creep.memory.errorPathCount > 3) {
                creep.memory.errorPathCount = 0;
                creep.memory.alternativePath = true;
            }
        } else {
            creep.memory.alternativePath = false;
        }

        return moveResult;
    },

    moveToAnOtherRoom: function (creep, targetRoom) {
        var exit;

        if (null == targetRoom) {
            return null;
        }

        if (null != creep.memory.previousRoomName && creep.room.name != creep.memory.previousRoomName) {
            creep.memory.targetRoomExit = null;
            creep.say("New Room");
            return -9999;
        }

        if (null == creep.memory.targetRoomExit) {
            var exitDir = Game.map.findExit(creep.room, targetRoom);
            exit = creep.pos.findClosestByRange(exitDir);
            creep.memory.targetRoomExit = exit;
        } else {
            exit = new RoomPosition(creep.memory.targetRoomExit.x, creep.memory.targetRoomExit.y, creep.memory.targetRoomExit.roomName);
        }

        var moveExit = null;
        if (null != exit) {
            moveExit = creep.moveTo(exit, {
                reusePath: 64,
                visualizePathStyle: {stroke: '#4462ac'}
            });

        }
        creep.memory.previousRoomName = creep.room.name;
        return moveExit;
    },

    /** @param {Creep} creep **/
    findNearest: function (creep, endPositions) {
        var targeted = creep.pos.findClosestByRange(endPositions);
        return targeted;
    },

    /** @param {Creep} creep **/
    moveRandomly: function (creep, range) {
        var newPosX;
        var newPosY;
        if (null == creep.memory.moveToRandomly) {
            newPosX = creep.pos.x + Math.round(Math.random() * range) - range / 2;
            newPosY = creep.pos.y + Math.round(Math.random() * range) - range / 2;
            newPosX = newPosX < 0 ? 0 : newPosX;
            newPosY = newPosY < 0 ? 0 : newPosY;
            newPosX = newPosX > 49 ? 49 : newPosX;
            newPosY = newPosY > 49 ? 49 : newPosY;

            creep.memory.moveToRandomly = {};
            creep.memory.moveToRandomly.x = newPosX;
            creep.memory.moveToRandomly.y = newPosY;
        } else {
            newPosX = creep.memory.moveToRandomly.x;
            newPosY = creep.memory.moveToRandomly.y;
        }
        creep.moveTo(newPosX, newPosY, {reusePath: 32, visualizePathStyle: {stroke: '#ffffff'}});

        if (creep.pos.x === newPosX && creep.pos.y === newPosY) {
            creep.memory.moveToRandomly = null;
        }
    },

    findMinerHarvestSource: function (creep) {
        var target = null;
        var energySourceType = null;

        energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
        var targets = [];
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            targets = targets.concat(room.find(FIND_SOURCES, {
                filter: function (source) {

                    for (var i = 0; i < Memory.miners.length; i++) {

                    }

                    return source.energy > 0;
                }
            }));
        }

        for (var i = 0; i < targets.length; i++) {
            target = targets[i];
            // ensure we seek in the same room and the path to move to is ok
            if (creep.room.name === target.room.name &&
                    helperCreep.moveTo(creep, target) == OK) {
                break;
            } else {
                target = null;
            }
        }

        // seek into other rooms
        if (null == target) {
            var exits = Game.map.describeExits(creep.room.name);
            for (var name in exits) {
                var otherRoom = Game.rooms[exits[name]];
                if (otherRoom) {
                    energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
                    target = otherRoom.find(FIND_SOURCES, {
                        filter: function (source) {
                            return source.energy > 0;
                        }
                    });
                }
                if (target && target.length > 0) {
                    target = target[0];
                    break;
                }
            }
            console.log("source target external room SOURCE=" + target);
        }

        if (null == target) {
            return null;
        }

        return {"target": target, "energySourceType": energySourceType};
    },

    /**
     * 
     * @param {type} creep
     * @param {type} options options is an object containing wantedRooms array and unwatedRooms array
     * which represent rooms to go preferably and to avoid, if can't match, move randomly
     * @returns {@var;exitRoom}
     */
    moveRandomExitRoom: function (creep, options) {

        if (creep.memory.randomExitRoom === creep.room.name) {
            creep.memory.randomExitRoom = null;
            return;
        }

        var wantedRooms = [];
        var unwantedRooms = [];
        if (null != options) {
            if (null != options.wantedRooms) {
                wantedRooms = options.wantedRooms;
            }
            if (null != options.unwantedRooms) {
                unwantedRooms = options.unwantedRooms;
            }
        }

        var exitRoom;

        exitRoom = this.selectRandomWantedRoom(creep, wantedRooms);
        if (null == exitRoom) {
            exitRoom = this.randomNotSelectUnwantedRoom(creep, unwantedRooms);
        }
        if (null == exitRoom) { // should be useless to call this
            exitRoom = this.selectRandomRoom(creep);
        }
//TODO : factorise unreachable rooms to other move rooms methods
        var roomFromTo = {};
        roomFromTo.from = creep.room.name;

        if (null == Memory.unreachableRooms) {
            Memory.unreachableRooms = [];
        }

        if (null == creep.memory.randomExitRoom) {
            roomFromTo.to = exitRoom;
            if (null != exitRoom && Game.map.isRoomAvailable(exitRoom) && Memory.unreachableRooms.indexOf(roomFromTo) === -1) {
                creep.memory.randomExitRoom = exitRoom;
            } else {
                creep.memory.randomExitRoom = null;
            }
        }

        var moveExit;
        if (null != creep.memory.randomExitRoom) {

            moveExit = this.moveToAnOtherRoom(creep, creep.memory.randomExitRoom);

            if (moveExit === ERR_NO_PATH || moveExit === ERR_INVALID_TARGET) {
                console.log("No path found for room " + moveExit + " re-init target exitRoom");
                if (Memory.unreachableRooms.indexOf(roomFromTo) === -1) {
                    Memory.unreachableRooms.push(roomFromTo);
                }
                creep.memory.randomExitRoom = null;
            }
        }
        return moveExit; // returns movement result
    },

    selectRandomRoom: function (creep) {
        var exitRoom = null;
        var index = 0;
        var exits = Game.map.describeExits(creep.room.name);
        var exitCount = Object.keys(exits).length;
        var randomSelected = Math.myRandom(0, exitCount - 1);
        for (var roomKey in exits) {
            if (randomSelected === index && creep.room.name != exits[roomKey]) {
                exitRoom = exits[roomKey];
                break;
            }
            index++;
        }
        return exitRoom;
    },

    selectRandomWantedRoom: function (creep, rooms) {
        var exitRoom = null;
        if (null != rooms && rooms.length > 0) {
            var index = 0;
            var randomSelected = Math.myRandom(0, rooms.length - 1);
            var exits = Game.map.describeExits(creep.room.name);
            for (var roomKey in exits) {
                if (randomSelected === index && creep.room.name != exits[roomKey]) {
                    exitRoom = exits[roomKey];
                    break;
                }
                index++;
            }
        }
        return exitRoom;
    },

    randomNotSelectUnwantedRoom: function (creep, rooms) {
        var exitRoom = null;

        if (null != rooms && rooms.length > 0) {
            var index = 0;
            var exits = Game.map.describeExits(creep.room.name);
            var exitCount = Object.keys(exits).length;
            var randomSelected = Math.myRandom(0, exitCount - 1);
            for (var roomKey in exits) {
                if (rooms.indexOf(exits[roomKey]) === -1
                        && randomSelected === index
                        && creep.room.name != exits[roomKey]) {
                    exitRoom = exits[roomKey];
                    break;
                }
                index++;
            }
            index = 0;
            if (null == exitRoom) {
                for (var roomKey in exits) {
                    if (rooms.indexOf(exits[roomKey]) === -1) { // takes the first valid, not really random
                        exitRoom = exits[roomKey];
                        break;
                    }
                    index++;
                }
            }
        }
        return exitRoom;
    },

    initMoveToRoomAssigned: function (creep) {
        if (creep.room.name != creep.memory.roomAssigned && !creep.memory.roomAssignedReached) {
            creep.say("Go Assigned");
            helperCreep.moveToAnOtherRoom(creep, creep.memory.roomAssigned);
        } else if (!creep.memory.roomAssignedReached) {
            creep.memory.roomAssignedReached = true;
        }
    }

};

module.exports = helperCreep;