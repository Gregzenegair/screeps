require('object.extension')();

var roleClaimer = {

    /** @param {Creep} creep **/
    run: function (creep, room) {

        if (null == Memory.noControllerRooms || Game.time % 1024 === 0) {
            Memory.noControllerRooms = [];
        }

        if (null == Memory.claimableControllerRooms || Game.time % 1024 === 0) {
            Memory.claimableControllerRooms = [];
        }

        if (null == Memory.unreachableRooms  || Game.time % 4096 === 0) {
            Memory.unreachableRooms = [];
        }

        if (creep.room.name === creep.memory.exitRoom) {
            creep.memory.exitRoom = null;
        }


        if (null == creep.memory.claimingSpotError || null == creep.memory.previousPosX || null == creep.memory.previousPosY) {
            creep.memory.claimingSpotError = 0;
            creep.memory.previousPosX = 0;
            creep.memory.previousPosY = 0;
        }


        if (null == room.controller
            || (null != room.controller
                && room.controller.my)
            || (null != room.controller
                && room.controller.reservation
                && room.controller.reservation.username === "Gregzenegair"
                && room.controller.reservation.ticksToEnd >= 100
                && !creep.memory.claimingSpot)) {
            
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
//                    console.log(exits[roomKey]);
//                    console.log(Memory.noControllerRooms[0]);
                    
                    if (Memory.noControllerRooms.indexOf(exits[roomKey]) === -1 && Memory.unreachableRooms.indexOf(exits[roomKey]) === -1) {
                        exitRoom = exits[roomKey];
                        console.log("Claimer going through room=" +exits[roomKey]);
                        break;
                    }
                }

                var index = 0;
                if (null == exitRoom) {

                    var claimableRooms = Memory.claimableControllerRooms //_.difference(Memory.claimableControllerRooms, Memory.noControllerRooms);
                    // if there are known claimableRooms, let's select one randomly
                    if (claimableRooms.length > 0) {
                        exitRoom = exits[Math.myRandom(0, claimableRooms.length - 1)];
                    }

                    // if still null, let's select it randomly
                    if (null == exitRoom) {
                        for (var roomKey in exits) {
                            if (randomSelected === index) {
                                exitRoom = exits[roomKey];
                                break;
                            }
                            index++;
                        }
                    }
                }

                if (null != exitRoom && Game.map.isRoomAvailable(exitRoom) && Memory.unreachableRooms.indexOf(exitRoom) === -1) {
                    creep.memory.exitRoom = exitRoom;
                } else {
                    creep.memory.exitRoom = null;
                }
            }

            if (null != creep.memory.exitRoom) {

                var exitDir = Game.map.findExit(creep.room, creep.memory.exitRoom);
                var exit = creep.pos.findClosestByRange(exitDir); // TODO : serialize path or exit and save it into memory
                // TODO : with a double entry array startRoom -> endRoom

                var moveExit = creep.moveTo(exit, {
                    reusePath: 32,
                    visualizePathStyle: {stroke: '#dd63ff'}
                });
                if (moveExit === ERR_NO_PATH) {
                    console.log("No path found for room " + exitDir + " re-init target claimer room");
                    if (Memory.unreachableRooms.indexOf(creep.memory.exitRoom) === -1) {
                        Memory.unreachableRooms.push(creep.memory.exitRoom);
                    }
                    creep.memory.exitRoom = null;
                }
            }
            
        } else {
            creep.memory.exitRoom = null;
            // claim this room's controller
            var claimResult = creep.claimController(room.controller);
            creep.say("C=" + claimResult);

            if (Memory.claimableControllerRooms.indexOf(room.name) < 0) {
                Memory.claimableControllerRooms.push(room.name);
            }

            creep.memory.claimingSpot = true;

            if (claimResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller, {
                    reusePath: 32,
                    visualizePathStyle: {stroke: '#00ff00'}
                });

            } else if (claimResult !== OK) {
                var claimReserveResult = creep.reserveController(room.controller);
                creep.say("C R=" + claimReserveResult);
                if (claimReserveResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(room.controller, {
                        reusePath: 32,
                        visualizePathStyle: {stroke: '#00ff00'}
                    });

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
                }
            }
        }

    }


};

module.exports = roleClaimer;