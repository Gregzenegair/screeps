var helperCreep = require('helper.creep');
var helperController = require('helper.controller');

require('object.extension')();

var roleClaimer = {

// TODO : re write completly the logic behind this
// TODO: room.find(FIND_SOURCES).length === 1 no more claim room with 1 res only reserve them

    /** @param {Creep} creep **/
    run: function (creep, room) {

        var reached = helperCreep.moveToRoomAssigned(creep);
        if (!reached) {
            return;
        }

        if (null == Memory.noControllerRooms || Game.time % 1024 === 0) {
            Memory.noControllerRooms = [];
        }

        if (null == Memory.claimableControllerRooms || Game.time % 1024 === 0) {
            Memory.claimableControllerRooms = [];
        }

        if (null == creep.memory.claimingSpotError) {
            creep.memory.claimingSpotError = 0;
        }

        if (creep.memory.claimingSpotError > 16 && creep.memory.errorPathCount > 3) {
            creep.memory.claimingSpot = false;
            creep.memory.claimingSpotError = 0;
            helperCreep.assigneRandomExitRoom(creep);
        }



        if (helperController.isNotClaimable(creep.room)) {

            if (Memory.noControllerRooms.indexOf(room.name) < 0) {
                Memory.noControllerRooms.push(room.name);
            }
//TODO : add {unwantedRooms: Memory.noControllerRooms}
            var exitRoom = helperCreep.assigneRandomExitRoom(creep,
                    {unwantedRooms: Memory.noControllerRooms, wantedRooms: Memory.claimableControllerRooms});

        } else {

            if (Memory.claimableControllerRooms.indexOf(room.name) < 0
                    && Memory.noControllerRooms.indexOf(room.name) < 0) {
                Memory.claimableControllerRooms.push(room.name);
            }

            creep.memory.claimingSpot = true;

            // claim this room's controller
            var claimResult = null;

            if (room.findInMemory(FIND_SOURCES).length > 1) {
                claimResult = creep.claimController(room.controller);
                creep.say("C=" + claimResult);
            }

            if (null == claimResult || claimResult === ERR_NOT_IN_RANGE) {
                helperCreep.moveTo(creep, room.controller, true);
            }

            if (null == claimResult || claimResult !== OK) {
                var claimReserveResult = creep.reserveController(room.controller);
                creep.say("C R=" + claimReserveResult);

                if (claimReserveResult === ERR_NOT_IN_RANGE) {
                    helperCreep.moveTo(creep, room.controller, true);
                    
                    if (helperCreep.isStuck(creep)) {
                        creep.memory.claimingSpotError++;
                    } else {
                        creep.memory.claimingSpotError = 0;
                    }
                    
                } else if (claimReserveResult === ERR_INVALID_TARGET) {
                    var claimAttackResult = creep.attackController(room.controller);
                    creep.say("C A=" + claimAttackResult);
                    if (claimAttackResult != OK) {
//                        creep.memory.claimingSpotError++;
                    }
                } else {
                    creep.memory.claimingSpotError = 0;
                }
            }
        }

    }


};

module.exports = roleClaimer;