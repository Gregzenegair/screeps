var helperCreep = require('helper.creep');


var roleCombat = {

    /** @param {Creep} creep **/
    run: function (creep, hasBeenUnderAttack, maxCombatUnit) {

        helperCreep.initMoveToRoomAssigned(creep);

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
                        visualizePathStyle: {stroke: '#ff0500'}
                    });
                    if (moveAttack === ERR_NO_PATH) {
                        // TODO: attack the wall or go away
                        // For now go away
                        Memory.combatExitRoom = null;
                    }
                }
            } else {
                Memory.combatExitRoom = target.room.name;
            }
        } else {
            creep.say("Nothing", true);
            Memory.combatTarget = null;
        }

        if ((!maxCombatUnit && null == target && Game.time % 128 === 0) || null != creep.memory.moveToRandomly) {
            helperCreep.moveRandomly(creep, 8);
        } else if (maxCombatUnit && null == target && Game.time % 128 === 0 || null != Memory.combatExitRoom) {

            var room = creep.room;
            if (null == Memory.combatExitRoom || room.name === Memory.combatExitRoom) { // seek another room
                // go to another room
                helperCreep.moveRandomExitRoom(creep);
            }

            if (null != Memory.combatExitRoom) {
                var moveExit = helperCreep.moveToAnOtherRoom(creep, Memory.combatExitRoom);

                if (null == moveExit) {
                    Memory.combatExitRoom = null;
//                    Memory.combatTarget = null;
                }

                if (moveExit === ERR_NO_PATH) {
                    console.log("No path found for room " + Memory.combatExitRoom + " re-init target combat room");
                    Memory.combatExitRoom = null;
                }
                creep.say("Move Exit", true);
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