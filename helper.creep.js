require('object.extension')();

var helperRoom = require('helper.room');

var helperCreep = {

    moveTo: function (creep, target, ignoreCreeps, range, visualizePathStyle) {

        if (null == visualizePathStyle) {
            visualizePathStyle = {stroke: '#fffd00'};
        }

        if (null == range) {
            range = 0;
        }

        if (null == creep.memory.previousPosX || null == creep.memory.previousPosY) {
            creep.memory.previousPosX = -1;
            creep.memory.previousPosY = -1;
        }

        if (null == ignoreCreeps || creep.memory.alternativePath) {
            ignoreCreeps = false;
        }

        var moveResult = creep.moveTo(target, {
            reusePath: 16,
            visualizePathStyle: visualizePathStyle,
            ignoreCreeps: ignoreCreeps,
            maxRooms: 1,
            range: range // prevent to walk over sources, gain cpu time
        });

        var isStuck = this.isStuck(creep);

        if (isStuck) {
            creep.memory.errorPathCount++;
            if (creep.memory.errorPathCount > 1) {
                creep.memory.errorPathCount = 0;
                creep.memory.alternativePath = true;
            }
        } else {
            creep.memory.errorPathCount = 0;
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

            helperRoom.scanRoom(creep.room);

            var target = helperRoom.findHostile(creep.room);
            if (null != target) {
                helperRoom.roomDataSetter(creep.room.name, helperRoom.MEMORY_KEYS.DANGEROUS_ROOM, true);
            }
        }

        if (null == creep.memory.targetRoomExit) {
            var exitDir = Game.map.findExit(creep.room, targetRoom);
            exit = creep.pos.findClosestByRange(exitDir);
            creep.memory.targetRoomExit = exit;
        } else {
            exit = new RoomPosition(parseInt(creep.memory.targetRoomExit.x), parseInt(creep.memory.targetRoomExit.y), creep.memory.targetRoomExit.roomName);
        }

        creep.memory.previousRoomName = creep.room.name;

        var moveExit = OK;
        if (null != exit) {
            moveExit = this.moveTo(creep, exit, null, null, {stroke: '#4462ac'});
        }

        return moveExit;
    },
    
    isStuck: function (creep) {
        if (creep.fatigue !== 0) {
            return false;
        }
        var moved = true;
        if (creep.memory.previousPosX === creep.pos.x && creep.memory.previousPosY === creep.pos.y) {
            moved = false;
        }

        creep.memory.previousPosX = creep.pos.x;
        creep.memory.previousPosY = creep.pos.y;

        return !moved;
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
    assigneRandomExitRoom: function (creep, options) {
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

        if (null != exitRoom) {
            creep.memory.roomAssignedReached = false;
            creep.memory.roomAssigned = exitRoom;
        }

        return exitRoom; // returns room to exit to
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

    moveToRoomAssigned: function (creep) {
        var roomFromTo = {};
        roomFromTo.from = creep.room.name;

        if (null == Memory.unreachableRooms) {
            Memory.unreachableRooms = [];
        }

        if (creep.room.name != creep.memory.roomAssigned && !creep.memory.roomAssignedReached) {
            roomFromTo.to = creep.memory.roomAssigned;
            creep.say("🏃");

            var moveExit = helperCreep.moveToAnOtherRoom(creep, creep.memory.roomAssigned);
//            var isStuck = this.isStuck(creep);

            if (moveExit === ERR_NO_PATH || moveExit === ERR_INVALID_TARGET) {
                console.log("No path found for room " + moveExit + " re-init target exitRoom");
                var roomFound = false;
                for (var i = 0; i < Memory.unreachableRooms.length; i++) {
                    if (Memory.unreachableRooms[i].to == roomFromTo.to
                            && Memory.unreachableRooms[i].from == roomFromTo.from) {
                        roomFound = true;
                    }
                }
                if (!roomFound) {
                    Memory.unreachableRooms.push(roomFromTo);
                }
            }

            return false;
        } else if (!creep.memory.roomAssignedReached) {
            var nextStep = this.nextStepIntoRoom(creep.pos, creep.room.name);

            creep.say("Enter NR");
            creep.memory.energySourceId = null;
            creep.memory.energySourceType = null;

            this.moveTo(creep, nextStep);
            creep.memory.roomAssignedReached = true;
            return false;
        }
        return true;
    },
    /**
     * FIX a fucking bug with swamps
     * @param {type} pos
     * @param {type} nextRoom
     * @returns {RoomPosition}
     */
    nextStepIntoRoom: function (pos, room) {
        var x = pos.x;
        var y = pos.y;
        if (pos.x == 0) {
            x = 25;
        }
        if (pos.x == 49) {
            x = 25;
        }
        if (pos.y == 0) {
            y = 25;
        }
        if (pos.y == 49) {
            y = 25;
        }
        return new RoomPosition(x, y, room);
    }

};

module.exports = helperCreep;