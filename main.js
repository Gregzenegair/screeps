var roleUtility = require('role.utility');

var roleCombat = require('role.combat');

var roleClaimer = require('role.claimer');

var roleHealer = require('role.healer');

var roleTowers = require('role.towers');

var rolesSetup = require('roles.setup');

var helperRoom = require('helper.room');

var energyHelper = require('helper.energy');

module.exports.loop = function () {

    if (null == Memory.hasBeenUnderAttack) {
        Memory.hasBeenUnderAttack = 0;
    }

    var hasBeenUnderAttack = false;
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.hits < creep.hitsMax || Memory.hasBeenUnderAttack > 0) {
            hasBeenUnderAttack = true;
            Memory.hasBeenUnderAttack = 10;
            break;
        }
    }
    var startCpu = Game.cpu.getUsed();
    rolesSetup.spawn(rolesSetup.COMBAT2);

    rolesSetup.spawn(rolesSetup.CLAIM);

//    if (hasBeenUnderAttack) {
    rolesSetup.spawn(rolesSetup.COMBAT);
//    }

    var spawnUtilityResult = rolesSetup.spawn(rolesSetup.UTILITY);
    var elapsed = Game.cpu.getUsed() - startCpu;
//    console.log('Spawns used ' + elapsed + ' CPU time');
    var combatUnitCount = 0;

    startCpu = Game.cpu.getUsed();
    for (var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
        if (creep.memory.role && creep.memory.role.indexOf(rolesSetup.UTILITY.name) > -1) {
            roleUtility.run(creep);
        }

        if (creep.memory.role === rolesSetup.CLAIM.name) {
            roleClaimer.run(creep, creep.room);
        }

        if (creep.memory.role === rolesSetup.COMBAT.name) {
            combatUnitCount++;
            roleCombat.run(creep, hasBeenUnderAttack, Memory.combatUnitCount / Memory.roomWithCombatUnit >= rolesSetup.COMBAT.maxCount);
        }

        if (creep.memory.role === rolesSetup.HEAL.name) {
            roleHealer.run(creep);
        }
    }

    Memory.combatUnitCount = combatUnitCount;

    if (null == Memory.pathBuiltAroundSources || null == Memory.pathBuilt || Game.time % 2048 === 0) {
        Memory.pathBuiltAroundSources = {};
        Memory.pathBuilt = {};
    }

    roleTowers.run();

    elapsed = Game.cpu.getUsed() - startCpu;
