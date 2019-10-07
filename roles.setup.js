var helperEnergy = require('helper.energy');
var helperMiner = require('helper.miner');
var helperRoom = require('helper.room');

require('object.extension')();

var rolesSetup = {

    UTILITY: { name: "utility", maxCount: -1, baseBody: [WORK, CARRY, MOVE], filler: true },
    FILLER: { name: "filler", maxCount: -1, baseBody: [CARRY, MOVE], filler: true },
    MINER: { name: "miner", maxCount: -1, baseBody: [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], simpleBody: true },
    CLAIMER: { name: "claimer", maxCount: 1, baseBody: [CLAIM, MOVE], simpleBody: false },
    COMBAT: { name: "combat", maxCount: 1, baseBody: [TOUGH, TOUGH, ATTACK, MOVE, MOVE] },
    COMBAT2: { name: "combat", maxCount: 1, baseBody: [TOUGH, ATTACK, MOVE] },
    HEALER: { name: "heal", maxCount: 1, baseBody: [TOUGH, HEAL, MOVE, MOVE] },

    /** @param {Creep} creep **/
    spawn: function (type) {
        if (Game.time % 64 === 0 || null == Memory.utilityMaxCount) {
            if (null == Memory.utilityMaxCount || null == Memory.minerMaxCount || null == Memory.fillerUnitCount
                || Game.time % 512 === 0
                || null == Memory.previousUtilityMaxCount) {

                if (null != Memory.utilityMaxCount) {
                    Memory.previousUtilityMaxCount = JSON.parse(JSON.stringify(Memory.utilityMaxCount));
                }

                if (null == Memory.roomDatas || Game.time % 4096 === 0) {
                    Memory.roomDatas = {};
                }

                Memory.utilityMaxCount = {};
                Memory.utilityUnitCount = {};
                Memory.minerMaxCount = {};
                Memory.minerUnitCount = {};

                //                Memory.fillerMaxCount = {};
                Memory.fillerUnitCount = {};
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
                        var maxMiner = this.calcMaxMiner(room);
                        Memory.minerMaxCount[room.name] = maxMiner;
                        Memory.minerUnitCount[room.name] = 0;
                        console.log("calculated maxMiner=" + maxMiner);

                        var maxUtility = this.calcMaxUtility(room); //TODO set max utility by room with spawn ?
                        Memory.utilityMaxCount[room.name] = maxUtility;
                        Memory.utilityUnitCount[room.name] = 0;
                        console.log("calculated maxUtility=" + maxUtility);

                    }


                    if (Game.cpu.bucket < 1000 && !spawnForItself) {
                        console.log("Not spawning spawn room [" + spawn.room.name + "] for this room " + room.name + " bucket is under 1000");
                        continue;
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

                    if (type.name === "filler") {
                        Memory.fillerUnitCount[room.name] = seekTypes.length;
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

                    if (!(type.name === this.MINER.name || type.name === this.UTILITY.name || type.name === this.FILLER.name)) {
                        var foundTowers = room.findInMemory(FIND_MY_STRUCTURES, {
                            filter: { structureType: STRUCTURE_TOWER }
                        });

                        var emptyTower = false;
                        for (var i = 0; i < foundTowers.length; i++) {
                            if (foundTowers[i].energy < foundTowers[i].energyCapacity / 2) {
                                emptyTower = true;
                            }
                        }

                        if (emptyTower) {
                            console.log("Not spawning spawn room [" + spawn.room.name + "] for this room " + room.name + " a tower is nearly empty");
                            continue;
                        }
                    }

                    //                    console.log("Current status for spawn=" + spawn.name + ", " + type.name + "=" + seekTypes.length);

                    if ((type.name === this.CLAIMER.name || type.name === this.COMBAT.name || type.name === this.HEALER.name) && Game.cpu.bucket < 5000) {
                        console.log("Not building combat, bucket is under 5000");
                        continue;
                    }

                    if (type.name === this.UTILITY.name && null != Memory.utilityMaxCount[room.name]) {
                        type.maxCount = Math.floor(Memory.utilityMaxCount[room.name]);
                    }

                    if (type.name === this.FILLER.name && null != Memory.utilityMaxCount[room.name]) {
                        type.maxCount = Math.ceil(Memory.utilityMaxCount[room.name]);
                    }

                    if (type.name === this.MINER.name && null != Memory.minerMaxCount[room.name]) {
                        type.maxCount = Memory.minerMaxCount[room.name];
                    }

                    if (type.name === this.FILLER.name
                        && (Memory.minerUnitCount[room.name] < Memory.minerMaxCount[room.name]
                            || Memory.minerMaxCount[room.name] === 0)) {
                        console.log("Not spawning fillers for this room yet, miners still not exists");
                        continue;
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
                            && Memory.hasBeenUnderAttack < 9
                            || (null != room.controller && !room.controller.my)
                            || null == room.controller) {
                            console.log('Not spawning heal yet, reason: not enough utility or room.controller.level <= 3');
                            continue;
                        }

                        if ((!spawnForItself && type.name === this.CLAIMER.name)
                            || (type.name === this.CLAIMER.name && Memory.utilityUnitCount[room.name] < Memory.utilityMaxCount[room.name])
                            || (type.name === this.CLAIMER.name && null != room.controller && room.controller.my && room.controller.level <= 5)
                            || (null != room.controller && !room.controller.my)
                            || null == room.controller) {
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

        var roomControlerLevel = -1;
        if (null != room.controller) {
            roomControlerLevel = room.controller.level;
        }
        if (null != room.controller && room.controller.my && roomControlerLevel == 8
            && null != Memory.previousUtilityMaxCount[room.name]
            && null != Memory.minerMaxCount[room.name]
            && Memory.minerMaxCount[room.name] > 0) {

            Memory.previousUtilityMaxCount[room.name] = 1;

            return 1;

        } else if (null != room.controller && room.controller.my && roomControlerLevel > 3
            && null != Memory.previousUtilityMaxCount[room.name]
            && null != Memory.minerMaxCount[room.name]
            && Memory.minerMaxCount[room.name] > 0) {
            var result = 0;
            var upgraded = false;
            var droppedResources = room.findInMemory(FIND_DROPPED_RESOURCES);

            for (var i = 0; i < droppedResources.length; i++) {
                var droppedResource = droppedResources[i];
                if (droppedResource.amount > 1000) {
                    result = Memory.previousUtilityMaxCount[room.name] + 0.5;
                    upgraded = true;
                    break;
                }
            }

            if (!upgraded) {
                result = Memory.previousUtilityMaxCount[room.name] - 1;
            }

            result = result < 1 ? 1 : result;
            if (roomControlerLevel <= 4) {
                result = result > 5 ? 5 : result;
            } else {
                result = result > 3 ? 3 : result;
            }

            Memory.previousUtilityMaxCount[room.name] = result;

            return result;

        } else {

            var sourcesCount = room.findInMemory(FIND_SOURCES).length;
            var mineSpots = helperEnergy.countEnergyMineSpots(room);
            console.log("sourcesCount=" + sourcesCount);
            console.log("mineSpots=" + mineSpots);

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
        if (null != room.controller && room.controller.my && roomControlerLevel == 8
            && null != Memory.previousUtilityMaxCount[room.name]
            && null != Memory.minerMaxCount[room.name]
            && Memory.minerMaxCount[room.name] > 0) {
            return 1;
        }

        var result = 0;
        var sources = room.findInMemory(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];
            var container = helperRoom.hasAContainerAround(source, room);

            if (container.structureType === STRUCTURE_CONTAINER && container.hitsMax) {
                result++;
            }
        }
        return result;
    }


};


module.exports = rolesSetup;