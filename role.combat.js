var movementHelper = require('movement.helper');


var roleCombat = {

        /** @param {Creep} creep **/
        run: function (creep, hasBeenUnderAttack, maxCombatUnit) {
            var target = null;
            if ((null == Memory.combatTarget && Game.time % 128 === 0) || hasBeenUnderAttack || (maxCombatUnit && Game.time % 128 === 0)) {
                target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if (null == target && Game.time % 128 === 0) {
                    var targets;
                    for (var name in Game.rooms) {
                        var room = Game.rooms[name];
                        targets = room.find(FIND_HOSTILE_CREEPS);
                        if (null != targets && targets.length > 0) {
                            target = targets[0];
                            break;
                        } else {
                            targets = room.find(FIND_HOSTILE_STRUCTURES);
                            if (null != targets && targets.length > 0) {
                                target = targets[0];
                                break;
                            }
                        }
                    }
                }
                Memory.combatTarget = target;
            } else {
                target = Game.getObjectById(Memory.combatTarget);
                if (Game.time % 128 === 0) {
                    Memory.combatTarget = null;
                }
            }
            // console.log("target=" + target);
            if (target) {
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                    var moveAttack = creep.moveTo(target, {
                        reusePath: 8,
                        visualizePathStyle: {stroke: '#ff0500'}
                    });
                    if (moveAttack === ERR_NO_PATH) {
                        // TODO: attack the wall or go away
                        // For now go away
                        Memory.combatExitRoom = null;
                    }
                }
            }
            if (!maxCombatUnit && null == target && Game.time % 128 === 0) {
                movementHelper.moveRandomly(creep, 8);
            } else if (maxCombatUnit && null == target && Game.time % 128 === 0) {

                var room = creep.room;
                if (null == Memory.combatExitRoom || room.name === Memory.combatExitRoom || Memory.unreachableRooms.indexOf(Memory.combatExitRoom) === -1) { // seek another room
                    // go to another room
                    var exits = Game.map.describeExits(room.name);
                    var exitCount = Object.keys(exits).length;
                    var randomSelected = Math.myRandom(0, exitCount - 1);
                    var index = 0;
                    var exitRoom;

                    for (var roomName in exits) {
                        if (randomSelected === index) {
                            exitRoom = exits[roomName];
                            break;
                        }
                        index++;
                    }

                    if (null != exitRoom && Game.map.isRoomAvailable(exitRoom)) {
                        Memory.combatExitRoom = exitRoom;
                    }

                    // Consider that room as explored, set Memory data
                    // this.setExplorationData(creep);
                }

                if (null != Memory.combatExitRoom) {
                    var exitDir = Game.map.findExit(creep.room, Memory.combatExitRoom);
                    var exit = creep.pos.findClosestByRange(exitDir);
                    var moveExit = creep.moveTo(exit, {
                        reusePath: 64,
                        visualizePathStyle: {stroke: '#ba0062'}
                    });
                    if (moveExit === ERR_NO_PATH) {
                        if (Memory.unreachableRooms.indexOf(Memory.combatExitRoom) === -1) {
                            Memory.unreachableRooms.push(Memory.combatExitRoom);
                        }
                        console.log("No path found for room " + Memory.combatExitRoom + " re-init target combat room");
                        Memory.combatExitRoom = null;
                    }

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