//    console.log('Creep runs have used ' + elapsed + ' CPU time');

    if (Game.time % 256 === 0) {
        Memory.lastWantedBuild = {};

        Memory.hasBeenUnderAttack--;
        var roomWithCombatUnit = 0;
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            var sources = room.find(FIND_SOURCES);

            if (room.controller && room.controller.level > 2) {
                roomWithCombatUnit++;
            }

            if (null != room && null == helperRoom.findDeposit(room)) {
                var spawn = helperRoom.findSpawn(room);
                if (spawn) {
                    var newPosX = spawn.pos.x + Math.myRandom(-12, 12);
                    var newPosY = spawn.pos.y + Math.myRandom(-12, 12);
                    newPosX = newPosX < 0 ? 0 : newPosX;
                    newPosY = newPosY < 0 ? 0 : newPosY;
                    newPosX = newPosX > 49 ? 49 : newPosX;
                    newPosY = newPosY > 49 ? 49 : newPosY;

                    // for debug purpose, or to use somewhere else
                    var scanneds = room.lookAt(newPosX, newPosY);
                    Memory.lastWantedBuild[room.name] = scanneds;
                    // this allow to not build on roads
                    var canBuild = false;
                    for (var i = 0; i < scanneds.length; i++) {
                        if (scanneds[i].type == "structure" && scanneds[i].structure.structureType == "road") {
                            canBuild = true;
                            break;
                        }
                    }

                    var constructResult = 0;
                    if (canBuild) {

                        constructResult = room.createConstructionSite(newPosX, newPosY, STRUCTURE_EXTENSION);

                        if (constructResult < 0) {
                            constructResult = room.createConstructionSite(newPosX, newPosY, STRUCTURE_TOWER);
                        }
                    }

                    var canBuildPaths = (constructResult < 0 && room.controller.level > 2);
                    if ((canBuildPaths && !Memory.pathBuilt[room.name])) {
                        var pathsSources = helperRoom.findPathToSources(room);
                        var pathsMyStructures = helperRoom.findPathMyStructures(room);
                        var pathsExits = helperRoom.findPathExits(room);
                        var paths = pathsSources.concat(pathsMyStructures).concat(pathsExits);

                        for (var i = 0; i < paths.length; i++) {
                            var path = paths[i];
                            for (var j = 0; j < path.length; j++) {
                                var p = path[j];
                                constructResult = room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
                            }
                        }

                        Memory.pathBuilt[room.name] = true;
                    }

                }
            }


            if (room.controller && null != sources && sources.length > 0) { // ensure there is a controller before trying to build a spawn
                // calc average between spawn and sources :
                var avX = 0;
                var avY = 0;

                for (var j = 0; j < sources.length; j++) {
                    var source = sources[j];
                    avX += source.pos.x;
                    avY += source.pos.y;
                }
                avX += room.controller.pos.x;
                avY += room.controller.pos.y;

                avX = Math.floor(avX / sources.length);
                avY = Math.floor(avY / sources.length);

                var coords = energyHelper.getCoordsAround(avX, avY);

                for (var i = 0; i < coords.length; i++) {
                    var coord = coords[i];
                    if (0 === Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) { //0 is plain
                        var constructResult = room.createConstructionSite(avX, avY, STRUCTURE_SPAWN);
                        console.log("building spawn resulted=" + constructResult);
                        if (constructResult === ERR_INVALID_TARGET) {
                            var newPosX = room.controller.pos.x + Math.myRandom(-12, 12);
                            var newPosY = room.controller.pos.y + Math.myRandom(-12, 12);
                            newPosX = newPosX < 0 ? 0 : newPosX;
                            newPosY = newPosY < 0 ? 0 : newPosY;
                            newPosX = newPosX > 49 ? 49 : newPosX;
                            newPosY = newPosY > 49 ? 49 : newPosY;
                            constructResult = room.createConstructionSite(newPosX, newPosY, STRUCTURE_SPAWN);
                            console.log("building spawn resulted=" + constructResult);
                        }
                    }
                }

                /**
                 * For each source build roads around
                 */
                if (!Memory.pathBuiltAroundSources[room.name]) {
                    for (var j = 0; j < sources.length; j++) {
                        var source = sources[j];
                        var coords = energyHelper.getCoordsAround(source.pos.x, source.pos.y);
                        for (var i = 0; i < coords.length; i++) {
                            var coord = coords[i];
                            if (0 === Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) {
                                var buildRoad = room.createConstructionSite(coord.x, coord.y, STRUCTURE_ROAD);
                                console.log("Build road around source resulted=" + buildRoad);
                                // should be somehow built only if  Memory.pathBuilt[room] = false
                                // this build roads around  each ressource

                            }

                        }
                    }

                    Memory.pathBuiltAroundSources[room.name] = true;
                }


            } else {
                console.log("No controller or no source found, or nothing to build")
            }


            if (constructResult !== OK && spawnUtilityResult !== OK) { // if nothing to build, make an army TODO: improve algorithm to determine if there is really nothing to build
                // rolesSetup.spawn(rolesSetup.COMBAT);
            }


            // in each possible room with creep or building, try to build a container
            for (var j = 0; j < sources.length; j++) {
                var source = sources[j];
                var constructResult = energyHelper.buildContainerToSource(source, room);
                console.log("building container resulted=" + constructResult);
            }
        }

        Memory.roomWithCombatUnit = roomWithCombatUnit;
    }

}