var roleUtility = require('role.utility');
var roleCombat = require('role.combat');
var roleClaimer = require('role.claimer');
var roleHealer = require('role.healer');
var roleMiner = require('role.miner');
var roleTowers = require('role.towers');
var rolesSetup = require('roles.setup');
var helperRoom = require('helper.room');
var helperEnergy = require('helper.energy');
var helperBuild = require('helper.build');
var helperController = require('helper.controller');

require('object.extension')();

module.exports.loop = function () {

    if (Game.cpu.bucket < 200) {
        console.log("Game.cpu.bucket=" + Game.cpu.bucket);
        console.log("Game.cpu.tickLimit=" + Game.cpu.tickLimit);
        return;
    }

    if (null == Memory.hasBeenUnderAttack) {
        Memory.hasBeenUnderAttack = 0;
    }

    var hasBeenUnderAttack = false;
    for (var name in Game.creeps) {

        var creep = Game.creeps[name];

        if (Memory.hasBeenUnderAttack > 0) {
            hasBeenUnderAttack = true;
        }

        if (creep.hits < creep.hitsMax) {
            hasBeenUnderAttack = true;
            Memory.hasBeenUnderAttack = 10;
            break;
        }
    }
    var startCpu = Game.cpu.getUsed();

    rolesSetup.spawn(rolesSetup.HEALER);

    rolesSetup.spawn(rolesSetup.COMBAT2);

    rolesSetup.spawn(rolesSetup.CLAIMER);

//    if (hasBeenUnderAttack) {
    rolesSetup.spawn(rolesSetup.COMBAT);
//    }

    rolesSetup.spawn(rolesSetup.MINER);

    rolesSetup.spawn(rolesSetup.UTILITY);

    rolesSetup.spawn(rolesSetup.FILLER);

    var elapsed = Game.cpu.getUsed() - startCpu;
//    console.log('Spawns used ' + elapsed + ' CPU time');
    var combatUnitCount = 0;

    startCpu = Game.cpu.getUsed();
    for (var creepName in Game.creeps) {
        var creep = Game.creeps[creepName];
        if (creep.memory.role && creep.memory.role.indexOf(rolesSetup.UTILITY.name) > -1) {
            roleUtility.run(creep);
        }

        if (creep.memory.role === rolesSetup.FILLER.name) {
            roleUtility.run(creep);
        }

        if (creep.memory.role === rolesSetup.MINER.name) {
            roleMiner.run(creep);
        }

        if (creep.memory.role === rolesSetup.CLAIMER.name) {
            roleClaimer.run(creep, creep.room);
        }

        if (creep.memory.role === rolesSetup.COMBAT.name) {
            combatUnitCount++;
            roleCombat.run(creep, hasBeenUnderAttack, Memory.combatUnitCount / Memory.roomWithCombatUnit >= rolesSetup.COMBAT.maxCount);
        }

        if (creep.memory.role === rolesSetup.HEALER.name) {
            roleHealer.run(creep);
        }
    }

    Memory.combatUnitCount = combatUnitCount;

    if (null == Memory.pathBuiltAroundSources || null == Memory.pathBuilt || null == Memory.storageBuilt || Game.time % 2048 === 0) {
        Memory.pathBuiltAroundSources = {};
        Memory.pathBuilt = {};
        Memory.storageBuilt = {};
        Memory.combatExitRoom = null; //TODO: rework this
        Memory.unreachableRooms = [];
    }

    roleTowers.run();

    elapsed = Game.cpu.getUsed() - startCpu;
//    console.log('Creep runs have used ' + elapsed + ' CPU time');

    if (Game.time % 64 === 0) {
        Memory.hasBeenUnderAttack--;

    }

    if (Game.time % 128 === 0) {
        Memory.lastWantedBuild = {};

        var roomWithCombatUnit = 0;
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            var sources = room.findInMemory(FIND_SOURCES);

            if (room.controller && room.controller.level >= 3) {
                roomWithCombatUnit++;
            }

            var constructResult = 0;

            if (null != room && null == helperRoom.findDeposit(room)) {
                var spawn = helperRoom.findSpawn(room);

                if (spawn) {// TODO: move random positionner to a class helper
                    var depositRange
                    if (null != room && null != room.controller) {
                        depositRange = Math.floor(room.controller.level * 4 / 3);
                        depositRange = depositRange < 4 ? 4 : depositRange;
                    } else {
                        depositRange = 3;
                    }
                    var newPosX = spawn.pos.x + Math.myRandom(-depositRange, depositRange);
                    var newPosY = spawn.pos.y + Math.myRandom(-depositRange, depositRange);
                    newPosX = newPosX < 0 ? 0 : newPosX;
                    newPosY = newPosY < 0 ? 0 : newPosY;
                    newPosX = newPosX > 49 ? 49 : newPosX;
                    newPosY = newPosY > 49 ? 49 : newPosY;

                    // for debug purpose, or to use somewhere else
                    var scanneds = room.lookAt(newPosX, newPosY);
                    Memory.lastWantedBuild[room.name] = scanneds;
                    // this allow to not build on roads
                    var canBuild = true;
                    for (var i = 0; i < scanneds.length; i++) {
                        if (scanneds[i].type == "structure" && scanneds[i].structure.structureType == "road") {
                            canBuild = false;
                            break;
                        }
                    }

                    if (canBuild) {
                        constructResult = room.createConstructionSite(newPosX, newPosY, STRUCTURE_EXTENSION);

                        if (constructResult < 0) {
                            constructResult = room.createConstructionSite(newPosX, newPosY, STRUCTURE_TOWER);
                        }
                    }
                }

                var canBuildPaths = (constructResult <= 0 && null != room && null != room.controller && room.controller.level >= 2)
                        || helperController.isMyReservedController(room, 16);

                if ((canBuildPaths && !Memory.pathBuilt[room.name])) {
                    var pathsSources = helperBuild.findPathToSources(room);
                    var pathsMyStructures = helperBuild.findPathMyStructures(room);
                    var pathsExits = helperBuild.findPathExits(room);
                    var paths = pathsSources.concat(pathsMyStructures).concat(pathsExits);

                    for (var i = 0; i < paths.length; i++) {
                        var path = paths[i];
                        for (var j = 0; j < path.length; j++) {
                            var p = path[j];
                            if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(room.name).get(p.x, p.y)) {
                                constructResult = room.createConstructionSite(p.x, p.y, STRUCTURE_ROAD);
                            }
                        }
                    }

                    Memory.pathBuilt[room.name] = true;
                }

                /**
                 * For each source build roads around
                 */
                if (canBuildPaths) {
                    helperBuild.buildRoutesAround(room, sources);
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

                var coords = helperRoom.getCoordsAround(avX, avY);

                for (var i = 0; i < coords.length; i++) {
                    var coord = coords[i];
                    if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) { //0 is plain
                        var constructResult = room.createConstructionSite(avX, avY, STRUCTURE_SPAWN);
                        console.log("building spawn resulted=" + constructResult);
                        if (constructResult !== OK) {
                            var newPosX = room.controller.pos.x + Math.myRandom(-6, 6);
                            var newPosY = room.controller.pos.y + Math.myRandom(-6, 6);
                            newPosX = newPosX < 0 ? 0 : newPosX;
                            newPosY = newPosY < 0 ? 0 : newPosY;
                            newPosX = newPosX > 49 ? 49 : newPosX;
                            newPosY = newPosY > 49 ? 49 : newPosY;
                            constructResult = room.createConstructionSite(newPosX, newPosY, STRUCTURE_SPAWN);
                            console.log("building spawn resulted=" + constructResult);
                        }
                    }
                }

            } else {
                console.log("No controller or no source found, or nothing to build")
            }


            if (constructResult !== OK) { // if nothing to build, make an army TODO: improve algorithm to determine if there is really nothing to build
                // rolesSetup.spawn(rolesSetup.COMBAT);
            }

            if (room.controller && room.controller.level >= 6) {
                helperBuild.buildStorage(room);
            }

            // in each possible room with creep or building, try to build a container
            for (var j = 0; j < sources.length; j++) {
                var source = sources[j];
                var constructResult = helperEnergy.buildContainerToSource(source, room);
                console.log("building container resulted=" + constructResult);
            }
        }

        Memory.roomWithCombatUnit = roomWithCombatUnit;
    }

};