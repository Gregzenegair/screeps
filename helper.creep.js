var helperCreep = {

    moveTo: function (creep, target) { // should be into an helper class
        var moveResult = creep.moveTo(target, {
            reusePath: 32,
            visualizePathStyle: {stroke: '#fffd00'}
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

    /** @param {Creep} creep **/
    findNearest: function (creep, endPositions) {
        var targeted = creep.pos.findClosestByRange(endPositions);
        return targeted;
    },

    /** @param {Creep} creep **/
    moveRandomly: function (creep, range) {
        var newPosX = creep.pos.x + Math.round(Math.random() * range) - range / 2;
        var newPosY = creep.pos.y + Math.round(Math.random() * range) - range / 2;
        creep.moveTo(newPosX, newPosY, {reusePath: 32, visualizePathStyle: {stroke: '#ffffff'}});
    }
    ,

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

        if (null == exitRoom && null == creep.memory.exitRoom) {
            for (var roomKey in exits) {
                if (randomSelected === index) {
                    exitRoom = exits[roomKey];
                    break;
                }
                index++;
            }


            if (null != exitRoom && Game.map.isRoomAvailable(exitRoom) && Memory.unreachableRooms.indexOf(exitRoom) === -1) {
                creep.memory.exitRoom = exitRoom;
            } else {
                creep.memory.exitRoom = null;
            }
        }

        if (null != creep.memory.exitRoom) {

            var exitDir = Game.map.findExit(creep.room, creep.memory.exitRoom);
            var exit = creep.pos.findClosestByRange(exitDir);

            var moveExit = creep.moveTo(exit, {
                reusePath: 32,
                visualizePathStyle: {stroke: '#44ff88'}
            });

            if (moveExit === ERR_NO_PATH) {
                console.log("No path found for room " + exitDir + " re-init target claimer room");
                if (Memory.unreachableRooms.indexOf(creep.memory.exitRoom) === -1) {
                    Memory.unreachableRooms.push(creep.memory.exitRoom);
                }
                creep.memory.exitRoom = null;
            }
        }
    }

};

module.exports = helperCreep;