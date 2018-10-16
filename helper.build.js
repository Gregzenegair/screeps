var helperRoom = require('helper.room');

var helperBuild = {

    buildRoutesAround: function (room, sources) {
        if (!Memory.pathBuiltAroundSources[room.name]) {
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
                        var buildRoad = room.createConstructionSite(coord.x, coord.y, STRUCTURE_ROAD);
                        console.log("Build road around source resulted=" + buildRoad);
                        // should be somehow built only if  Memory.pathBuilt[room] = false
                        // this build roads around  each ressource

                    }

                }

            }
            Memory.pathBuiltAroundSources[room.name] = true;
        }
    }
};


module.exports = helperBuild;