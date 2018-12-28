var helperEnergy = require('helper.energy');
var helperMiner = require('helper.miner');
var helperRoom = require('helper.room');

require('object.extension')();

var rolesSetup = {

    UTILITY: {name: "utility", maxCount: 0, baseBody: [WORK, CARRY, MOVE], filler: true},
    MINER: {name: "miner", maxCount: 0, baseBody: [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], simpleBody: true},
    CLAIM: {name: "claim", maxCount: 2, baseBody: [CLAIM, MOVE], simpleBody: false},
    COMBAT: {name: "combat", maxCount: 1, baseBody: [ATTACK, MOVE, MOVE, TOUGH, TOUGH]},
    COMBAT2: {name: "combat", maxCount: 1, baseBody: [ATTACK, MOVE, TOUGH]},
    HEALER: {name: "heal", maxCount: 1, baseBody: [HEAL, MOVE, MOVE, TOUGH]},

    /** @param {Creep} creep **/
    spawn: function (type) {
        if (Game.time % 32 === 0 || null == Memory.utilityMaxCount) {
            if (null == Memory.utilityMaxCount || null == Memory.minerMaxCount || Game.time % 512 === 0
                    || null == Memory.previousUtilityMaxCount) {

                if (null != Memory.utilityMaxCount) {
                    Memory.previousUtilityMaxCount = JSON.parse(JSON.stringify(Memory.utilityMaxCount));
                }

                Memory.utilityMaxCount = {};
                Memory.utilityUnitCount = {};
                Memory.minerMaxCount = {};
                Memory.minerUnitCount = {};
            }

            for (var name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    helperMiner.freedSpot(Memory.creeps[name].containerSpot);
                    delete Memory.creeps[name];
                    console.log('Clearing non-existing creep memory:', name);
                }
            }

            Memory.totalSpawnCount = Game.spawns.length;

            Memory.roomSpawnedType = {};

            for (var key in Game.spawns) {
                var spawn = Game.spawns[key];

//                var assignableRooms = {};
//
//                assignableRooms = Game.map.describeExits(spawn.room.name);
//                assignableRooms[spawn.room.name] = spawn.room.name; //add it self
//
//                for (var roomKey in assignableRooms) {

//                    var roomName = assignableRooms[roomKey];

                for (var roomName in Game.rooms) {

                    var room = Game.rooms[roomName];
                    var roomSpawns = room.findInMemory(FIND_MY_SPAWNS);

                    var spawnForItself = room.name == spawn.room.name;

                    if (null == room) {
                        console.log("Not spawning for room {" + roomName + "], no room found, because nothing mine in it");
                        continue;
                    }

                    if (null == Memory.utilityMaxCount[room.name]) {
                        var maxUtility = this.calcMaxUtility(room); //TODO set max utility by room with spawn ?
                        Memory.utilityMaxCount[room.name] = maxUtility;
                        Memory.utilityUnitCount[room.name] = 0;
                        console.log("calculated maxUtility=" + maxUtility);

                        var maxMiner = this.calcMaxMiner(room);
                        Memory.minerMaxCount[room.name] = maxMiner;
                        Memory.minerUnitCount[room.name] = 0;
                        console.log("calculated maxMiner=" + maxMiner);
                    }


                    if (!spawnForItself && roomSpawns.length > 0) {
                        console.log("Not spawning spawn room [" + spawn.room.name + "] for this room " + room.name + " it has its own spawn, will spanwn for itself");
                        continue;
                    }

                    var seekTypes = _.filter(Game.creeps, (creep) => creep.memory.role == type.name && creep.memory.roomAssigned == room.name
                                && creep.ticksToLive > 48); // replace a dying creep sooner (by not counting it if under 32ttl)

                    if (type.name === "utility") {
                        Memory.utilityUnitCount[room.name] = seekTypes.length;
                    }

                    if (type.name === "miner") {
                        Memory.minerUnitCount[room.name] = seekTypes.length;
                    }

//                    var spawn = helperRoom.findSpawn(room);
//
//                    if (null == spawn) {
//                        console.log("Not spawning for room {" + roomName + "], no spawn found");
//                        continue;
//                    }

                    if (!spawnForItself &&
                            (Memory.utilityUnitCount[spawn.room.name] < Memory.utilityMaxCount[spawn.room.name]
                                    || Memory.minerUnitCount[spawn.room.name] < Memory.minerMaxCount[spawn.room.name])) {
                        console.log("Not spawning spawn room [" + spawn.room.name + "] for this room " + room.name + " yet, current spawn has not yet it's max utility units");
                        continue;
                    }


//                    console.log("Current status for spawn=" + spawn.name + ", " + type.name + "=" + seekTypes.length);


                    if (type.name === this.UTILITY.name && null != Memory.utilityMaxCount[room.name]) {
                        type.maxCount = Memory.utilityMaxCount[room.name];
                    }

                    if (type.name === this.MINER.name && null != Memory.minerMaxCount[room.name]) {
                        type.maxCount = Memory.minerMaxCount[room.name];
                    }

                    if (!spawnForItself &&
                            (type.name === this.UTILITY.name
                                    || type.name === this.MINER.name)
                            && room.findInMemory(FIND_HOSTILE_CREEPS).length > 0) {
                        console.log("Not spawning utilities for this room yet, assigned room is dangerous");
                        continue;
                    }

                    if (seekTypes.length < type.maxCount) {
                        if ((type.name === this.COMBAT.name && Memory.utilityUnitCount[room.name] < Memory.utilityMaxCount[room.name])
                                || (type.name === this.COMBAT.name && null != room.controller && room.controller.my && room.controller.level <= 3)
                                && Memory.hasBeenUnderAttack < 6) {
                            console.log('Not spawning combat yet, reason: not enough utility or room.controller.level <= 3');
                            continue;
                        }

                        if ((type.name === this.HEALER.name && Memory.utilityUnitCount[room.name] < Memory.utilityMaxCount[room.name])
                                || (type.name === this.HEALER.name && null != room.controller && room.controller.my && room.controller.level <= 3)
                                && Memory.hasBeenUnderAttack < 9) {
                            console.log('Not spawning heal yet, reason: not enough utility or room.controller.level <= 3');
                            continue;
                        }

                        if ((type.name === this.CLAIM.name && Memory.utilityUnitCount[room.name] < Memory.utilityMaxCount[room.name])
                                || (type.name === this.CLAIM.name && null != room.controller && room.controller.my && room.controller.level <= 3)) {
                            console.log('Not spawning claimer yet, reason: not enough utility or room.controller.level <= 3');
                            continue;
                        }

                        if ((type.name === this.UTILITY.name || type.name === this.MINER.name)
                                && helperRoom.roomDataGetter(room.name, helperRoom.MEMORY_KEYS.DANGEROUS_ROOM && !spawnForItself)) {
                            console.log('Not spawning utility or miner for room[' + room.name + '], reason: too dangerous');
                            continue;
                        }

                        if (null != Memory.roomSpawnedType[room.name] && null != Memory.roomSpawnedType[room.name][type.name]
                                && Memory.roomSpawnedType[room.name][type.name]) {
                            console.log('Not spawning [' + type.name + '] for room[' + room.name + '], reason: just already spawned');
                            continue;
                        }


                        var spawnResult;
                        if (Memory.utilityUnitCount[spawn.room.name] <= 1) {
                            spawnResult = spawn.spawnCustom(type, spawn.room.energyAvailable, spawn, room.name, spawnForItself);
                        } else {
                            spawnResult = spawn.spawnCustom(type, spawn.room.energyCapacityAvailable, spawn, room.name, spawnForItself);
                        }
                        if (spawnResult >= 0) {
                            console.log('Spawned new wanted type : ' + type.name);
                            if (null == Memory.roomSpawnedType[room.name]) {
                                Memory.roomSpawnedType[room.name] = {};
                            }
                            Memory.roomSpawnedType[room.name][type.name] = true;
                        } else {
                            console.log('Error spawning wanted type : ' + type.name + ' Error=' + spawnResult);
                        }

                    }
                }
            }
        }
    },

    calcMaxUtility: function (room) {
        if (null == Memory.maxUtilityBase || null == Memory.maxUtilityBase[room.name]) {
            Memory.maxUtilityBase = {};
            Memory.maxUtilityBase[room.name] = {};
            Memory.maxUtilityBase[room.name].baseValue = 5;
            Memory.maxUtilityBase[room.name].currentValue = 5;
            // ^ Not used yet
        }

        var sourcesCount = room.findInMemory(FIND_SOURCES).length;
        var mineSpots = helperEnergy.countEnergyMineSpots(room);
        console.log("sourcesCount=" + sourcesCount);
        console.log("mineSpots=" + mineSpots);

        var roomControlerLevel = -1;
        if (null != room.controller) {
            roomControlerLevel = room.controller.level;
        }
        if (null != room.controller && room.controller.my && roomControlerLevel > 3
                && null != Memory.previousUtilityMaxCount[room.name]) {
            var result = 0;
            var upgraded = false;
            var droppedResources = room.findInMemory(FIND_DROPPED_RESOURCES);

            for (var i = 0; i < droppedResources.length; i++) {
                var droppedResource = droppedResources[i];
                if (droppedResource.amount > 400) {
                    result = parseInt(Memory.previousUtilityMaxCount[room.name]) + 1;
                    upgraded = true;
                    break;
                }
            }

            if (!upgraded) {
                result = parseInt(Memory.previousUtilityMaxCount[room.name]) - 1;
            }

            result = result < 2 ? 2 : result;
            result = result > 7 ? 7 : result;

            Memory.previousUtilityMaxCount[room.name] = result;

            return result;

        } else {

            if (null != room.controller && null != room.controller.level && room.controller.my) {

                result = Math.round(Math.round(mineSpots * 0.4) - (roomControlerLevel / 2));
                result += sourcesCount * 3.2;
                console.log("calcMaxUtility=" + result);
                return Math.round(result);
            } else if (mineSpots !== 0) {
                return 2;
            } else {
                return 0;
            }
        }
    },

    calcMaxMiner: function (room) {
        var result = 0;
        var sources = room.findInMemory(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            var container = helperEnergy.hasAContainerAround(source, room);

            if (container.structureType === STRUCTURE_CONTAINER && container.hitsMax) {
                result++;
            }
        }
        return result;
    }


};


module.exports = rolesSetup;