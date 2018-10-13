var helperRoom = {

    /** @param {Creep} creep **/
    findDeposit: function (room) {

        var targets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
            }
        });

        if (targets.length > 0) {
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                if (target.store < target.storeCapacity) {
                    return target;
                }
            }
        }
        return null;
    },

    findSpawn: function (room) {

        var targets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN);
            }
        });

        if (targets.length > 0) {
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                return target;
            }
        }
        return null;
    },
    
    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathToSources: function (room) {
        var spawn = this.findSpawn(room);
        var targets = room.find(FIND_SOURCES);
        var paths = [];
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            paths[i] = spawn.pos.findPathTo(target, {
                ignoreCreeps: true,
                ignoreDestructibleStructures: false,
                ignoreRoads: true
            });
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
                ignoreRoads: true
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
                    ignoreRoads: true
                }));
            }
        }

        return paths;
    }

};

module.exports = helperRoom;