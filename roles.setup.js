require('object.extension')();
var helperEnergy = require('helper.energy');

var rolesSetup = {

    UTILITY: {name: "utility", maxCount: 1, baseBody: [WORK, CARRY, MOVE], filler: true},
    CLAIM: {name: "claim", maxCount: 2, baseBody: [CLAIM, MOVE], simpleBody: false},
    COMBAT: {name: "combat", maxCount: 1, baseBody: [ATTACK, MOVE, MOVE, TOUGH]},
    COMBAT2: {name: "combat", maxCount: 1, baseBody: [ATTACK, MOVE, TOUGH]},
    HEAL: {name: "heal", maxCount: 1, baseBody: [HEAL, MOVE, MOVE, TOUGH]},

    /** @param {Creep} creep **/
    spawn: function (type) {
        if (Game.time % 16 === 0) {

            for (var name in Memory.creeps) {
                if (!Game.creeps[name]) {
                    delete Memory.creeps[name];
                    console.log('Clearing non-existing creep memory:', name);
                }
            }

            for (var key in Game.spawns) {
                var spawn = Game.spawns[key];

                var seekTypes = _.filter(Game.creeps, (creep) => creep.memory.role == type.name && creep.memory.spawner == spawn.name);

                console.log("spawn=" + spawn.name + ", " + type.name + "=" + seekTypes.length);

                if (null == Memory.utilityMaxCount) {
                    Memory.utilityMaxCount = {};
                    Memory.utilityUnitCount = {};
                }

                if (null == Memory.utilityMaxCount[spawn.room.name] || Game.time % 256 === 0) {
                    var maxUtility = this.calcMaxUtility(spawn.room); //TODO set max utility by room with spawn ?
                    Memory.utilityMaxCount[spawn.room.name] = maxUtility;
                    Memory.utilityUnitCount[spawn.room.name] = 0;
                    console.log("calculated maxUtility=" + maxUtility);
                }

                if (type.name === "utility") {
                    Memory.utilityUnitCount[spawn.room.name] = seekTypes.length;
                }

                if (type.name === this.UTILITY.name && null != Memory.utilityMaxCount[spawn.room.name]) {
                    type.maxCount = Memory.utilityMaxCount[spawn.room.name];
                }

                if (seekTypes.length < type.maxCount) {
                    if ((type.name === this.COMBAT.name && Memory.utilityUnitCount[spawn.room.name] < Memory.utilityMaxCount[spawn.room.name]) || (type.name === this.COMBAT.name && spawn.room.controller.level < 3)) {
                        console.log('Not building combat yet, reason, not enough utility or room.controller.level < 3');
                        continue;
                    }

                    if ((type.name === this.HEAL.name && Memory.utilityUnitCount[spawn.room.name] < Memory.utilityMaxCount[spawn.room.name]) || (type.name === this.HEAL.name && spawn.room.controller.level < 3)) {
                        console.log('Not building heal yet, reason, not enough utility or room.controller.level < 3');
                        continue;
                    }

                    if ((type.name === this.CLAIM.name && Memory.utilityUnitCount[spawn.room.name] < Memory.utilityMaxCount[spawn.room.name]) || (type.name === this.CLAIM.name && spawn.room.controller.level < 3)) {
                        console.log('Not building claimer yet, reason, not enough utility or room.controller.level < 3');
                        continue;
                    }

                    var spawnResult = spawn.spawnCustom(type, spawn.room.energyCapacityAvailable, spawn.name);
                    if (Memory.utilityUnitCount[spawn.room.name] <= 1) {
                        spawnResult = spawn.spawnCustom(type, spawn.room.energyAvailable, spawn.name);
                    }
                    if (!(spawnResult < 0)) {
                        console.log('Spawned new wanted type : ' + type.name);
                    } else {
                        console.log('Error spawning wanted type : ' + type.name + ' Error=' + spawnResult);
                    }

                }
            }
        }
    },

    calcMaxUtility: function (room) {
        if (null == Memory.maxUtilityBase || null == Memory.maxUtilityBase[room.name] || Game.time % 16384 === 0) {
            Memory.maxUtilityBase = {};
            Memory.maxUtilityBase[room.name] = {};
            Memory.maxUtilityBase[room.name].baseValue = 7;
            Memory.maxUtilityBase[room.name].currentValue = 7;
        }
        
        var result = Math.floor((Memory.maxUtilityBase[room.name].currentValue - room.controller.level) / 2); // arbitrary min value
        // var energySources = helperEnergy.findAllRoomEnergySources(helperRoom.getRoom());
        var mineSpots = helperEnergy.countEnergyMineSpots(room);
        console.log("mineSpots=" + mineSpots);
        result += Math.floor(mineSpots * 1.7);
        console.log("calcMaxUtility=" + result);
        return result;
    }


};


module.exports = rolesSetup;