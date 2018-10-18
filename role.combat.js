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
                var targets;
                for (var roomName in Game.rooms) {
                    var room = Game.rooms[roomName];
                    targets = room.find(FIND_HOSTILE_CREEPS);
                    if (null != targets && targets.length > 0) {
                        target = targets[0];
                        break;
                    } else {
                        targets = room.find(FIND_HOSTILE_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType !== STRUCTURE_CONTROLLER);
                            }
                        });
                        if (null != targets && targets.length > 0) {
                            target = targets[0];
                            break;
                        }
                    }
                }
            }
            if (null != target) {
                Memory.combatTarget = target.id;
                Memory.combatExitRoom = null;
            }
        } else if (Game.time % 256 === 0) {
            Memory.combatTarget = null;
        }

        if (null != Memory.combatTarget) {
            target = Game.getObjectById(Memory.combatTarget);
        }

        if (target) {
            creep.say("💀", true);
            if (creep.room.name === target.room.name) {
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                    var moveAttack = creep.moveTo(target, {
                        reusePath: 16,
                        visualizePathStyle: {stroke: '#ff0500'},
                        maxRooms: 1 // prevent to get out of the room
                    });
                }
            }
        } else {
            creep.say("NoTarget", true);
            Memory.combatTarget = null;
        }

        if ((!maxCombatUnit && null == target && Game.time % 8 === 0) || null != creep.memory.moveToRandomly) {
            helperCreep.moveRandomly(creep, 8);
        } else {
            helperCreep.assigneRandomExitRoom(creep);
            creep.say("Move Exit", true);
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