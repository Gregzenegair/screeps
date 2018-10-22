var helperCreep = require('helper.creep');


var roleCombat = {

    /** @param {Creep} creep **/
    run: function (creep, hasBeenUnderAttack, maxCombatUnit) {

        var reached = helperCreep.moveToRoomAssigned(creep);
        if (!reached) {
            return;
        }

        var target = null;

        if (Game.time % 64 === 0 || (null == Memory.combatTarget && hasBeenUnderAttack) || maxCombatUnit) {
            target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (null == target) {
                target = helperCreep.findCombatTarget(creep);
            }

            if (null != target) {
                Memory.combatTarget = target.id;
                Memory.combatExitRoom = target.room.name;
            }
        } else if (Game.time % 256 === 0) {
            Memory.combatTarget = null;
            Memory.combatExitRoom = null;
        }

        if (null != Memory.combatTarget) {
            target = Game.getObjectById(Memory.combatTarget);
        }

        if (target) {
            var maxRooms;
            if (null == Memory.combatExitRoom) {
                maxRooms = 1;
            } else {
                maxRooms = 16;
            }
            creep.say("💀", true);
//            if (creep.room.name === target.room.name) {
            if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                var moveAttack = creep.moveTo(target, {
                    reusePath: 16,
                    visualizePathStyle: {stroke: '#ff0500'},
                    maxRooms: maxRooms // prevent to get out of the room
                });
            }
//            }
        } else {
            creep.say("NoTarget");
            Memory.combatTarget = null;
            Memory.combatExitRoom = null;
        }

        if ((!maxCombatUnit && null == target && Game.time % 8 === 0) || null != creep.memory.moveToRandomly) {
            helperCreep.moveRandomly(creep, 8);
        } else {
            if (null == Memory.combatExitRoom) {
                helperCreep.assigneRandomExitRoom(creep, {unwantedRooms: Memory.noControllerRooms});
            }
        }

    },

    setExplorationData: function (creep) {
        var room = creep.room;
        if (null == Memory.roomData) {
            Memory.roomData = [];
        }

        Memory.roomData[room] = {};
        Memory.roomData[room].sources = room.find(FIND_SOURCES);
    }

}
;

module.exports = roleCombat;