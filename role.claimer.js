require('object.extension')();

var helperCreep = require('helper.creep');
var helperController = require('helper.controller');

var roleClaimer = {

// TODO : re write completly the logic behind this
// TODO: room.find(FIND_SOURCES).length === 1 no more claim room with 1 res only reserve them

    /** @param {Creep} creep **/
    run: function (creep, room) {

        var reached = helperCreep.moveToRoomAssigned(creep);
        if (!reached) {
            return;
        }

        if (null == Memory.noControllerRooms || Game.time % 4096 === 0) {
            Memory.noControllerRooms = [];
        }

        if (null == Memory.claimableControllerRooms || Game.time % 1024 === 0) {
            Memory.claimableControllerRooms = [];
        }

        if (creep.memory.claimingSpotError > 3) {
            creep.memory.claimingSpot = false;
            creep.memory.claimingSpotError = 0;
        }


        if (null == creep.memory.claimingSpotError || null == creep.memory.previousPosX || null == creep.memory.previousPosY) {
            creep.memory.claimingSpotError = 0;
            creep.memory.previousPosX = 0;
            creep.memory.previousPosY = 0;
        }



        if (helperController.isNotClaimable(creep)) {

            if (Memory.noControllerRooms.indexOf(room.name) < 0) {
                Memory.noControllerRooms.push(room.name);
            }

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

            if (room.find(FIND_SOURCES).length > 1) {
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

                } else if (claimReserveResult === ERR_INVALID_TARGET) {
                    var claimAttackResult = creep.attackController(room.controller);
                    creep.say("C A=" + claimAttackResult);
                    if (claimAttackResult != OK) {
                        creep.memory.claimingSpotError++;
                    }
                } else {
                    creep.memory.claimingSpotError = 0;
                }
            }
        }

    }


};

module.exports = roleClaimer;