var helperRoom = require('helper.room');

var roleTowers = {

    /** @param {Creep} creep **/
    run: function () {
        for (var name in Game.rooms) {
            var room = Game.rooms[name];

            if (null == Memory.myTowers || Game.time % 2048 === 0) {
                Memory.myTowers = {};
            }

            if (null == Memory.myTowers[name]) {
                Memory.myTowers[name] = [];
                var foundTowers = room.find(FIND_MY_STRUCTURES, {
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
                    var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => structure.hits < structure.hitsMax / 3 && structure.structureType !== STRUCTURE_WALL
                        && structure.isActive()
                    });
                    Memory.myTowers[name][i].closestDamagedStructure = closestDamagedStructure;


                    var closestDamagedCreep = tower.pos.findClosestByRange(FIND_CREEPS, {
                        filter: (creep) => creep.hits < creep.hitsMax
                    });
                    Memory.myTowers[name][i].closestDamagedCreep = closestDamagedCreep;


                    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                    Memory.myTowers[name][i].closestHostile = closestHostile;
                }

                if (Memory.myTowers[name][i].closestDamagedCreep) {
                    var resultRepairCreep = tower.repair(Game.getObjectById(Memory.myTowers[name][i].closestDamagedCreep.id));
//                    console.log("resultRepairCreep=" + resultRepairCreep);
                }

                if (null != Memory.myTowers[name][i].closestDamagedStructure) {
                    var resultRepairBuilding = tower.repair(Game.getObjectById(Memory.myTowers[name][i].closestDamagedStructure.id));
//                    console.log("resultRepairBuilding=" + resultRepairBuilding);
                }

                if (Memory.myTowers[name][i].closestHostile) {
                    Memory.hasBeenUnderAttack++; // consider taht we are under attack
                    var resultAttack = tower.attack(Game.getObjectById(Memory.myTowers[name][i].closestHostile.id));
                    console.log("resultAttack=" + resultAttack);
                }


            }

        }
    }
};

module.exports = roleTowers;