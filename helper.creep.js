var helperCreep = {

    moveTo: function (creep, target, ignoreCreeps) { // should be into an helper class

        if (null == ignoreCreeps) {
            ignoreCreeps = false;
        }

        var moveResult = creep.moveTo(target, {
            reusePath: 16,
            visualizePathStyle: {stroke: '#fffd00'},
            ignoreCreeps: ignoreCreeps
        });

        if (moveResult === ERR_NO_PATH) {
            creep.memory.errorPathCount++;
            if (creep.memory.errorPathCount > 3) {
                creep.memory.errorPathCount = 0;
                creep.memory.alternativePath = true;
            }
        }
        return moveResult;
    },

    moveToAnOtherRoom: function (creep, targetRoom) { // should be into an helper class
        var exit;

        if (creep.room.name != creep.memory.previousRoomName) {
            creep.memory.targetRoomExit = null;
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

    moveRandomExitRoom: function (creep) {
        var exits = Game.map.describeExits(creep.room.name);
        var exitCount = Object.keys(exits).length;
        var randomSelected = Math.myRandom(0, exitCount - 1);
        var exitRoom;
        var index = 0;

        var roomFromTo = {};
        roomFromTo.from = creep.room.name;

        if (null == creep.memory.unreachableRooms) {
            creep.memory.unreachableRooms = [];
        }

        if (null == exitRoom && null == creep.memory.exitRoom) {
            for (var roomKey in exits) {
                if (randomSelected === index) {
                    exitRoom = exits[roomKey];
                    break;
                }
                index++;
            }

            roomFromTo.to = exitRoom;
            if (null != exitRoom && Game.map.isRoomAvailable(exitRoom) && creep.memory.unreachableRooms.indexOf(roomFromTo) === -1) {
                creep.memory.exitRoom = exitRoom;
            } else {
                creep.memory.exitRoom = null;
            }
        }

        if (null != creep.memory.exitRoom) {

            var moveExit = this.moveToAnOtherRoom(creep, creep.memory.exitRoom);

            if (moveExit === ERR_NO_PATH || moveExit === ERR_INVALID_TARGET) {
                console.log("No path found for room " + moveExit + " re-init target claimer room");
                if (creep.memory.unreachableRooms.indexOf(roomFromTo) === -1) {
                    creep.memory.unreachableRooms.push(roomFromTo);
                }
                creep.memory.exitRoom = null;
            }
        }
    }

};

module.exports = helperCreep;