var helperRoom = require('helper.room');

require('object.extension')();

var helperBuild = {

    buildRoutesAround: function (room, sources) {
        if (null == Memory.pathBuiltAroundSources[room.name]
                || !Memory.pathBuiltAroundSources[room.name]) {
            var allCoords = [];
            var spawns = helperRoom.findSpawns(room);
            if (null != spawns) {
                for (var i = 0; i < spawns.length; i++) {
                    var spawn = spawns[i];
                    var spawnCoords = helperRoom.getCoordsAround(spawn.pos.x, spawn.pos.y, 6);
                    allCoords.push(spawnCoords);
                }
            }

            var controller = helperRoom.getMyRoomController(room);
            if (null != controller) {
                var controllerCoords = helperRoom.getCoordsAround(controller.pos.x, controller.pos.y, 2);
                allCoords.push(controllerCoords);
            }

            for (var j = 0; j < sources.length; j++) {
                var source = sources[j];
                var sourceCoords = helperRoom.getCoordsAround(source.pos.x, source.pos.y);
                allCoords.push(sourceCoords);
            }

            for (var i = 0; i < allCoords.length; i++) {
                var coords = allCoords[i];
                for (var j = 0; j < coords.length; j++) {
                    var coord = coords[j];
                    if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) {
                        var canBuild = true;
                        var lookAts = room.lookAt(new RoomPosition(coord.x, coord.y, room.name));
                        for (var j = 0; j < lookAts.length; j++) {
                            var lookAt = lookAts[j];
                            if (null != lookAt.type && lookAt.type === "structure") {
                                canBuild = false;
                            }
                        }

                        if (canBuild) {
                            var buildRoad = room.createConstructionSite(coord.x, coord.y, STRUCTURE_ROAD);
                            console.log("Build road around source resulted=" + buildRoad);
                        }
                    }
                }
            }
            Memory.pathBuiltAroundSources[room.name] = true;
        }
    },

    buildStorage: function (room) {
        if (null == Memory.storageBuilt) {
            Memory.storageBuilt = {};
        }

        if (null != Memory.storageBuilt[room.name] || !Memory.storageBuilt[room.name]) {
            var allCoords = [];
            var spawns = helperRoom.findSpawns(room);
            if (null != spawns) {
                for (var i = 0; i < spawns.length; i++) {
                    var spawn = spawns[i];
                    var spawnCoords = helperRoom.getCoordsAround(spawn.pos.x, spawn.pos.y, 3);
                    allCoords.push(spawnCoords);
                }
            }

            for (var i = 0; i < allCoords.length; i++) {
                var coords = allCoords[i];
                for (var j = 0; j < coords.length; j++) {
                    var coord = coords[j];
                    if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) {
                        var buildStorage = room.createConstructionSite(coord.x, coord.y, STRUCTURE_STORAGE);
                        console.log("Build storage resulted=" + buildStorage);
                        if (buildStorage === OK) {
                            Memory.storageBuilt[room.name] = true;
                            return;
                        }
                    }
                }
            }
        }
    },

    buildContainersController: function (room) {
        helperRoom.memoryStoreContainersController(room);

        if (null == Memory.containerSources[room.name] // If no source container yet, no need to build container for controller
                || null != Memory.containersControllers[room.name]) {
            return;
        }

        var controller = (null != room.controller && room.controller.my) ? room.controller : null;

        if (null != controller) {
            var allCoords = [];

            var controllerCoords = helperRoom.getCoordsAround(controller.pos.x, controller.pos.y, 1); // must be 1
            allCoords.push(controllerCoords);

            for (var i = 0; i < allCoords.length; i++) {
                var coords = allCoords[i];
                for (var j = 0; j < coords.length; j++) {
                    var coord = coords[j];
                    if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) {
                        var buildContainer = room.createConstructionSite(coord.x, coord.y, STRUCTURE_CONTAINER);
                        console.log("Build container controller resulted=" + buildContainer);
                        if (buildContainer === OK) {
                            return;
                        }
                    }
                }
            }
        }
    },

    memoryStoreStorage: function (room) {

        if (null == Memory.storageBuilt || Game.time % 2048 === 0) {
            Memory.storageBuilt = {};
        }

        if (null == Memory.storageBuilt[room.name]) {

            var spawns = helperRoom.findSpawns(room);

            if (null != spawns) {
                for (var i = 0; i < spawns.length; i++) {
                    var spawn = spawns[i];

                    if (null != spawn) {
                        Memory.containersControllers[room.name] = null;

                        var structure = helperRoom.hasAStorageAround(spawn, room);
                        /**
                         * Check if container is built
                         */
                        if (structure.structureType === STRUCTURE_STORAGE) {
                            Memory.containersControllers[room.name] = true;
                        }
                    }
                }
            }
        }
    },

    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathToSources: function (room) {
        var spawn = helperRoom.findSpawn(room);
        var paths = [];
        if (null != spawn) {
            var targets = room.findInMemory(FIND_SOURCES);
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                paths[i] = spawn.pos.findPathToInMemory(target, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false,
                    swampCost: 2,
                    plainCost: 2
                });
            }
        }
        return paths;
    },

    findPathSourcesToSources: function (room) {
        var targets = room.findInMemory(FIND_SOURCES);
        var paths = [];
        if (targets.length > 1) {
            // cycling through sources
            for (var i = 1; i <= targets.length; i++) {
                if (i === targets.length) {
                    var target0 = targets[i - 1];
                    var target1 = targets[0];
                } else {
                    var target0 = targets[i - 1];
                    var target1 = targets[i];
                }
                paths.push(target0.pos.findPathToInMemory(target1, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false,
                    swampCost: 2,
                    plainCost: 2
                }));
            }
        }

        return paths;
    },

    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathMyStructures: function (room) {
        var spawn = helperRoom.findSpawn(room);
        var targets = room.findInMemory(FIND_MY_STRUCTURES);
        var paths = [];
        if (null == spawn) {
            return paths;
        }
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            paths[i] = spawn.pos.findPathToInMemory(target, {
                ignoreCreeps: true,
                ignoreDestructibleStructures: false,
                ignoreRoads: false,
                range: 1,
                swampCost: 2,
                plainCost: 2
            });
        }

        return paths;
    },

    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathExits: function (room) {
        var spawn = helperRoom.findSpawn(room);
        var paths = [];

        if (spawn) {
            var exits = Game.map.describeExits(room.name);
            for (var name in exits) {
                var targets = [];
                var otherRoom = Game.rooms[exits[name]];
                if (otherRoom) {
                    targets = otherRoom.findInMemory(FIND_SOURCES);
                }

                for (var i = 0; i < targets.length; i++) {
                    var target = targets[i];
                    paths.push(spawn.pos.findPathToInMemory(target, {
                        ignoreCreeps: true,
                        ignoreDestructibleStructures: false,
                        ignoreRoads: false
                    }));
                }
            }
        }

        return paths;
    }

};


module.exports = helperBuild;