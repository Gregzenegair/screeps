var helperCreep = require('helper.creep');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
            filter: (structure) => {
                return structure.my;
            }
        });

        if (target) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                var moveToResult = helperCreep.moveTo(creep, target);
            }
        }
        return target;
    },

    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathToSources: function (room) {
        var spawn = this.findSpawn(room);
        var paths = [];
        if (null != spawn) {
            var targets = room.find(FIND_SOURCES);
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                paths[i] = spawn.pos.findPathTo(target, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false,
                    swampCost: 1,
                    plainCost: 1
                });
            }
        }
        return paths;
    },

    findPathSourcesToSources: function (room) {
        var targets = room.find(FIND_SOURCES);
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
                paths.push(target0.pos.findPathTo(target1, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false,
                    swampCost: 1,
                    plainCost: 1
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
        var spawn = this.findSpawn(room);
        var targets = room.find(FIND_MY_STRUCTURES);
        var paths = [];
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            paths[i] = spawn.pos.findPathTo(target, {
                ignoreCreeps: true,
                ignoreDestructibleStructures: false,
                ignoreRoads: false,
                range: 1,
                swampCost: 1,
                plainCost: 1
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
        var spawn = this.findSpawn(room);
        var paths = [];

        var exits = Game.map.describeExits(room.name);
        for (var name in exits) {
            var targets = [];
            var otherRoom = Game.rooms[exits[name]];
            if (otherRoom) {
                targets = otherRoom.find(FIND_SOURCES);
            }

            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                paths.push(spawn.pos.findPathTo(target, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false
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
    findPathExitsToSources: function (room) {
        var spawn = this.findSpawn(room);
        var paths = [];

        var exits = Game.map.describeExits(room.name);
        for (var name in exits) {
            var targets = [];
            var exit = exits[name];
            var exitDir;
            var otherRoom = Game.rooms[exit];
            if (otherRoom) {
                targets = otherRoom.find(FIND_SOURCES);
            }

            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                paths.push(exitDir.pos.findPathTo(target, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false
                }));
            }
        }

        return paths;
    }

};

module.exports = roleBuilder;