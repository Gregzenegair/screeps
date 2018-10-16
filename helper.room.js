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

    /**
     * Returns 1 spawn
     * @param {type} room
     * @returns {nm$_helper.room.helperRoom.findSpawn.targets|helperRoom.findSpawn.target}
     */
    findSpawn: function (room) {

        var targets = this.findSpawns(room);

        if (targets.length > 0) {
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                return target;
            }
        }
        return null;
    },

    findSpawns: function (room) {

        var targets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN);
            }
        });

        return targets;
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
    },

    activateSafeMode: function (room) {
        var controller = this.getMyRoomController(room);

        //safeMode
        //safeModeAvailable
        //safeModeCooldown
    },

    getMyRoomController: function (room) {
        if ((null != room.controller
                && room.controller.my)
                || (null != room.controller
                        && room.controller.reservation
                        && room.controller.reservation.username === "Gregzenegair")) {
            return room.controller;
        }
        return null;
    },

    /**
     * coords as a staro, not full squares
     * @param {type} x
     * @param {type} y
     * @param {type} range
     * @returns {Array|helperRoom.getCoordsAround.array|nm$_helper.room.helperRoom.getCoordsAround.array}
     */
    getCoordsAround: function (x, y, range) {
        var array = [];
        if (null == range) {
            range = 1;
        }

        for (var i = 1; i <= range; i++) {
            var xA = x + i;
            var xR = x - i;
            var yA = y + i;
            var yR = y - i;
            array.push({"x": xA, "y": y});
            array.push({"x": xR, "y": y});
            array.push({"x": x, "y": yA});
            array.push({"x": x, "y": yR});
            array.push({"x": xA, "y": yA});
            array.push({"x": xR, "y": yA});
            array.push({"x": xR, "y": yR});
            array.push({"x": xA, "y": yR});

        }


        return array;
    }

};

module.exports = helperRoom;