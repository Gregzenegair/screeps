var helperRoom = require('helper.room');

require('object.extension')();

var roleTowers = {

    /** @param {Creep} creep **/
    run: function () {
        for (var name in Game.rooms) {
            var room = Game.rooms[name];

            if (null == Memory.myTowers || Game.time % 1024 === 0) {
                Memory.myTowers = {};
            }

            if (null == Memory.myTowers[name]) {
                Memory.myTowers[name] = [];
                var foundTowers = room.findInMemory(FIND_MY_STRUCTURES, {
                    filter: {structureType: STRUCTURE_TOWER}
                });

                for (var i = 0; i < foundTowers.length; i++) {
                    var tower = foundTowers[i];
                    Memory.myTowers[name].push(tower);
                }
            }

            for (var i = 0; i < Memory.myTowers[name].length; i++) {
                var tower = Game.getObjectById(Memory.myTowers[name][i].id);

                if (null == tower) {
                    continue;
                }

                if (Game.time % 32 === 0) {

                    var closestHostile;

                    closestHostile = tower.pos.findClosestByRangeInMemory(FIND_HOSTILE_CREEPS);
                    Memory.myTowers[name][i].closestHostile = closestHostile;

                    if (null == closestHostile) {
                        var closestDamagedStructure = tower.pos.findClosestByRangeInMemory(FIND_STRUCTURES, {
                            filter: (structure) => structure.hits < structure.hitsMax / 3 && structure.structureType !== STRUCTURE_WALL
                                        && structure.isActive()
                        });
                        Memory.myTowers[name][i].closestDamagedStructure = closestDamagedStructure;
                    }

                    var closestDamagedCreep;
                    if (null == closestDamagedStructure) {
                        closestDamagedCreep = tower.pos.findClosestByRangeInMemory(FIND_CREEPS, {
                            filter: (creep) => creep.hits < creep.hitsMax
                        });
                        Memory.myTowers[name][i].closestDamagedCreep = closestDamagedCreep;
                    }

                }

                var resultAttack = null;
                if (Memory.myTowers[name][i].closestHostile) {
                    Memory.hasBeenUnderAttack++; // consider that we are under attack
                    resultAttack = tower.attack(Game.getObjectById(Memory.myTowers[name][i].closestHostile.id));
                    console.log("Towers in room [" + name + "] resultAttack=" + resultAttack);
                }

                var resultRepairCreep = null;
                if (((null != resultAttack && resultAttack != OK) || null == resultAttack)
                        && Memory.myTowers[name][i].closestDamagedCreep) {
                    resultRepairCreep = tower.repair(Game.getObjectById(Memory.myTowers[name][i].closestDamagedCreep.id));
//                    console.log("resultRepairCreep=" + resultRepairCreep);
                }

                if (((null != resultRepairCreep && resultRepairCreep != OK) || null == resultRepairCreep
                        && (null != resultAttack && resultAttack != OK) || null == resultAttack)
                        && null != Memory.myTowers[name][i].closestDamagedStructure) {
                    var resultRepairBuilding = tower.repair(Game.getObjectById(Memory.myTowers[name][i].closestDamagedStructure.id));
//                    console.log("resultRepairBuilding=" + resultRepairBuilding);
                }


            }

        }
    }
};

module.exports = roleTowers;