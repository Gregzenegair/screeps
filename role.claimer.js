require('object.extension')();

var helperCreep = require('helper.creep');

var roleClaimer = {

// TODO : re write completly the logic behind this
// TODO: room.find(FIND_SOURCES).length === 1 no more claim room with 1 res only reserve them

    /** @param {Creep} creep **/
    run: function (creep, room) {

        if (null == Memory.noControllerRooms || Game.time % 4096 === 0) {
            Memory.noControllerRooms = [];
        }

        if (null == Memory.claimableControllerRooms || Game.time % 1024 === 0) {
            Memory.claimableControllerRooms = [];
        }

        if (creep.room.name === creep.memory.exitRoom) {
            creep.memory.exitRoom = null;
        }


        if (null == creep.memory.claimingSpotError || null == creep.memory.previousPosX || null == creep.memory.previousPosY) {
            creep.memory.claimingSpotError = 0;
            creep.memory.previousPosX = 0;
            creep.memory.previousPosY = 0;
        }


        if (this.isNotClaimableNow(creep)) {

            if (Memory.noControllerRooms.indexOf(room.name) < 0) {
                Memory.noControllerRooms.push(room.name);
            }

            if (null == creep.memory.exitRoom) {
                // go to another room
                var exits = Game.map.describeExits(room.name);
                var exitCount = Object.keys(exits).length;
                var randomSelected = Math.myRandom(0, exitCount - 1);
                var exitRoom;
                for (var roomKey in exits) {
                    if (Memory.noControllerRooms.indexOf(exits[roomKey]) === -1) {
                        exitRoom = exits[roomKey];
                        break;
                    }
                }


                if (null == exitRoom) {

                    var claimableRooms = Memory.claimableControllerRooms; //_.difference(Memory.claimableControllerRooms, Memory.noControllerRooms);
                    // if there are known claimableRooms, let's select one randomly
                    if (claimableRooms.length > 0) {
                        var index = 0;
                        var randomSelectedClaimable = Math.myRandom(0, claimableRooms.length - 1);
                        for (var roomKey in exits) {
                            if (randomSelectedClaimable === index) {
                                exitRoom = exits[roomKey];
                                break;
                            }
                            index++;
                        }
                    }

                    // if still null, let's select it randomly
                    if (null == exitRoom) {
                        var index = 0;
                        for (var roomKey in exits) {
                            if (randomSelected === index) {
                                exitRoom = exits[roomKey];
                                break;
                            }
                            index++;
                        }
                    }
                }

                if (null != exitRoom && Game.map.isRoomAvailable(exitRoom)) {
                    creep.memory.exitRoom = exitRoom;
                } else {
                    creep.memory.exitRoom = null;
                }
            }

            if (null != creep.memory.exitRoom) {
                console.log("Claimer going through room=" + creep.memory.exitRoom);
                var moveExit = helperCreep.moveToAnOtherRoom(creep, creep.memory.exitRoom);
                if (moveExit === ERR_NO_PATH) {
                    console.log("No path found for room " + moveExit + " re-init target claimer room");
                    creep.memory.exitRoom = null;
                }
            }

        } else {
            creep.memory.exitRoom = null;
            // claim this room's controller
            var claimResult;

            if (room.find(FIND_SOURCES).length > 1) {
                claimResult = creep.claimController(room.controller);
                creep.say("C=" + claimResult);
            }

            if (Memory.claimableControllerRooms.indexOf(room.name) < 0) {
                Memory.claimableControllerRooms.push(room.name);
            }

            creep.memory.claimingSpot = true;

            if (claimResult === ERR_NOT_IN_RANGE) {
                helperCreep.moveTo(creep, room.controller);

            } else if (claimResult !== OK) {
                var claimReserveResult = creep.reserveController(room.controller);
                creep.say("C R=" + claimReserveResult);
                if (claimReserveResult === ERR_NOT_IN_RANGE) {
                    helperCreep.moveTo(creep, room.controller);

                    if (creep.memory.previousPosX == creep.pos.x && creep.memory.previousPosY == creep.pos.y) {
                        creep.memory.claimingSpotError++;
                    }
                    creep.memory.previousPosX = creep.pos.x;
                    creep.memory.previousPosY = creep.pos.y;


                    if (creep.memory.claimingSpotError > 10) {
                        creep.say("Change room");
                        creep.memory.claimingSpot = false;
                        creep.memory.exitRoom = false;
                    }
                } else if (claimReserveResult === ERR_INVALID_TARGET) {
                    var claimAttackResult = creep.attackController(room.controller);
                    creep.say("C A=" + claimAttackResult);
                } else {
                    creep.memory.claimingSpotError = 0;
                }
            }
        }

    },

    isNotClaimableNow: function (creep) {
        var room = creep.room;
        return null == room.controller
                || (null != room.controller
                        && room.controller.my)
                || (null != room.controller
                        && room.controller.reservation
                        && room.controller.reservation.username === "Gregzenegair"
                        && room.controller.reservation.ticksToEnd >= 100
                        && !creep.memory.claimingSpot)
                || creep.memory.claimingSpotError > 10;
    }


};

module.exports = roleClaimer;