require('object.extension')();

var helperEnergy = require('helper.energy');
var helperMiner = require('helper.miner');
var helperRoom = require('helper.room');

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
            if (null == Memory.utilityMaxCount || null == Memory.minerMaxCount || Game.time % 1024 === 0) {
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

                    if (null == room) {
                        console.log("Not spawning for room {" + roomName + "], no room found, because nothing mine in it");
                        continue;
                    }

//                    var spawn = helperRoom.findSpawn(room);
//
//                    if (null == spawn) {
//                        console.log("Not spawning for room {" + roomName + "], no spawn found");
//                        continue;
//                    }

                    if (room.name != spawn.room.name &&
                            (Memory.utilityUnitCount[spawn.room.name] < Memory.utilityMaxCount[spawn.room.name]
                                    || Memory.minerUnitCount[spawn.room.name] < Memory.minerMaxCount[spawn.room.name])) {
                        console.log("Not spawning spawn room [" + spawn.room.name + "] for this room " + room.name + " yet, current spawn has not yet it's max utility units");
                        continue;
                    }

                    var seekTypes = _.filter(Game.creeps, (creep) => creep.memory.role == type.name && creep.memory.roomAssigned == room.name
                                && creep.ticksToLive > 48); // replace a dying creep sooner (by not counting it if under 32ttl)

                    console.log("Current status for spawn=" + spawn.name + ", " + type.name + "=" + seekTypes.length);

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

                    if (type.name === "utility") {
                        Memory.utilityUnitCount[room.name] = seekTypes.length;
                    }

                    if (type.name === "miner") {
                        Memory.minerUnitCount[room.name] = seekTypes.length;
                    }

                    if (type.name === this.UTILITY.name && null != Memory.utilityMaxCount[room.name]) {
                        type.maxCount = Memory.utilityMaxCount[room.name];
                    }

                    if (type.name === this.MINER.name && null != Memory.minerMaxCount[room.name]) {
                        type.maxCount = Memory.minerMaxCount[room.name];
                    }

                    if (room.name != spawn.room.name &&
                            (type.name === this.UTILITY.name
                                    || type.name === this.MINER.name)
                            && room.find(FIND_HOSTILE_CREEPS).length > 0) {
                        console.log("Not spawning utilities for this room yet, assigned room is dangerous");
                        continue;
                    }

                    if (seekTypes.length < type.maxCount) {
                        if ((type.name === this.COMBAT.name && Memory.utilityUnitCount[room.name] < Memory.utilityMaxCount[room.name]) || (type.name === this.COMBAT.name && null != room.controller && room.controller.my && room.controller.level <= 3)) {
                            console.log('Not spawning combat yet, reason, not enough utility or room.controller.level <= 3');
                            continue;
                        }

                        if ((type.name === this.HEALER.name && Memory.utilityUnitCount[room.name] < Memory.utilityMaxCount[room.name]) || (type.name === this.HEALER.name && null != room.controller && room.controller.my && room.controller.level <= 3)) {
                            console.log('Not spawning heal yet, reason, not enough utility or room.controller.level <= 3');
                            continue;
                        }

                        if ((type.name === this.CLAIM.name && Memory.utilityUnitCount[room.name] < Memory.utilityMaxCount[room.name]) || (type.name === this.CLAIM.name && null != room.controller && room.controller.my && room.controller.level <= 3)) {
                            console.log('Not spawning claimer yet, reason, not enough utility or room.controller.level <= 3');
                            continue;
                        }

                        if ((type.name === this.UTILITY.name || type.name === this.MINER.name) && helperRoom.roomDataGetter(room.name, helperRoom.MEMORY_KEYS.DANGEROUS_ROOM && room.name != spawn.room.name)) {
                            console.log('Not spawning utility or miner for room[' + room.name + '], reason, too dangerous');
                            continue;
                        }




                        var spawnResult;
                        if (Memory.utilityUnitCount[spawn.room.name] <= 1) {
                            spawnResult = spawn.spawnCustom(type, spawn.room.energyAvailable, spawn, room.name);
                        } else {
                            spawnResult = spawn.spawnCustom(type, spawn.room.energyCapacityAvailable, spawn, room.name);
                        }
                        if (spawnResult >= 0) {
                            console.log('Spawned new wanted type : ' + type.name);
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

        var sourcesCount = room.find(FIND_SOURCES).length;
        var mineSpots = helperEnergy.countEnergyMineSpots(room);
        console.log("sourcesCount=" + sourcesCount);
        console.log("mineSpots=" + mineSpots);

        var roomControlerLevel = 0;
        if (null != room.controller && null != room.controller.level) {
            roomControlerLevel = room.controller.level
        }

        result = Math.round(Math.round(mineSpots * 0.4) - (roomControlerLevel / 2));
        result += sourcesCount * 3.2;
        console.log("calcMaxUtility=" + result);
        return Math.round(result);
    },

    calcMaxMiner: function (room) {
        var result = 0;
        var sources = room.find(FIND_SOURCES);
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